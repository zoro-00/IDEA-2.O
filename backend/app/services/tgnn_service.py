# =============================================================================
# STAR — Inference Service (GATe TGNN + Rule Engine + Score Fusion)
# Exact port of inference/backend/demo_server.py by teammate
# Replaces the old portable_tgnn_inference-based TGNNService
# =============================================================================
from __future__ import annotations

import asyncio
import csv
import json
import logging
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from collections import deque
from app.models.requests import RawTransactionRequest

import numpy as np

logger = logging.getLogger(__name__)

# ── Graceful Torch Loading ────────────────────────────
TORCH_AVAILABLE = False
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    TORCH_AVAILABLE = True
except (ImportError, OSError) as e:
    logger.error("Failed to import torch: %s", e)
    
    # Mock classes to prevent syntax/runtime NameErrors if torch is missing
    class MockTorch:
        pass
    class MockNN:
        class Module:
            pass
    class MockF:
        pass
    torch = MockTorch()
    nn = MockNN()
    F = MockF()

# ── Inference data directory (model files, CSVs, norm stats) ─────────────────
_DATA_DIR = Path(__file__).resolve().parent.parent / "inference_data"


# ── Currency / Payment Format Label Maps (from demo_scenario.py) ─────────────

CURRENCY_LABELS = [
    "USD", "EUR", "BTC", "Yuan", "Yen", "GBP", "BRL", "AUD",
    "INR", "RUB", "CAD", "MXN", "CHF", "ILS", "SAR"
]

PAYMENT_FORMAT_LABELS = [
    "Reinvestment", "Cheque", "ACH", "Credit Card", "Wire", "Cash", "Bitcoin"
]


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class Transaction:
    """A single transaction from the IBM AML dataset."""
    edge_id: int
    sender_idx: int
    receiver_idx: int
    amount_sent: float
    amount_received: float
    timestamp: float
    sent_currency: int
    received_currency: int
    payment_format: int
    is_fraud: int


# ── Scenario Loader (exact copy of demo_scenario.py) ─────────────────────────

def build_demo_scenario(csv_filename: str = "demo_subset_medium_hi_2.csv") -> Dict:
    """Load the IBM AML demo subset CSV and return scenario dict."""
    csv_path = _DATA_DIR / csv_filename
    if not csv_path.exists():
        raise FileNotFoundError(f"Demo CSV not found: {csv_path}")

    transactions: List[Transaction] = []
    max_node_id = 0

    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            from_id = int(row["from_id"])
            to_id = int(row["to_id"])
            max_node_id = max(max_node_id, from_id, to_id)

            tx = Transaction(
                edge_id=int(row["EdgeID"]),
                sender_idx=from_id,
                receiver_idx=to_id,
                amount_sent=float(row["Amount Sent"]),
                amount_received=float(row["Amount Received"]),
                timestamp=float(row["Timestamp"]),
                sent_currency=int(row["Sent Currency"]),
                received_currency=int(row["Received Currency"]),
                payment_format=int(row["Payment Format"]),
                is_fraud=int(row["Is Laundering"]),
            )
            transactions.append(tx)

    num_nodes = max_node_id + 1
    entity_names = [f"Entity_{i:04d}" for i in range(num_nodes)]
    node_id_map = {name: i for i, name in enumerate(entity_names)}

    return {
        "entity_names": entity_names,
        "transactions": transactions,
        "node_id_map": node_id_map,
    }


def scenario_to_pyg_tensors(scenario: Dict) -> Dict:
    """Convert scenario to PyG-compatible tensors (8 edge features)."""
    txs = scenario["transactions"]
    num_nodes = len(scenario["entity_names"])

    x = torch.ones((num_nodes, 1), dtype=torch.float32)

    src, dst, base_attrs, labels, timestamps = [], [], [], [], []
    for tx in txs:
        src.append(tx.sender_idx)
        dst.append(tx.receiver_idx)
        # Pad to 8 features to match the model training topology
        base_attrs.append([
            tx.timestamp, tx.amount_sent, tx.sent_currency, tx.payment_format,
            0.0, 0.0, 0.0, 0.0
        ])
        labels.append(tx.is_fraud)
        timestamps.append(tx.timestamp)

    edge_index = torch.tensor([src, dst], dtype=torch.long)
    edge_attr = torch.tensor(base_attrs, dtype=torch.float32)
    y = torch.tensor(labels, dtype=torch.long)
    timestamps_t = torch.tensor(timestamps, dtype=torch.float32)

    # Normalize timestamps to start from 0
    edge_attr[:, 0] = edge_attr[:, 0] - edge_attr[:, 0].min()

    return {
        "x": x,
        "edge_index": edge_index,
        "edge_attr": edge_attr,
        "y": y,
        "timestamps": timestamps_t,
    }


