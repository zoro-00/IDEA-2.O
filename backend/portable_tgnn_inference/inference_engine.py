from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional, Sequence, Union

import torch
from torch_geometric.data import Data

from models import GATe


@dataclass
class PredictionResult:
    logits: torch.Tensor
    probabilities: torch.Tensor
    predictions: torch.Tensor


class TGNNInferenceEngine:
    def __init__(self, checkpoint_path: Union[str, Path] = "checkpoint.tar", device: Optional[Union[str, torch.device]] = None):
        self.checkpoint_path = Path(checkpoint_path)
        self.device = torch.device(device) if device is not None else torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.model: Optional[GATe] = None
        self.model_config: Optional[Dict[str, int]] = None
        self._last_attention_weights = None

    def _infer_model_config(self, checkpoint: Dict[str, Any]) -> Dict[str, int]:
        state_dict = checkpoint["model_state_dict"]
        node_weight = state_dict["node_emb.weight"]
        edge_weight = state_dict["edge_emb.weight"]
        conv_prefixes = sorted({int(key.split(".")[1]) for key in state_dict if key.startswith("convs.")}, key=int)
        if "convs.0.att_src" not in state_dict:
            raise ValueError("The portable package only supports the GAT checkpoint; the provided checkpoint does not look like GAT.")

        return {
            "num_features": int(node_weight.shape[1]),
            "edge_dim": int(edge_weight.shape[1]),
            "n_hidden": int(node_weight.shape[0]),
            "n_heads": int(state_dict["convs.0.att_src"].shape[1]),
            "num_gnn_layers": len(conv_prefixes),
        }

    def load_model(self) -> GATe:
        if self.model is not None:
            return self.model

        checkpoint = torch.load(self.checkpoint_path, map_location=self.device)
        config = self._infer_model_config(checkpoint)
        self.model_config = config
        model = GATe(
            num_features=config["num_features"],
            num_gnn_layers=config["num_gnn_layers"],
            n_classes=2,
            n_hidden=config["n_hidden"],
            n_heads=config["n_heads"],
            edge_updates=False,
            edge_dim=config["edge_dim"],
            dropout=0.009,
            final_dropout=0.1,
        )
        model.load_state_dict(checkpoint["model_state_dict"])
        model.to(self.device)
        model.eval()
        self.model = model
        return model

    def _to_tensor(self, value: Any, *, dtype: torch.dtype, device: Optional[torch.device] = None) -> torch.Tensor:
        tensor = value if isinstance(value, torch.Tensor) else torch.tensor(value)
        return tensor.to(device=device or self.device, dtype=dtype)

    def _prepare_data(self, data: Data) -> Data:
        if not isinstance(data, Data):
            raise TypeError("TGNNInferenceEngine only accepts torch_geometric.data.Data for this checkpoint.")
        if data.x is None or data.edge_index is None or data.edge_attr is None:
            raise ValueError("Data must include x, edge_index, and edge_attr.")

        data = data.clone()
        data.x = self._to_tensor(data.x, dtype=torch.float32)
        data.edge_index = self._to_tensor(data.edge_index, dtype=torch.long)
        data.edge_attr = self._to_tensor(data.edge_attr, dtype=torch.float32)
        if data.edge_attr.dim() == 1:
            data.edge_attr = data.edge_attr.unsqueeze(0)
        if data.edge_attr.shape[1] != 8:
            raise ValueError(f"Expected edge_attr with 8 columns for this checkpoint, got {data.edge_attr.shape[1]}.")
        return data.to(self.device)

    @torch.no_grad()
    def predict_graph(self, data: Data) -> Dict[str, Any]:
        model = self.load_model()
        data = self._prepare_data(data)
        logits, attention_weights = model(data.x, data.edge_index, data.edge_attr, return_attention_weights=True)
        probabilities = torch.softmax(logits, dim=-1)
        predictions = probabilities.argmax(dim=-1)
        self._last_attention_weights = attention_weights
        suspicious_mask = probabilities[:, 1] >= 0.5
        return {
            "logits": logits.detach().cpu(),
            "probabilities": probabilities.detach().cpu(),
            "predictions": predictions.detach().cpu(),
            "suspicious_mask": suspicious_mask.detach().cpu(),
        }

    @torch.no_grad()
    def predict_transaction(
        self,
        source_features: Sequence[float],
        target_features: Sequence[float],
        edge_features: Sequence[float],
    ) -> Dict[str, Any]:
        x = torch.tensor([source_features, target_features], dtype=torch.float32)
        edge_index = torch.tensor([[0], [1]], dtype=torch.long)
        edge_attr = torch.tensor([edge_features], dtype=torch.float32)
        graph = Data(x=x, edge_index=edge_index, edge_attr=edge_attr)
        result = self.predict_graph(graph)
        return {
            "probabilities": result["probabilities"][0].tolist(),
            "prediction": int(result["predictions"][0].item()),
            "suspicious": bool(result["suspicious_mask"][0].item()),
        }

    def get_attention_weights(self):
        return self._last_attention_weights
