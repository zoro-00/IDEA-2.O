# Portable TGNN Inference

This folder contains the smallest inference-only slice extracted from the MULTI-GNN-AML repository. It is centered on the trained GAT-based TGNN checkpoint and is intended to be copied into a FastAPI or WebSocket backend later.

## What is included

- `models.py`: the exact GATe architecture needed to load the checkpoint
- `inference_engine.py`: a small inference wrapper with graph and transaction scoring
- `checkpoint.tar`: the selected trained weights
- `demo_input_generator.py`: synthetic graph generator for verification
- `verify_model.py`: end-to-end smoke test that loads the model and runs inference
- `sample_output.json`: example verification output

## Install

Install the minimal runtime dependencies:

```bash
pip install -r requirements.txt
```

Depending on your PyTorch build, PyTorch Geometric may also require matching binary wheels for its low-level extensions.

## Run verification

```bash
python verify_model.py
```

This will:

1. Load `checkpoint.tar`
2. Build the GATe inference model
3. Generate a small synthetic AML graph
4. Run inference in eval mode
5. Print prediction probabilities, suspicious edges, and tensor shapes
6. Write `sample_output.json`

## Input format

The selected checkpoint expects a homogeneous PyG `Data` object with:

- `x`: float tensor with shape `[num_nodes, 1]`
- `edge_index`: long tensor with shape `[2, num_edges]`
- `edge_attr`: float tensor with shape `[num_edges, 8]`
- `y`: optional long tensor with shape `[num_edges]`

For this checkpoint, the edge feature order is:

1. timestamp
2. amount
3. currency
4. format
5. in_port
6. out_port
7. in_time_delta
8. out_time_delta

## FastAPI integration later

Typical backend flow:

1. Receive a graph payload from an API or WebSocket message
2. Build a PyG `Data` object
3. Call `TGNNInferenceEngine.predict_graph(data)`
4. Return probabilities and suspicious edge indices as JSON

For a single transfer, use `predict_transaction(...)` to score a two-node mini graph.