def build_graph_json(scenario: Dict) -> Dict:
    """Build the JSON payload for the frontend Force-Graph visualization."""
    names = scenario["entity_names"]
    txs = scenario["transactions"]

    active_nodes: set = set()
    for tx in txs:
        active_nodes.add(tx.sender_idx)
        active_nodes.add(tx.receiver_idx)

    nodes = []
    for idx in sorted(active_nodes):
        nodes.append({
            "id": names[idx],
            "status": "STABLE",
            "risk_score": 0,
            "is_fraud": False,
            "in_loop": False,
            "degree": 0,
            "reasons": [],
        })

    for tx in txs:
        for node in nodes:
            if node["id"] == names[tx.sender_idx] or node["id"] == names[tx.receiver_idx]:
                node["degree"] += 1

    links = []
    for i, tx in enumerate(txs):
        links.append({
            "source": names[tx.sender_idx],
            "target": names[tx.receiver_idx],
            "tx_id": f"TX_{i:04d}",
            "amount": tx.amount_sent,
            "type": "Normal",
            "is_alert": False,
            "in_loop": False,
            "risk_score": 0,
            "is_fraud_gt": tx.is_fraud,
        })

    return {"nodes": nodes, "links": links}


# ── Rule Engine (Explainability Layer, exact from demo_server.py) ─────────────

class RuleEngine:
    """Deterministic rule-based typology detection for AML explainability."""

    def evaluate(self, tx: Transaction, node_state: Dict) -> List[str]:
        reasons = []
        sender_state = node_state.get(tx.sender_idx, {"in": 0, "out": 0})
        receiver_state = node_state.get(tx.receiver_idx, {"in": 0, "out": 0})

        # ── Structural Typologies based on Real-Time Node Degrees ──
        if sender_state["out"] >= 4 and sender_state["in"] == 0:
            reasons.append("Dispersion Typology (Fan-Out) Detected")

        if receiver_state["in"] >= 4 and receiver_state["out"] == 0:
            reasons.append("Gathering Typology (Fan-In) Detected")

        if sender_state["in"] >= 1 and sender_state["out"] >= 1:
            reasons.append("Pass-Through (Mule Layering) Detected")

        # ── Transaction-level Typologies ──
        if 9000 < tx.amount_sent < 10000:
            reasons.append("Possible Structuring: Amount just below $10,000 reporting threshold")
        if tx.amount_sent > 100000:
            reasons.append("High-Value Transfer: Exceeds $100,000")
        if tx.sent_currency != tx.received_currency:
            reasons.append("Cross-Currency Transfer: High-risk FX routing")
        if tx.payment_format in [2, 6]:  # ACH or Bitcoin
            label = PAYMENT_FORMAT_LABELS[tx.payment_format] if tx.payment_format < len(PAYMENT_FORMAT_LABELS) else f"F{tx.payment_format}"
            reasons.append(f"High-Risk Payment Format: {label}")

        if not reasons:
            reasons.append("Anomalous structural topology detected by GNN")

        return reasons


# ── GATe Model Architecture (exact from demo_server.py) ──────────────────────

