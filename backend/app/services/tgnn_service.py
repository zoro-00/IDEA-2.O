# ============================================================
# STAR — TGNN (GATe) Inference Service
# Loads GAT checkpoint, builds graph tensors, runs inference
# ============================================================
from __future__ import annotations

import logging
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.models.internal import TGNNScore

logger = logging.getLogger(__name__)


class TGNNService:
    """
    Production wrapper around the portable_tgnn_inference package.

    Architecture:
        GATe model (Graph Attention Network with edge features)
        - node_emb: 1 → n_hidden
        - edge_emb: 8 → n_hidden
        - 2 GAT conv layers with multi-head attention
        - MLP classifier: n_hidden*3 → 50 → 25 → 2

    Edge features (8-dim):
        [timestamp, amount, currency, payment_format,
         in_port, out_port, in_td, out_td]
    """

    def __init__(self) -> None:
        self._engine = None
        self._loaded = False
        self._model_config: Optional[Dict] = None
        self._tgnn_dir = settings.TGNN_DIR

    def load(self) -> None:
        """Inject TGNN package path and load model from checkpoint."""
        tgnn_dir = str(self._tgnn_dir)
        if tgnn_dir not in sys.path:
            sys.path.insert(0, tgnn_dir)

        try:
            from inference_engine import TGNNInferenceEngine  # type: ignore

            checkpoint_path = self._tgnn_dir / "checkpoint.tar"
            if not checkpoint_path.exists():
                logger.error("TGNN checkpoint not found at %s", checkpoint_path)
                self._loaded = False
                return

            logger.info("Loading TGNN model from %s", checkpoint_path)
            self._engine = TGNNInferenceEngine(checkpoint_path=checkpoint_path)
            self._engine.load_model()
            self._model_config = self._engine.model_config
            self._loaded = True
            logger.info(
                "✅ TGNN service ready — config: %s",
                self._model_config,
            )
        except ImportError as e:
            logger.error("Could not import TGNN inference engine: %s", e)
            self._loaded = False
            return
        except Exception as e:
            logger.error("TGNN load failed: %s", e)
            self._loaded = False
            return

    def score_graph(self, data: Any) -> TGNNScore:
        """
        Run full-graph inference on a PyG Data object.
        Returns per-edge fraud probabilities.
        """
        if not self._loaded:
            raise RuntimeError("TGNNService not loaded. Call load() first.")

        t0 = time.perf_counter()
        result = self._engine.predict_graph(data)

        probs = result["probabilities"][:, 1].tolist()  # fraud class
        preds = result["predictions"].tolist()
        suspicious_mask = result["suspicious_mask"].tolist()

        # Overall graph fraud probability = max edge probability
        max_prob = max(probs) if probs else 0.0
        fraud_score = round(max_prob * 100, 2)
        risk_level = self._score_to_risk(fraud_score)

        attn = self._engine.get_attention_weights()
        attn_layers = len(attn) if attn is not None else 0

        elapsed_ms = (time.perf_counter() - t0) * 1000
        return TGNNScore(
            fraud_probability=round(max_prob, 4),
            fraud_score=fraud_score,
            risk_level=risk_level,
            is_suspicious=any(suspicious_mask),
            attention_layers=attn_layers,
            edge_scores=[round(p, 4) for p in probs],
            inference_ms=round(elapsed_ms, 2),
        )

    def score_transaction(
        self,
        source_features: List[float],
        target_features: List[float],
        edge_features: List[float],
    ) -> TGNNScore:
        """
        Score a single transaction (2-node mini-graph).
        source_features and target_features must be length=1 (just [1.0]).
        edge_features must be length=8.
        """
        if not self._loaded:
            raise RuntimeError("TGNNService not loaded. Call load() first.")

        t0 = time.perf_counter()
        result = self._engine.predict_transaction(
            source_features, target_features, edge_features
        )

        prob = result["probabilities"][1]  # fraud class probability
        fraud_score = round(prob * 100, 2)
        risk_level = self._score_to_risk(fraud_score)

        elapsed_ms = (time.perf_counter() - t0) * 1000
        return TGNNScore(
            fraud_probability=round(prob, 4),
            fraud_score=fraud_score,
            risk_level=risk_level,
            is_suspicious=result["suspicious"],
            attention_layers=0,
            edge_scores=[round(prob, 4)],
            inference_ms=round(elapsed_ms, 2),
        )

    @staticmethod
    def _score_to_risk(score: float) -> str:
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

    def get_model_info(self) -> Dict:
        return {
            "architecture": "GATe (Graph Attention Network with edge features)",
            "backbone": "GATConv",
            "config": self._model_config or {},
            "checkpoint": str(self._tgnn_dir / "checkpoint.tar"),
            "is_loaded": self._loaded,
            "edge_features": 8,
            "node_features": 1,
            "classes": ["legitimate", "fraud"],
        }

    @property
    def is_loaded(self) -> bool:
        return self._loaded


# ── Singleton ─────────────────────────────────────────────────
tgnn_service = TGNNService()
