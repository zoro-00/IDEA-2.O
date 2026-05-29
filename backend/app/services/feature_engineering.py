# ============================================================
# STAR — Feature Engineering Service
# Computes 29 IF features + 8 TGNN edge features from raw txns
# ============================================================
from __future__ import annotations

import math
import time
from collections import defaultdict
from datetime import datetime, timezone
from functools import lru_cache
from typing import Dict, List, Optional, Tuple

from app.models.requests import AMLFeaturesRequest, RawTransactionRequest


# ── Currency / Format Encoding ────────────────────────────────
CURRENCY_MAP: Dict[str, int] = {
    "USD": 0, "EUR": 1, "GBP": 2, "CHF": 3,
    "AED": 4, "SGD": 5, "HKD": 6, "OTHER": 7,
}
FORMAT_MAP: Dict[str, int] = {
    "SWIFT": 0, "ACH": 1, "WIRE": 2, "FEDWIRE": 3,
    "RTGS": 4, "CASH": 5, "CRYPTO": 6, "OTHER": 7,
}

# Above-threshold structuring window (just below CTR limit)
STRUCTURING_LOWER = 8_000.0
STRUCTURING_UPPER = 10_000.0


class FeatureEngineeringService:
    """
    Converts raw transaction history into the 29 features expected
    by the Isolation Forest model, and the 8 edge features for TGNN.
    """

    # ── 29 Isolation Forest Features ──────────────────────────

    def compute_if_features(
        self,
        account_id: str,
        transactions: List[RawTransactionRequest],
        graph_metrics: Optional[Dict] = None,
    ) -> Dict[str, float]:
        """
        Compute all 29 features for a given account from its transaction history.
        graph_metrics: optional dict with pagerank, betweenness, closeness, etc.
                       from Neo4j/NetworkX; defaults to 0 if not available.
        """
        if not transactions:
            return self._zero_features(graph_metrics)

        # Partition into sent/received
        sent = [t for t in transactions if t.from_account == account_id]
        received = [t for t in transactions if t.to_account == account_id]
        all_txns = transactions

        amounts = [t.amount for t in sent]
        timestamps = sorted([t.timestamp or 0.0 for t in all_txns])

        counterparties = set()
        for t in sent:
            counterparties.add(t.to_account)
        for t in received:
            counterparties.add(t.from_account)

        txn_count = float(len(all_txns))
        avg_amount = float(sum(amounts) / len(amounts)) if amounts else 0.0

        # Structuring: txns between 8k–10k
        structuring_txns = [a for a in amounts if STRUCTURING_LOWER < a < STRUCTURING_UPPER]
        structuring_ratio = len(structuring_txns) / max(len(sent), 1)

        # Fan-out: unique receivers / total sent
        unique_receivers_list = {t.to_account for t in sent}
        fan_out_ratio = len(unique_receivers_list) / max(len(sent), 1)

        # Velocity: txns per hour (using timestamp range)
        txn_velocity = self._compute_velocity(timestamps)

        # Night ratio: txns between 22:00–06:00 UTC
        night_ratio = self._compute_night_ratio(all_txns)

        # Cross-bank ratio: different currencies
        currencies_used = {t.currency for t in all_txns}
        cross_bank_ratio = float(len(currencies_used) - 1) / max(len(currencies_used), 1)

        # Dormancy: days since last transaction before current window
        dormancy_days = self._compute_dormancy(timestamps)

        # Burst score: coefficient of variation of inter-arrival times
        burst_score = self._compute_burst_score(timestamps)

        # Layering depth: max chain length (simplified)
        layering_depth = self._compute_layering_depth(transactions, account_id)

        # Circular flag: money returned to sender
        circular_flag = self._detect_circular(transactions, account_id)

        # Geo entropy: entropy over jurisdictions / currencies
        geo_entropy = self._compute_entropy([t.currency for t in all_txns])

        # Counterparty diversity: unique counterparties / total txns
        counterparty_diversity = len(counterparties) / max(txn_count, 1)

        # Amount variance
        amount_variance = float(self._variance(amounts)) if len(amounts) > 1 else 0.0

        # Hour entropy: entropy over hours of day
        hour_entropy = self._compute_entropy([
            str(datetime.fromtimestamp(t.timestamp or 0, tz=timezone.utc).hour)
            for t in all_txns
        ])

        # Weekend ratio
        weekend_ratio = sum(
            1 for t in all_txns
            if datetime.fromtimestamp(t.timestamp or 0, tz=timezone.utc).weekday() >= 5
        ) / max(txn_count, 1)

        # Rapid succession: pairs of txns < 60s apart
        rapid_succession = self._rapid_succession_count(timestamps) / max(txn_count, 1)

        # Heuristic mule/shell/smurfing scores
        mule_score = min(1.0, fan_out_ratio * burst_score)
        shell_indicator = 1.0 if len(currencies_used) > 3 and txn_count > 20 else 0.0
        smurfing_flag = min(1.0, structuring_ratio * 3)

        # Reactivation: dormancy × burst
        reactivation_score = min(1.0, (dormancy_days / 365.0) * burst_score)

        # Graph metrics (from Neo4j/NetworkX if available)
        gm = graph_metrics or {}
        pagerank = gm.get("pagerank", 0.0)
        out_degree = gm.get("out_degree", float(len(unique_receivers_list)))
        community_centrality = gm.get("community_centrality", 0.0)
        betweenness = gm.get("betweenness", 0.0)
        closeness = gm.get("closeness", 0.0)
        clustering_coeff = gm.get("clustering_coeff", 0.0)
        graph_anomaly_score = gm.get("graph_anomaly_score", 0.0)

        return {
            "txn_count": txn_count,
            "avg_amount": avg_amount,
            "structuring_ratio": structuring_ratio,
            "fan_out_ratio": fan_out_ratio,
            "pagerank": pagerank,
            "out_degree": out_degree,
            "txn_velocity": txn_velocity,
            "night_ratio": night_ratio,
            "cross_bank_ratio": cross_bank_ratio,
            "dormancy_days": dormancy_days,
            "burst_score": burst_score,
            "layering_depth": layering_depth,
            "circular_flag": circular_flag,
            "geo_entropy": geo_entropy,
            "counterparty_diversity": counterparty_diversity,
            "amount_variance": amount_variance,
            "hour_entropy": hour_entropy,
            "weekend_ratio": weekend_ratio,
            "rapid_succession": rapid_succession,
            "mule_score": mule_score,
            "shell_indicator": shell_indicator,
            "smurfing_flag": smurfing_flag,
            "reactivation_score": reactivation_score,
            "community_centrality": community_centrality,
            "betweenness": betweenness,
            "closeness": closeness,
            "clustering_coeff": clustering_coeff,
            "graph_anomaly_score": graph_anomaly_score,
            "unique_receivers": float(len(unique_receivers_list)),
        }

    # ── 8 TGNN Edge Features ───────────────────────────────────

    def compute_edge_features(
        self,
        tx: RawTransactionRequest,
        context_stats: Optional[Dict] = None,
    ) -> List[float]:
        """
        Produces 8 edge features matching the GATe training format:
        [timestamp_norm, amount_norm, currency_int, format_int,
         in_port, out_port, in_td, out_td]

        context_stats: dict with 'mean_ts', 'std_ts', 'mean_amount', 'std_amount'
        for normalization. If absent, basic z-score defaults are used.
        """
        now = time.time()
        ts = tx.timestamp or now
        ctx = context_stats or {}

        # Normalize timestamp
        mean_ts = ctx.get("mean_ts", now - 3600)
        std_ts = max(ctx.get("std_ts", 3600.0), 1.0)
        ts_norm = (ts - mean_ts) / std_ts

        # Normalize amount
        mean_amt = ctx.get("mean_amount", 10_000.0)
        std_amt = max(ctx.get("std_amount", 5_000.0), 1.0)
        amt_norm = (tx.amount - mean_amt) / std_amt

        currency_int = float(CURRENCY_MAP.get(tx.currency.upper(), 7))
        format_int = float(FORMAT_MAP.get(tx.payment_format.upper(), 7))

        # Port / time-delta features (simplified from training)
        in_port = ctx.get("in_port", 0.0)
        out_port = ctx.get("out_port", 0.0)
        in_td = ctx.get("in_td", 0.0)
        out_td = ctx.get("out_td", 0.0)

        return [ts_norm, amt_norm, currency_int, format_int, in_port, out_port, in_td, out_td]

    def compute_context_stats(
        self, transactions: List[RawTransactionRequest]
    ) -> Dict:
        """Compute normalization stats from a batch of transactions."""
        if not transactions:
            return {}
        timestamps = [t.timestamp or time.time() for t in transactions]
        amounts = [t.amount for t in transactions]
        return {
            "mean_ts": sum(timestamps) / len(timestamps),
            "std_ts": max(self._std(timestamps), 1.0),
            "mean_amount": sum(amounts) / len(amounts),
            "std_amount": max(self._std(amounts), 1.0),
        }

    # ── Private helpers ────────────────────────────────────────

    def _compute_velocity(self, timestamps: List[float]) -> float:
        if len(timestamps) < 2:
            return 0.0
        span_hours = max((timestamps[-1] - timestamps[0]) / 3600.0, 1.0)
        return len(timestamps) / span_hours

    def _compute_night_ratio(self, txns: List[RawTransactionRequest]) -> float:
        if not txns:
            return 0.0
        night = sum(
            1 for t in txns
            if t.timestamp and (
                datetime.fromtimestamp(t.timestamp, tz=timezone.utc).hour >= 22
                or datetime.fromtimestamp(t.timestamp, tz=timezone.utc).hour < 6
            )
        )
        return night / len(txns)

    def _compute_dormancy(self, timestamps: List[float]) -> float:
        if len(timestamps) < 2:
            return 0.0
        # Largest gap between consecutive timestamps in days
        gaps = [
            (timestamps[i + 1] - timestamps[i]) / 86400.0
            for i in range(len(timestamps) - 1)
        ]
        return max(gaps)

    def _compute_burst_score(self, timestamps: List[float]) -> float:
        """Coefficient of variation of inter-arrival times."""
        if len(timestamps) < 3:
            return 0.0
        gaps = [timestamps[i + 1] - timestamps[i] for i in range(len(timestamps) - 1)]
        mean_gap = sum(gaps) / len(gaps)
        if mean_gap == 0:
            return 0.0
        std_gap = self._std(gaps)
        return std_gap / mean_gap

    def _compute_layering_depth(
        self, transactions: List[RawTransactionRequest], account_id: str
    ) -> float:
        """Simplified: count chain length emanating from account."""
        graph: Dict[str, List[str]] = defaultdict(list)
        for t in transactions:
            graph[t.from_account].append(t.to_account)

        visited = set()
        max_depth = [0]

        def dfs(node: str, depth: int) -> None:
            if node in visited or depth > 20:
                return
            visited.add(node)
            max_depth[0] = max(max_depth[0], depth)
            for nxt in graph.get(node, []):
                dfs(nxt, depth + 1)

        dfs(account_id, 0)
        return float(max_depth[0])

    def _detect_circular(
        self, transactions: List[RawTransactionRequest], account_id: str
    ) -> float:
        """Return 1.0 if funds return to account_id within the transaction set."""
        graph: Dict[str, List[str]] = defaultdict(list)
        for t in transactions:
            graph[t.from_account].append(t.to_account)

        visited = set()

        def has_path(node: str, target: str, depth: int) -> bool:
            if depth > 10:
                return False
            for nxt in graph.get(node, []):
                if nxt == target:
                    return True
                if nxt not in visited:
                    visited.add(nxt)
                    if has_path(nxt, target, depth + 1):
                        return True
            return False

        # Check if any outgoing path from account_id returns to it
        for neighbor in graph.get(account_id, []):
            visited.clear()
            if has_path(neighbor, account_id, 0):
                return 1.0
        return 0.0

    def _compute_entropy(self, values: List[str]) -> float:
        if not values:
            return 0.0
        counts: Dict[str, int] = defaultdict(int)
        for v in values:
            counts[v] += 1
        total = len(values)
        return -sum(
            (c / total) * math.log2(c / total)
            for c in counts.values()
            if c > 0
        )

    def _rapid_succession_count(self, timestamps: List[float], window: float = 60.0) -> int:
        count = 0
        for i in range(1, len(timestamps)):
            if timestamps[i] - timestamps[i - 1] < window:
                count += 1
        return count

    @staticmethod
    def _std(values: List[float]) -> float:
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        return math.sqrt(sum((v - mean) ** 2 for v in values) / len(values))

    @staticmethod
    def _variance(values: List[float]) -> float:
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        return sum((v - mean) ** 2 for v in values) / len(values)

    @staticmethod
    def _zero_features(graph_metrics: Optional[Dict] = None) -> Dict[str, float]:
        gm = graph_metrics or {}
        return {
            "txn_count": 0.0, "avg_amount": 0.0, "structuring_ratio": 0.0,
            "fan_out_ratio": 0.0, "pagerank": gm.get("pagerank", 0.0),
            "out_degree": gm.get("out_degree", 0.0), "txn_velocity": 0.0,
            "night_ratio": 0.0, "cross_bank_ratio": 0.0, "dormancy_days": 0.0,
            "burst_score": 0.0, "layering_depth": 0.0, "circular_flag": 0.0,
            "geo_entropy": 0.0, "counterparty_diversity": 0.0,
            "amount_variance": 0.0, "hour_entropy": 0.0, "weekend_ratio": 0.0,
            "rapid_succession": 0.0, "mule_score": 0.0, "shell_indicator": 0.0,
            "smurfing_flag": 0.0, "reactivation_score": 0.0,
            "community_centrality": gm.get("community_centrality", 0.0),
            "betweenness": gm.get("betweenness", 0.0),
            "closeness": gm.get("closeness", 0.0),
            "clustering_coeff": gm.get("clustering_coeff", 0.0),
            "graph_anomaly_score": gm.get("graph_anomaly_score", 0.0),
            "unique_receivers": 0.0,
        }


# ── Singleton ─────────────────────────────────────────────────
feature_engineering_service = FeatureEngineeringService()