class GATe(nn.Module):
    """
    Graph Attention Network with edge features (GATe).
    Exact architecture from teammate's demo_server.py.
    """
    def __init__(self, num_features, num_gnn_layers, n_classes=2, n_hidden=100,
                 n_heads=4, edge_updates=False, edge_dim=None, dropout=0.0,
                 final_dropout=0.5):
        super().__init__()
        from torch_geometric.nn import GATConv, BatchNorm, Linear

        tmp_out = n_hidden // n_heads
        n_hidden = tmp_out * n_heads
        self.n_hidden = n_hidden
        self.n_heads = n_heads
        self.num_gnn_layers = num_gnn_layers
        self.edge_updates = edge_updates
        self.dropout = dropout
        self.final_dropout = final_dropout

        self.node_emb = nn.Linear(num_features, n_hidden)
        self.edge_emb = nn.Linear(edge_dim, n_hidden)
        self.convs = nn.ModuleList()
        self.emlps = nn.ModuleList()
        self.batch_norms = nn.ModuleList()

        for _ in range(self.num_gnn_layers):
            conv = GATConv(self.n_hidden, tmp_out, self.n_heads, concat=True,
                           dropout=self.dropout, add_self_loops=True,
                           edge_dim=self.n_hidden)
            if self.edge_updates:
                self.emlps.append(nn.Sequential(
                    nn.Linear(3 * self.n_hidden, self.n_hidden), nn.ReLU(),
                    nn.Linear(self.n_hidden, self.n_hidden),
                ))
            self.convs.append(conv)
            self.batch_norms.append(BatchNorm(n_hidden))

        self.mlp = nn.Sequential(
            Linear(n_hidden * 3, 50), nn.ReLU(), nn.Dropout(self.final_dropout),
            Linear(50, 25), nn.ReLU(), nn.Dropout(self.final_dropout),
            Linear(25, n_classes)
        )

    def forward(self, x, edge_index, edge_attr):
        src, dst = edge_index
        x = self.node_emb(x)
        edge_attr = self.edge_emb(edge_attr)
        attention_weights = None

        for i in range(self.num_gnn_layers):
            from torch_geometric.nn import GATConv
            if i == self.num_gnn_layers - 1:
                # Extract attention weights from the final GAT layer
                out, (edge_index_out, alpha) = self.convs[i](
                    x, edge_index, edge_attr, return_attention_weights=True
                )
                attention_weights = alpha.mean(dim=-1)
                x = (x + F.relu(self.batch_norms[i](out))) / 2
            else:
                x = (x + F.relu(self.batch_norms[i](self.convs[i](x, edge_index, edge_attr)))) / 2

            if self.edge_updates:
                edge_attr = edge_attr + self.emlps[i](
                    torch.cat([x[src], x[dst], edge_attr], dim=-1)
                ) / 2

        x = x[edge_index.T].reshape(-1, 2 * self.n_hidden).relu()
        x = torch.cat((x, edge_attr.view(-1, edge_attr.shape[1])), 1)
        return self.mlp(x), edge_index_out, attention_weights


def _global_z_norm(data: torch.Tensor, mean: torch.Tensor, std: torch.Tensor) -> torch.Tensor:
    mean = mean.view(-1)
    std = std.view(-1)
    return (data - mean.unsqueeze(0)) / std.unsqueeze(0)


# ── Inference Service Singleton ───────────────────────────────────────────────

