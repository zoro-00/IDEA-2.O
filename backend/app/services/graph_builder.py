# ============================================================
# STAR — Graph Builder Service
# Converts raw transactions → PyTorch Geometric Data objects
# ============================================================
from __future__ import annotations

import logging
import sys
import time
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from app.core.config import settings
from app.models.requests import RawTransactionRequest
from app.services.feature_engineering import feature_engineering_service

logger = logging.getLogger(__name__)


def _ensure_torch_geometric() -> None:
    tgnn_dir = str(settings.TGNN_DIR)
    if tgnn_dir not in sys.path:
        sys.path.insert(0, tgnn_dir)


class GraphBuilderService:
    """
    Converts a list of raw transactions into a PyTorch Geometric Data object
    that can be passed directly to the TGNN inference engine.

    Node representation: all-ones placeholder (matches training setup).
    Edge representation: 8-feature vector per transaction.

    Normalization: column-wise z-score (same as demo_input_generator.py).
    """

    def build_pyg_graph(
        self,
        transactions: List[RawTransactionRequest],
        node_ids: Optional[List[str]] = None,
    ) -> Any:
        """
        Build a PyG Data object.

        Args:
            transactions: list of raw transactions (edges in the graph)
            node_ids: optional pre-defined node list. If None, inferred from txns.

        Returns:
            torch_geometric.data.Data with x, edge_index, edge_attr, y
        """
        import torch
        from torch_geometric.data import Data

        if not transactions:
            raise ValueError("Cannot build graph from empty transaction list")

        # ── Build node index ──────────────────────────────────
        if node_ids is None:
            id_set = set()
            for t in transactions:
                id_set.add(t.from_account)
                id_set.add(t.to_account)
            node_ids = sorted(id_set)

        node_index: Dict[str, int] = {nid: i for i, nid in enumerate(node_ids)}
        num_nodes = len(node_ids)

        # ── Node features: 1-dim placeholder (ones) ──────────
        x = np.ones((num_nodes, 1), dtype=np.float32)
        x_norm = self._normalize(x)

        # ── Compute context stats for edge normalization ──────
        context_stats = feature_engineering_service.compute_context_stats(transactions)

        # ── Build edges ───────────────────────────────────────
        edges: List[Tuple[int, int]] = []
        edge_features: List[List[float]] = []
        labels: List[int] = []  # placeholder (no GT in production)

        for tx in transactions:
            src_id = node_index.get(tx.from_account)
            dst_id = node_index.get(tx.to_account)
            if src_id is None or dst_id is None:
                continue

            edges.append((src_id, dst_id))
            ef = feature_engineering_service.compute_edge_features(tx, context_stats)
            edge_features.append(ef)
            labels.append(0)  # unknown label

        if not edges:
            raise ValueError("No valid edges could be built from transactions")

        edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous()
        edge_attr_np = np.array(edge_features, dtype=np.float32)
        edge_attr_norm = self._normalize(edge_attr_np)
        edge_attr = torch.tensor(edge_attr_norm, dtype=torch.float32)
        x_tensor = torch.tensor(x_norm, dtype=torch.float32)
        y = torch.tensor(labels, dtype=torch.long)

        return Data(x=x_tensor, edge_index=edge_index, edge_attr=edge_attr, y=y)

    @staticmethod
    def _normalize(arr: np.ndarray) -> np.ndarray:
        """Column-wise z-score normalization (matches training)."""
        mean = arr.mean(axis=0, keepdims=True)
        std = arr.std(axis=0, keepdims=True)
        std[std == 0] = 1.0
        return (arr - mean) / std

    def build_single_transaction_inputs(
        self, tx: RawTransactionRequest, context_stats: Optional[Dict] = None
    ) -> Tuple[List[float], List[float], List[float]]:
        """
        For single-transaction scoring via TGNNService.score_transaction():
        Returns (source_features, target_features, edge_features)
        Both node feature lists are [1.0] (matching the 1-dim node embedding).
        """
        ef = feature_engineering_service.compute_edge_features(tx, context_stats)
        return [1.0], [1.0], ef


# ── Singleton ─────────────────────────────────────────────────
graph_builder_service = GraphBuilderService()
