# ============================================================
# STAR — Neo4j Service
# Graph persistence with in-memory NetworkX fallback
# ============================================================
from __future__ import annotations

import logging
from collections import defaultdict
from typing import Any, Dict, List, Optional, Tuple

import networkx as nx

from app.core.config import settings
from app.models.responses import EdgeResponse, GraphDataResponse, NodeResponse, TraversalPathResponse

logger = logging.getLogger(__name__)


class Neo4jService:
    """
    Dual-mode graph service:
    - PRIMARY: Neo4j via bolt connection (when NEO4J_URI is reachable)
    - FALLBACK: In-memory NetworkX DiGraph (always available)

    Switching is transparent — same interface regardless of mode.
    """

    def __init__(self) -> None:
        self._driver = None
        self._use_neo4j = False
        self._graph: nx.DiGraph = nx.DiGraph()
        self._node_meta: Dict[str, Dict] = {}  # node_id → metadata
        self._edge_meta: Dict[Tuple, Dict] = {}  # (src, dst, tx_id) → metadata

    def connect(self) -> None:
        """Try Neo4j (Aura-compatible); fall back to in-memory graph on failure."""
        max_attempts = getattr(settings, "NEO4J_RETRY_ATTEMPTS", 3)
        backoff_base = getattr(settings, "NEO4J_RETRY_BACKOFF", 1)
        last_exc = None

        for attempt in range(1, max_attempts + 1):
            try:
                import time
                from neo4j import GraphDatabase  # type: ignore

                self._driver = GraphDatabase.driver(
                    settings.NEO4J_URI,
                    auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                )

                # verify_connectivity() only checks the TCP+auth layer.
                # We also run a lightweight Cypher to confirm database routing works.
                # CRITICAL: do NOT pass database= here — Aura auto-selects home DB.
                with self._driver.session() as session:
                    session.run("RETURN 1").consume()

                self._use_neo4j = True
                logger.info("✅ Neo4j connected and query verified at %s (attempt %d)",
                            settings.NEO4J_URI, attempt)
                self._ensure_constraints()
                return

            except Exception as e:
                last_exc = e
                if self._driver:
                    try:
                        self._driver.close()
                    except Exception:
                        pass
                    self._driver = None
                logger.warning("Neo4j connect attempt %d/%d failed: %s", attempt, max_attempts, e)
                if attempt < max_attempts:
                    sleep_time = backoff_base * attempt
                    logger.info("Retrying Neo4j in %ds...", sleep_time)
                    time.sleep(sleep_time)

        logger.warning(
            "Neo4j not available after %d attempts (%s). Using in-memory NetworkX graph.",
            max_attempts, last_exc
        )
        self._use_neo4j = False

    def _ensure_constraints(self) -> None:
        """Create Neo4j indexes/constraints if not present."""
        if not self._use_neo4j:
            return
        try:
            # No database= argument — Aura auto-routes to home database
            with self._driver.session() as session:
                session.run(
                    "CREATE CONSTRAINT IF NOT EXISTS FOR (a:Account) REQUIRE a.id IS UNIQUE"
                )
        except Exception as e:
            logger.warning("Could not create Neo4j constraints (non-fatal): %s", e)

    # ── Upsert ────────────────────────────────────────────────

    def upsert_transaction(
        self,
        tx_id: str,
        from_account: str,
        to_account: str,
        amount: float,
        currency: str = "USD",
        payment_format: str = "SWIFT",
        timestamp: Optional[float] = None,
        risk_score: float = 0.0,
        fraud_probability: float = 0.0,
        suspicious: bool = False,
    ) -> None:
        """Store a transaction edge (and its nodes) in the graph."""
        node_meta_src = self._node_meta.get(from_account, {
            "id": from_account, "name": from_account, "risk": 0.0,
            "anomaly_score": 0.0, "risk_level": "normal", "community": 0,
            "type": "personal", "flagged": False,
        })
        node_meta_dst = self._node_meta.get(to_account, {
            "id": to_account, "name": to_account, "risk": 0.0,
            "anomaly_score": 0.0, "risk_level": "normal", "community": 0,
            "type": "personal", "flagged": False,
        })

        # Update risk on source node
        if risk_score > node_meta_src.get("risk", 0.0):
            node_meta_src["risk"] = risk_score
            node_meta_src["anomaly_score"] = fraud_probability
            node_meta_src["risk_level"] = self._score_to_level(risk_score)
            if suspicious:
                node_meta_src["flagged"] = True

        self._node_meta[from_account] = node_meta_src
        self._node_meta[to_account] = node_meta_dst

        # In-memory graph
        self._graph.add_node(from_account, **node_meta_src)
        self._graph.add_node(to_account, **node_meta_dst)
        self._graph.add_edge(
            from_account, to_account,
            tx_id=tx_id, amount=amount, currency=currency,
            payment_format=payment_format, timestamp=timestamp,
            suspicious=suspicious, fraud_probability=fraud_probability,
            weight=fraud_probability + 0.01,
        )

        if self._use_neo4j:
            self._neo4j_upsert(
                from_account, to_account, tx_id, amount, currency,
                payment_format, timestamp, risk_score, suspicious
            )

    def _neo4j_upsert(
        self, from_id: str, to_id: str, tx_id: str, amount: float,
        currency: str, fmt: str, ts: Optional[float], risk: float, suspicious: bool
    ) -> None:
        cypher = """
        MERGE (a:Account {id: $from_id})
        MERGE (b:Account {id: $to_id})
        MERGE (a)-[r:SENT {tx_id: $tx_id}]->(b)
        SET r.amount = $amount,
            r.currency = $currency,
            r.format = $fmt,
            r.timestamp = $ts,
            r.risk_score = $risk,
            r.suspicious = $suspicious,
            a.risk_score = CASE WHEN $risk > coalesce(a.risk_score, 0) THEN $risk ELSE a.risk_score END
        """
        with self._driver.session() as session:  # Aura: no database= arg
            session.run(cypher, from_id=from_id, to_id=to_id, tx_id=tx_id,
                        amount=amount, currency=currency, fmt=fmt,
                        ts=ts, risk=risk, suspicious=suspicious)

    # ── Subgraph ──────────────────────────────────────────────

    def get_subgraph(self, account_id: str, depth: int = 2) -> GraphDataResponse:
        """Return the neighborhood of account_id up to `depth` hops."""
        if self._use_neo4j:
            return self._neo4j_subgraph(account_id, depth)
        return self._nx_subgraph(account_id, depth)

    def _nx_subgraph(self, account_id: str, depth: int) -> GraphDataResponse:
        if account_id not in self._graph:
            return GraphDataResponse(nodes=[], links=[], total_nodes=0, total_edges=0, suspicious_edges=0)

        # BFS up to `depth`
        visited = {account_id}
        frontier = {account_id}
        for _ in range(depth):
            new_frontier = set()
            for node in frontier:
                new_frontier |= set(self._graph.successors(node))
                new_frontier |= set(self._graph.predecessors(node))
            new_frontier -= visited
            visited |= new_frontier
            frontier = new_frontier

        sub = self._graph.subgraph(visited)
        nodes = [
            NodeResponse(
                id=n,
                name=self._node_meta.get(n, {}).get("name", n),
                risk=self._node_meta.get(n, {}).get("risk", 0.0),
                anomaly_score=self._node_meta.get(n, {}).get("anomaly_score", 0.0),
                risk_level=self._node_meta.get(n, {}).get("risk_level", "normal"),
                community=self._node_meta.get(n, {}).get("community", 0),
                type=self._node_meta.get(n, {}).get("type", "personal"),
                flagged=self._node_meta.get(n, {}).get("flagged", False),
                x=None, y=None, size=None,
            )
            for n in sub.nodes()
        ]
        edges = []
        suspicious_count = 0
        for src, dst, data in sub.edges(data=True):
            susp = data.get("suspicious", False)
            if susp:
                suspicious_count += 1
            edges.append(EdgeResponse(
                source=src, target=dst,
                amount=data.get("amount", 0.0),
                suspicious=susp,
                type=data.get("payment_format", "wire"),
                weight=data.get("weight", 0.1),
                fraud_probability=data.get("fraud_probability", 0.0),
            ))

        return GraphDataResponse(
            nodes=nodes, links=edges,
            total_nodes=len(nodes), total_edges=len(edges),
            suspicious_edges=suspicious_count,
        )

    def _neo4j_subgraph(self, account_id: str, depth: int) -> GraphDataResponse:
        cypher = f"""
        MATCH path = (a:Account {{id: $account_id}})-[:SENT*1..{depth}]-(b:Account)
        UNWIND nodes(path) AS n
        UNWIND relationships(path) AS r
        WITH collect(DISTINCT n) AS ns, collect(DISTINCT r) AS rs
        RETURN ns, rs
        """
        with self._driver.session() as session:  # Aura: no database= arg
            result = session.run(cypher, account_id=account_id)
            record = result.single()
            if not record:
                return GraphDataResponse(nodes=[], links=[], total_nodes=0, total_edges=0, suspicious_edges=0)
            nodes = [
                NodeResponse(
                    id=n["id"], name=n.get("name", n["id"]),
                    risk=n.get("risk_score", 0.0), anomaly_score=0.0,
                    risk_level="normal", community=0, type="personal",
                    flagged=n.get("suspicious", False),
                    x=None, y=None, size=None,
                )
                for n in record["ns"]
            ]
            edges = [
                EdgeResponse(
                    source=r.start_node["id"], target=r.end_node["id"],
                    amount=r.get("amount", 0.0),
                    suspicious=r.get("suspicious", False),
                    type=r.get("format", "wire"),
                    weight=r.get("risk_score", 0.1),
                    fraud_probability=None,
                )
                for r in record["rs"]
            ]
            sus = sum(1 for e in edges if e.suspicious)
            return GraphDataResponse(
                nodes=nodes, links=edges,
                total_nodes=len(nodes), total_edges=len(edges),
                suspicious_edges=sus,
            )

    # ── Path Tracing ──────────────────────────────────────────

    def trace_path(self, from_id: str, to_id: str) -> Optional[TraversalPathResponse]:
        """Find shortest path between two accounts."""
        try:
            if self._use_neo4j:
                return self._neo4j_path(from_id, to_id)
            path = nx.shortest_path(self._graph, from_id, to_id)
            total = sum(
                self._graph[path[i]][path[i + 1]].get("amount", 0.0)
                for i in range(len(path) - 1)
            )
            is_circular = path[0] == path[-1] if len(path) > 1 else False
            return TraversalPathResponse(
                nodes=path, edges=[], total_amount=total,
                hops=len(path) - 1, is_circular=is_circular,
                risk_score=0.0,
                path_explanation=f"Shortest path from {from_id} to {to_id} with {len(path)-1} hops",
            )
        except nx.NetworkXNoPath:
            return None
        except Exception as e:
            logger.error("Path trace failed: %s", e)
            return None

    def _neo4j_path(self, from_id: str, to_id: str) -> Optional[TraversalPathResponse]:
        cypher = """
        MATCH path = shortestPath((a:Account {id: $from_id})-[:SENT*..10]->(b:Account {id: $to_id}))
        RETURN [n IN nodes(path) | n.id] AS node_ids,
               reduce(total=0, r IN relationships(path) | total + r.amount) AS total_amount,
               length(path) AS hops
        """
        with self._driver.session() as session:  # Aura: no database= arg
            result = session.run(cypher, from_id=from_id, to_id=to_id)
            record = result.single()
            if not record:
                return None
            nodes = record["node_ids"]
            is_circular = nodes[0] == nodes[-1] if nodes else False
            return TraversalPathResponse(
                nodes=nodes, edges=[], total_amount=record["total_amount"],
                hops=record["hops"], is_circular=is_circular,
                risk_score=0.0,
                path_explanation=f"Path from {from_id} to {to_id} — {record['hops']} hops",
            )

    # ── Community Detection ───────────────────────────────────

    def community_detection(self) -> Dict[str, int]:
        """Assign community IDs to all nodes. Returns {node_id: community_id}."""
        if not self._graph.nodes:
            return {}
        try:
            import community as community_louvain  # type: ignore
            undirected = self._graph.to_undirected()
            partition = community_louvain.best_partition(undirected)
            # Update node metadata
            for node_id, comm_id in partition.items():
                if node_id in self._node_meta:
                    self._node_meta[node_id]["community"] = comm_id
            return partition
        except ImportError:
            # Fallback: connected components
            undirected = self._graph.to_undirected()
            communities = {}
            for i, comp in enumerate(nx.connected_components(undirected)):
                for node in comp:
                    communities[node] = i
            return communities

    # ── Graph Statistics ──────────────────────────────────────

    def get_graph_metrics(self, account_id: str) -> Dict[str, float]:
        """Compute NetworkX centrality metrics for a given account."""
        if account_id not in self._graph:
            return {}
        try:
            undirected = self._graph.to_undirected()
            metrics = {
                "out_degree": float(self._graph.out_degree(account_id)),
                "in_degree": float(self._graph.in_degree(account_id)),
            }
            if len(self._graph.nodes) > 1:
                pr = nx.pagerank(self._graph, weight="weight")
                metrics["pagerank"] = float(pr.get(account_id, 0.0))
                if len(undirected.nodes) < 500:  # skip for large graphs
                    bc = nx.betweenness_centrality(undirected)
                    cc = nx.closeness_centrality(undirected)
                    cl = nx.clustering(undirected)
                    metrics["betweenness"] = float(bc.get(account_id, 0.0))
                    metrics["closeness"] = float(cc.get(account_id, 0.0))
                    metrics["clustering_coeff"] = float(cl.get(account_id, 0.0))
            return metrics
        except Exception as e:
            logger.warning("Could not compute graph metrics: %s", e)
            return {}

    def get_full_graph(self) -> GraphDataResponse:
        """Return the entire in-memory graph for visualization."""
        nodes = [
            NodeResponse(
                id=n, name=self._node_meta.get(n, {}).get("name", n),
                risk=self._node_meta.get(n, {}).get("risk", 0.0),
                anomaly_score=self._node_meta.get(n, {}).get("anomaly_score", 0.0),
                risk_level=self._node_meta.get(n, {}).get("risk_level", "normal"),
                community=self._node_meta.get(n, {}).get("community", 0),
                type=self._node_meta.get(n, {}).get("type", "personal"),
                flagged=self._node_meta.get(n, {}).get("flagged", False),
                x=None, y=None, size=None,
            )
            for n in self._graph.nodes()
        ]
        edges = []
        sus = 0
        for src, dst, data in self._graph.edges(data=True):
            s = data.get("suspicious", False)
            if s:
                sus += 1
            edges.append(EdgeResponse(
                source=src, target=dst,
                amount=data.get("amount", 0.0),
                suspicious=s,
                type=data.get("payment_format", "wire"),
                weight=data.get("weight", 0.1),
                fraud_probability=data.get("fraud_probability"),
            ))
        return GraphDataResponse(
            nodes=nodes, links=edges,
            total_nodes=len(nodes), total_edges=len(edges),
            suspicious_edges=sus,
        )

    @staticmethod
    def _score_to_level(score: float) -> str:
        # Use centralized risk thresholds from config
        if score < settings.RISK_THRESHOLD_NORMAL:
            return "normal"
        if score < settings.RISK_THRESHOLD_MONITORING:
            return "monitoring"
        if score < settings.RISK_THRESHOLD_MODERATE:
            return "moderate"
        if score < settings.RISK_THRESHOLD_HIGH:
            return "high"
        return "critical"

    @property
    def is_connected(self) -> bool:
        return self._use_neo4j

    @property
    def node_count(self) -> int:
        return self._graph.number_of_nodes()

    @property
    def edge_count(self) -> int:
        return self._graph.number_of_edges()


# ── Singleton ─────────────────────────────────────────────────
neo4j_service = Neo4jService()
