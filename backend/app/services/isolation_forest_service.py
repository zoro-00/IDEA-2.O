# ============================================================
# STAR — Isolation Forest Service
# Loads trained pkl models, scales features, runs inference
# ============================================================
from __future__ import annotations

import logging
import pickle
import time
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from app.core.config import settings
from app.models.internal import IFScore

logger = logging.getLogger(__name__)

# Feature order MUST match training order
FEATURE_ORDER: List[str] = [
    "txn_count", "avg_amount", "structuring_ratio", "fan_out_ratio",
    "pagerank", "out_degree", "txn_velocity", "night_ratio",
    "cross_bank_ratio", "dormancy_days", "burst_score", "layering_depth",
    "circular_flag", "geo_entropy", "counterparty_diversity", "amount_variance",
    "hour_entropy", "weekend_ratio", "rapid_succession", "mule_score",
    "shell_indicator", "smurfing_flag", "reactivation_score",
    "community_centrality", "betweenness", "closeness", "clustering_coeff",
    "graph_anomaly_score", "unique_receivers",
]


class IsolationForestService:
    """
    Wraps the trained Isolation Forest model for real-time AML scoring.

    Pipeline:
        raw features dict
            ↓
        feature vector (ordered)
            ↓
        scaler.transform()
            ↓
        iso.score_samples() → raw score
            ↓
        normalise to 0-100 risk score
    """

    def __init__(self) -> None:
        self._iso = None
        self._scaler = None
        self._metadata: Dict[str, Any] = {}
        self._feature_importances: Optional[Dict[str, float]] = None
        self._loaded = False

    def load(self) -> None:
        """Load all pkl artefacts from isolation_models/ directory."""
        model_dir: Path = settings.IF_MODEL_DIR

        iso_path = model_dir / "isolation_forest.pkl"
        scaler_path = model_dir / "scaler.pkl"
        meta_path = model_dir / "model_metadata.pkl"

        if not iso_path.exists():
            logger.warning("Isolation Forest model not found at %s — service will remain unloaded", iso_path)
            self._loaded = False
            return

        logger.info("Loading Isolation Forest model from %s", iso_path)
        import joblib, warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")  # suppress version mismatch warnings
            self._iso = joblib.load(iso_path)

        if scaler_path.exists():
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                self._scaler = joblib.load(scaler_path)
            logger.info("Scaler loaded from %s", scaler_path)
        else:
            logger.warning("Scaler not found — features will NOT be scaled")

        if meta_path.exists():
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                self._metadata = joblib.load(meta_path)
            logger.info("Metadata loaded: %s", list(self._metadata.keys()))

        self._load_feature_importances(model_dir)
        self._loaded = True
        logger.info("✅ Isolation Forest service ready")

    def _load_feature_importances(self, model_dir: Path) -> None:
        """Load SHAP feature importances if available."""
        shap_dir = model_dir / "shap_importance"
        if shap_dir.exists():
            try:
                # Try to load numpy array of shap values
                candidates = list(shap_dir.glob("*.npy")) + list(shap_dir.glob("*.pkl"))
                if candidates:
                    data = np.load(str(candidates[0]), allow_pickle=True)
                    if hasattr(data, "item"):
                        data = data.item()
                    if isinstance(data, dict):
                        self._feature_importances = data
                    elif isinstance(data, np.ndarray):
                        self._feature_importances = {
                            f: float(v) for f, v in zip(FEATURE_ORDER, data)
                        }
                    logger.info("SHAP feature importances loaded")
            except Exception as e:
                logger.warning("Could not load SHAP importances: %s", e)

        # Fallback: uniform importances
        if self._feature_importances is None:
            self._feature_importances = {f: 1.0 / len(FEATURE_ORDER) for f in FEATURE_ORDER}

    def _features_to_vector(self, features: Dict[str, float]) -> np.ndarray:
        """Convert dict → ordered numpy vector matching training order."""
        return np.array([[features.get(f, 0.0) for f in FEATURE_ORDER]], dtype=np.float32)

    def _normalize_score(self, raw: float) -> float:
        """
        Isolation Forest score_samples() returns negative values for anomalies.
        Typical range: [-0.5, 0.5]
        We map to 0-100 where 100 = most anomalous.
        """
        # Clamp to expected range
        clamped = max(-0.6, min(0.6, raw))
        # Invert and scale: -0.6 → 100, 0.6 → 0
        normalized = (-clamped + 0.6) / 1.2 * 100.0
        return round(normalized, 2)

    def _get_risk_level(self, score: float) -> str:
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

    def _get_top_features(self, features: Dict[str, float], n: int = 5) -> List[Dict]:
        """Return top-N features by contribution to anomaly score."""
        importances = self._feature_importances or {}
        scored = []
        for feat in FEATURE_ORDER:
            val = features.get(feat, 0.0)
            importance = importances.get(feat, 0.0)
            contribution = abs(val) * importance
            scored.append({
                "feature": feat,
                "label": feat.replace("_", " ").title(),
                "value": round(float(val), 4),
                "normalized_score": round(float(contribution), 4),
                "risk_level": "high" if contribution > 0.5 else ("moderate" if contribution > 0.2 else "normal"),
                "description": f"{feat.replace('_', ' ').title()} contributes {contribution:.2%} to anomaly score",
            })
        scored.sort(key=lambda x: x["normalized_score"], reverse=True)
        return scored[:n]

    def score(self, account_id: str, features: Dict[str, float]) -> IFScore:
        """Score an account using Isolation Forest."""
        if not self._loaded:
            raise RuntimeError("IsolationForestService not loaded. Call load() first.")

        t0 = time.perf_counter()

        vec = self._features_to_vector(features)

        if self._scaler is not None:
            vec = self._scaler.transform(vec)

        raw_scores = self._iso.score_samples(vec)
        raw = float(raw_scores[0])

        risk_score = self._normalize_score(raw)
        risk_level = self._get_risk_level(risk_score)
        threshold = self._metadata.get("threshold", -0.1)
        is_anomalous = raw < threshold

        top_features = self._get_top_features(features)

        elapsed_ms = (time.perf_counter() - t0) * 1000

        return IFScore(
            raw_score=round(raw, 6),
            risk_score=risk_score,
            risk_level=risk_level,
            is_anomalous=is_anomalous,
            threshold=float(threshold),
            top_features=top_features,
            inference_ms=round(elapsed_ms, 2),
        )

    def get_threshold(self) -> float:
        return float(self._metadata.get("threshold", -0.1))

    def get_metadata(self) -> Dict[str, Any]:
        return self._metadata

    def get_feature_importances(self) -> Dict[str, float]:
        return self._feature_importances or {}

    @property
    def is_loaded(self) -> bool:
        return self._loaded


# ── Singleton ─────────────────────────────────────────────────
isolation_forest_service = IsolationForestService()
