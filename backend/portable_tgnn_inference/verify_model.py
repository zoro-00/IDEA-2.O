from __future__ import annotations

import json
from pathlib import Path

import torch

from demo_input_generator import generate_demo_graph
from inference_engine import TGNNInferenceEngine


def _tensor_shapes(graph):
    return {
        "x": list(graph.x.shape),
        "edge_index": list(graph.edge_index.shape),
        "edge_attr": list(graph.edge_attr.shape),
        "y": list(graph.y.shape) if getattr(graph, "y", None) is not None else None,
    }


def main() -> None:
    package_dir = Path(__file__).resolve().parent
    checkpoint_path = package_dir / "checkpoint.tar"
    output_path = package_dir / "sample_output.json"

    graph = generate_demo_graph()
    engine = TGNNInferenceEngine(checkpoint_path=checkpoint_path)
    result = engine.predict_graph(graph)
    attention_weights = engine.get_attention_weights()

    probabilities = result["probabilities"][:, 1]
    suspicious_indices = torch.where(result["suspicious_mask"])[0].tolist()

    print("Model loaded from:", checkpoint_path)
    print("Tensor shapes:", _tensor_shapes(graph))
    print("Prediction probabilities:", probabilities.tolist())
    print("Suspicious edges:", suspicious_indices)
    print("Model summary:")
    print(engine.model)

    output = {
        "tensor_shapes": _tensor_shapes(graph),
        "prediction_probabilities": probabilities.tolist(),
        "predictions": result["predictions"].tolist(),
        "suspicious_edges": suspicious_indices,
        "attention_layers": len(attention_weights) if attention_weights is not None else 0,
    }
    output_path.write_text(json.dumps(output, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
