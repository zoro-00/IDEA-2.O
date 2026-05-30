# ============================================================
# STAR — TGNN (GATe) Inference Service
# Loads GATe checkpoint, builds graph tensors, runs inference
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

# ── Singleton state ───────────────────────────────────────────
_engine = None
_loaded = False
_model_config: Optional[Dict] = None


def _get_tgnn_dir() -> Path:
    return settings.TGNN_DIR


def _inject_path() -> None:
    """Add portable_tgnn_inference to sys.path so imports work."""
    tgnn_dir = str(_get_tgnn_dir())
    if tgnn_dir not in sys.path:
        sys.path.insert(0, tgnn_dir)
        logger.debug("Injected TGNN dir into sys.path: %s", tgnn_dir)


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
        self._tgnn_dir = _get_tgnn_dir()

    def load(self) -> None:
        """Load the GATe checkpoint from portable_tgnn_inference/checkpoint.tar."""
        _inject_path()

        checkpoint_path = self._tgnn_dir / "checkpoint.tar"
        if not checkpoint_path.exists():
            logger.error("❌ TGNN checkpoint not found at %s", checkpoint_path)
            self._loaded = False
            return

        logger.info("  TGNN checkpoint found: %s (%d KB)",
                    checkpoint_path, checkpoint_path.stat().st_size // 1024)

        # ── Step 1: Import torch ───────────────────────────────
        logger.info("  └── [TGNN 1/4] Importing torch + torch_geometric...")
        try:
            import torch
            logger.info("        ✅ torch %s loaded on device: %s",
                        torch.__version__,
                        "cuda" if torch.cuda.is_available() else "cpu (CPU mode)")
        except Exception as e:
            logger.error("        ❌ Failed to import torch: %s", e)
            self._loaded = False
            return

        # ── Step 2: Import GATe model ─────────────────────────
        logger.info("  └── [TGNN 2/4] Importing GATe model architecture...")
        try:
            from models import GATe  # noqa: F401 — validate importable
            logger.info("        ✅ GATe model class imported from models.py")
        except Exception as e:
            logger.error("        ❌ Failed to import GATe model: %s", e)
            self._loaded = False
            return

        # ── Step 3: Import inference engine ───────────────────
        logger.info("  └── [TGNN 3/4] Importing TGNNInferenceEngine...")
        try:
            from inference_engine import TGNNInferenceEngine  # type: ignore
            logger.info("        ✅ TGNNInferenceEngine imported")
        except Exception as e:
            logger.error("        ❌ Failed to import TGNNInferenceEngine: %s", e)
            self._loaded = False
            return

        # ── Step 4: Load checkpoint ───────────────────────────
        logger.info("  └── [TGNN 4/4] Loading checkpoint weights...")
        try:
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self._engine = TGNNInferenceEngine(
                checkpoint_path=checkpoint_path,
                device=device,
            )
            self._engine.load_model()
            self._model_config = self._engine.model_config
            self._loaded = True
            logger.info("        ✅ GATe model loaded! Config: %s", self._model_config)
        except Exception as e:
            logger.error("        ❌ Checkpoint load failed: %s", e)
            self._loaded = False
            return

        # ── Validate with a dummy forward pass ────────────────
        try:
            self._validate_inference()
            logger.info("  └── ✅ TGNN inference validated with dummy forward pass")
        except Exception as e:
            logger.warning("  └── ⚠️ TGNN validation warning (model loaded but check failed): %s", e)

    def _validate_inference(self) -> None:
        """Run a quick dummy inference to validate the loaded model."""
        import torch
        from torch_geometric.data import Data

        x = torch.ones((2, 1), dtype=torch.float32)
        edge_index = torch.tensor([[0], [1]], dtype=torch.long)
        edge_attr = torch.zeros((1, 8), dtype=torch.float32)
        dummy = Data(x=x, edge_index=edge_index, edge_attr=edge_attr)
        result = self._engine.predict_graph(dummy)
        prob = result["probabilities"][0, 1].item()
        logger.debug("Dummy inference fraud prob: %.4f", prob)

    def score_graph(self, data: Any) -> TGNNScore:
        """
        Run full-graph inference on a PyG Data object.
        Returns per-edge fraud probabilities.
        """
        if not self._loaded:
            raise RuntimeError("TGNNService not loaded. Call load() first.")

        logger.debug("[TGNN] score_graph: x=%s, edge_index=%s, edge_attr=%s",
                     data.x.shape, data.edge_index.shape, data.edge_attr.shape)

        t0 = time.perf_counter()
        result = self._engine.predict_graph(data)

        probs = result["probabilities"][:, 1].tolist()   # fraud class
        preds = result["predictions"].tolist()
        suspicious_mask = result["suspicious_mask"].tolist()

        max_prob = max(probs) if probs else 0.0
        fraud_score = round(max_prob * 100, 2)
        risk_level = self._score_to_risk(fraud_score)

        attn = self._engine.get_attention_weights()
        attn_layers = len(attn) if attn is not None else 0

        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.debug("[TGNN] score_graph done: fraud_score=%.2f, ms=%.1f", fraud_score, elapsed_ms)

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
        Score a single transaction as a 2-node mini-graph.
        source/target_features must be length=1 ([1.0]).
        edge_features must be length=8.
        """
        if not self._loaded:
            raise RuntimeError("TGNNService not loaded. Call load() first.")

        if len(edge_features) != 8:
            raise ValueError(
                f"GATe requires exactly 8 edge features, got {len(edge_features)}: {edge_features}"
            )

        logger.debug("[TGNN] score_transaction: edge_features=%s", edge_features)

        t0 = time.perf_counter()
        result = self._engine.predict_transaction(source_features, target_features, edge_features)

        # predict_transaction returns dict with 'probabilities' as list [legit_prob, fraud_prob]
        prob = result["probabilities"][1]
        fraud_score = round(prob * 100, 2)
        risk_level = self._score_to_risk(fraud_score)

        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.debug("[TGNN] score_transaction done: fraud_score=%.2f ms=%.1f", fraud_score, elapsed_ms)

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
            "backbone": "GATConv (PyTorch Geometric)",
            "config": self._model_config or {},
            "checkpoint": str(self._tgnn_dir / "checkpoint.tar"),
            "is_loaded": self._loaded,
            "edge_features": 8,
            "node_features": 1,
            "classes": ["legitimate", "fraud"],
            "device": "cuda" if self._loaded and self._engine and
                       str(self._engine.device) != "cpu" else "cpu",
        }

    @property
    def is_loaded(self) -> bool:
        return self._loaded


# ── Singleton ─────────────────────────────────────────────────
tgnn_service = TGNNService()