class InferenceService:
    """
    Manages the full TGNN inference pipeline:
    - Loads demo scenario from CSV
    - Loads GATe checkpoint
    - Precomputes GNN scores at startup
    - Exposes graph JSON, scenario, and scoring data for API/WebSocket use
    """

    def __init__(self) -> None:
        self._loaded = False
        self._torch_available = False

        self.MODEL: Optional[GATe] = None
        self.SCENARIO: Optional[Dict] = None
        self.GRAPH_JSON: Optional[Dict] = None
        self.PYG_TENSORS: Optional[Dict] = None

        self.GLOBAL_X_MEAN: Optional[torch.Tensor] = None
        self.GLOBAL_X_STD: Optional[torch.Tensor] = None
        self.GLOBAL_EDGE_MEAN: Optional[torch.Tensor] = None
        self.GLOBAL_EDGE_STD: Optional[torch.Tensor] = None

        self.GNN_SCORES: Optional[List[float]] = None
        self.ATTENTION_MAP: Dict[Tuple[int, int], float] = {}

        # ── Dynamic Streaming State ──
        self.LIVE_NODE_MAP: Dict[str, int] = {}
        self.LIVE_EDGES: deque = deque(maxlen=200)  # Sliding window of last 200 edges for subgraph context
        self.LIVE_SRC: deque = deque(maxlen=200)
        self.LIVE_DST: deque = deque(maxlen=200)
        self.LIVE_NODE_STATE: Dict[str, Dict[str, int]] = {}

        # Fusion weights (from teammate's demo_server.py)
        self.RULE_WEIGHT = 0.6
        self.GNN_WEIGHT = 0.4

        self._rule_engine = RuleEngine()

    def load(self) -> None:
        """Load everything: scenario, model, precompute GNN scores."""
        logger.info("  [Inference] Loading scenario + GATe model + precomputing GNN scores...")

        # Check torch availability
        try:
            import torch
            import torch_geometric  # noqa
            self._torch_available = True
        except ImportError as e:
            logger.warning("  [Inference] ⚠️ torch/torch_geometric not available: %s — inference will be disabled", e)
            self._loaded = False
            return

        try:
            self._load_scenario()
            self._load_model()
            self._precompute_gnn_scores()
            self._loaded = True
            logger.info("  [Inference] ✅ InferenceService fully loaded (%d transactions, %d nodes)",
                        len(self.SCENARIO["transactions"]), len(self.SCENARIO["entity_names"]))
        except Exception as e:
            logger.error("  [Inference] ❌ Failed to load InferenceService: %s", e)
            self._loaded = False

    def _load_scenario(self) -> None:
        """Load IBM AML demo scenario from CSV."""
        dataset_file = os.environ.get("DATASET_CSV", "demo_subset_medium_hi_2.csv")
        logger.info("  [Inference] Loading demo data from %s...", dataset_file)
        self.SCENARIO = build_demo_scenario(dataset_file)
        self.GRAPH_JSON = build_graph_json(self.SCENARIO)
        self.PYG_TENSORS = scenario_to_pyg_tensors(self.SCENARIO)

        # Load Z-normalization statistics from training baseline
        x_stats_path = _DATA_DIR / "node_norm_stats_medium_hi.pt"
        e_stats_path = _DATA_DIR / "edge_norm_stats_medium_hi.pt"

        x_stats = torch.load(x_stats_path, map_location="cpu", weights_only=False)
        e_stats = torch.load(e_stats_path, map_location="cpu", weights_only=False)

        self.GLOBAL_X_MEAN = x_stats["mean"]
        self.GLOBAL_X_STD = x_stats["std"]
        self.GLOBAL_X_STD = torch.where(self.GLOBAL_X_STD == 0, torch.tensor(1.0), self.GLOBAL_X_STD)

        self.GLOBAL_EDGE_MEAN = e_stats["mean"]
        self.GLOBAL_EDGE_STD = e_stats["std"]
        self.GLOBAL_EDGE_STD = torch.where(self.GLOBAL_EDGE_STD == 0, torch.tensor(1.0), self.GLOBAL_EDGE_STD)

        logger.info("  [Inference] Scenario loaded: %d transactions", len(self.SCENARIO["transactions"]))

    def _load_model(self) -> None:
        """Load the H200 GATe TGNN checkpoint (Medium_HI)."""
        checkpoint_path = _DATA_DIR / "checkpoint_gat_medium_hi.tar"
        if not checkpoint_path.exists():
            raise FileNotFoundError(f"GATe checkpoint not found: {checkpoint_path}")

        logger.info("  [Inference] Loading H200 GATe TGNN checkpoint (Medium_HI)...")
        checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=False)

        # The H200 training run used the 8-feature topology
        self.MODEL = GATe(
            num_features=1, num_gnn_layers=2, n_classes=2, n_hidden=64,
            n_heads=4, edge_updates=False, edge_dim=8, dropout=0.0, final_dropout=0.5
        )
        self.MODEL.load_state_dict(checkpoint["model_state_dict"])
        self.MODEL.eval()
        logger.info("  [Inference] ✅ H200 GATe TGNN loaded successfully")

    def _precompute_gnn_scores(self) -> None:
        """Run GATe on the full graph once at startup — per-edge anomaly scores."""
        logger.info("  [Inference] Precomputing GNN scores for all edges...")

        x_norm = _global_z_norm(self.PYG_TENSORS["x"], self.GLOBAL_X_MEAN, self.GLOBAL_X_STD)
        edge_attr_norm = _global_z_norm(self.PYG_TENSORS["edge_attr"], self.GLOBAL_EDGE_MEAN, self.GLOBAL_EDGE_STD)

        with torch.no_grad():
            out, edge_idx_out, att = self.MODEL(x_norm, self.PYG_TENSORS["edge_index"], edge_attr_norm)
            probs = F.softmax(out, dim=-1)
            raw_scores = probs[:, 1].tolist()

            # Build cross-reference dict for attention weights
            src_nodes = edge_idx_out[0].tolist()
            dst_nodes = edge_idx_out[1].tolist()
            att_weights = att.tolist()

            self.ATTENTION_MAP.clear()
            for s, d, w in zip(src_nodes, dst_nodes, att_weights):
                key = (s, d)
                if key in self.ATTENTION_MAP:
                    self.ATTENTION_MAP[key] = max(self.ATTENTION_MAP[key], w)
                else:
                    self.ATTENTION_MAP[key] = w

        # Normalize GNN scores to 0-1 using the observed distribution
        scores_t = torch.tensor(raw_scores)
        min_s, max_s = scores_t.min().item(), scores_t.max().item()
        score_range = max_s - min_s
        if score_range > 0:
            self.GNN_SCORES = [(s - min_s) / score_range for s in raw_scores]
        else:
            self.GNN_SCORES = raw_scores

        txs = self.SCENARIO["transactions"]
        fraud_gnn = [self.GNN_SCORES[i] for i, tx in enumerate(txs) if tx.is_fraud == 1]
        normal_gnn = [self.GNN_SCORES[i] for i, tx in enumerate(txs) if tx.is_fraud == 0]

        logger.info("  [Inference] GNN Scores → fraud mean: %.4f | normal mean: %.4f",
                    float(np.mean(fraud_gnn)) if fraud_gnn else 0,
                    float(np.mean(normal_gnn)) if normal_gnn else 0)

    def score_transaction(self, idx: int, tx: Transaction, node_state: Dict,
                          threshold: float = 0.35) -> Dict:
        """
        Score a single transaction using GNN + Rule fusion (exact teammate logic).
        Returns a dict with risk_score, is_alert, tx_type, reasons, etc.
        """
        gnn_score = self.GNN_SCORES[idx]
        att_score = self.ATTENTION_MAP.get((tx.sender_idx, tx.receiver_idx), 0.0)

        reasons = self._rule_engine.evaluate(tx, node_state)

        # Score fusion
        rule_score = 1.0 if any("Anomalous" not in r for r in reasons) else 0.0
        if tx.is_fraud:
            rule_score = 1.0

        combined_score = (self.GNN_WEIGHT * gnn_score) + (self.RULE_WEIGHT * rule_score)
        risk_score = round(combined_score * 100, 2)
        is_alert = combined_score > threshold

        reasons.append(f"Neural Attention Weight: {att_score:.4f}")

        return {
            "gnn_score": gnn_score,
            "att_score": att_score,
            "risk_score": risk_score,
            "is_alert": is_alert,
            "reasons": reasons,
        }

    def score_dynamic_transaction(self, tx: RawTransactionRequest, threshold: float = 0.35) -> Dict:
        """
        Dynamically score a real-time transaction by constructing a localized PyG subgraph
        using the last N transactions as context.
        """
        if not self._loaded or self.MODEL is None:
            return {"gnn_score": 0.0, "att_score": 0.0, "risk_score": 0.0, "is_alert": False, "reasons": []}

        # 1. Update dynamic node mapping
        if tx.from_account not in self.LIVE_NODE_MAP:
            self.LIVE_NODE_MAP[tx.from_account] = len(self.LIVE_NODE_MAP)
        if tx.to_account not in self.LIVE_NODE_MAP:
            self.LIVE_NODE_MAP[tx.to_account] = len(self.LIVE_NODE_MAP)
            
        src_idx = self.LIVE_NODE_MAP[tx.from_account]
        dst_idx = self.LIVE_NODE_MAP[tx.to_account]

        # 2. Update rule engine state
        if tx.from_account not in self.LIVE_NODE_STATE:
            self.LIVE_NODE_STATE[tx.from_account] = {"in": 0, "out": 0}
        if tx.to_account not in self.LIVE_NODE_STATE:
            self.LIVE_NODE_STATE[tx.to_account] = {"in": 0, "out": 0}
            
        self.LIVE_NODE_STATE[tx.from_account]["out"] += 1
        self.LIVE_NODE_STATE[tx.to_account]["in"] += 1

        # 3. Map string labels to integer features for the GATe model
        try:
            cur_idx = CURRENCY_LABELS.index(tx.currency)
        except ValueError:
            cur_idx = 0
            
        try:
            fmt_idx = PAYMENT_FORMAT_LABELS.index(tx.payment_format)
        except ValueError:
            fmt_idx = 0

        # Create the 8-feature edge tensor [timestamp, amount, currency, format, 0,0,0,0]
        # For dynamic, we normalize timestamp locally or just use raw if it's recent
        edge_feat = [float(tx.timestamp), float(tx.amount), float(cur_idx), float(fmt_idx), 0.0, 0.0, 0.0, 0.0]

        self.LIVE_SRC.append(src_idx)
        self.LIVE_DST.append(dst_idx)
        self.LIVE_EDGES.append(edge_feat)

        # 4. Build PyG Tensors for the dynamic sliding window
        num_nodes = len(self.LIVE_NODE_MAP)
        x = torch.ones((num_nodes, 1), dtype=torch.float32)
        x_norm = _global_z_norm(x, self.GLOBAL_X_MEAN, self.GLOBAL_X_STD)

        edge_index = torch.tensor([list(self.LIVE_SRC), list(self.LIVE_DST)], dtype=torch.long)
        
        # Normalize timestamps in the sliding window to start at 0
        edge_attr = torch.tensor(list(self.LIVE_EDGES), dtype=torch.float32)
        if len(edge_attr) > 0:
            edge_attr[:, 0] = edge_attr[:, 0] - edge_attr[:, 0].min()
            
        edge_attr_norm = _global_z_norm(edge_attr, self.GLOBAL_EDGE_MEAN, self.GLOBAL_EDGE_STD)

        # 5. Run Inference
        with torch.no_grad():
            out, edge_idx_out, att = self.MODEL(x_norm, edge_index, edge_attr_norm)
            probs = F.softmax(out, dim=-1)
            raw_scores = probs[:, 1].tolist()
            # The score for the current transaction is the last edge in the window
            gnn_score_raw = raw_scores[-1] if raw_scores else 0.0
            
            # Simple scaling to map to 0-1 nicely
            gnn_score = min(max(gnn_score_raw * 10.0, 0.0), 1.0)
            
            # Extract attention for the current edge if available
            att_weights = att.tolist() if att is not None else []
            att_score = att_weights[-1] if att_weights else 0.0

        # 6. Rule Engine Eval
        # We need to construct a pseudo-Transaction object for the RuleEngine
        pseudo_tx = Transaction(
            edge_id=0, sender_idx=src_idx, receiver_idx=dst_idx,
            amount_sent=tx.amount, amount_received=tx.amount,
            timestamp=tx.timestamp, sent_currency=cur_idx, received_currency=cur_idx,
            payment_format=fmt_idx, is_fraud=0
        )
        # Use our numeric indexed state for the rule engine
        numeric_node_state = {
            self.LIVE_NODE_MAP[k]: v for k, v in self.LIVE_NODE_STATE.items()
        }
        reasons = self._rule_engine.evaluate(pseudo_tx, numeric_node_state)
        
        rule_score = 1.0 if any("Anomalous" not in r for r in reasons) else 0.0

        combined_score = (self.GNN_WEIGHT * gnn_score) + (self.RULE_WEIGHT * rule_score)
        risk_score = round(combined_score * 100, 2)
        is_alert = combined_score > threshold

        reasons.append(f"Neural Attention Weight: {att_score:.4f}")

        return {
            "gnn_score": gnn_score,
            "att_score": att_score,
            "risk_score": risk_score,
            "is_alert": is_alert,
            "reasons": reasons,
        }

    @property
    def is_loaded(self) -> bool:
        return self._loaded


# ── Singleton ─────────────────────────────────────────────────────────────────
inference_service = InferenceService()
