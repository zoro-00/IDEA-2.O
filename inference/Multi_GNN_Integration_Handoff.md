# Multi-GNN Integration Guide (Handoff Document)

## Overview
This document outlines the steps required to migrate our previously trained **Static Multi-GNN Model** into the existing Anti-Money Laundering (AML) visualization web application. 

Currently, the `backend` handles inference using a legacy baseline model (`trained_tgnn.pth`). We are replacing this with the highly optimized **Heterogeneous GINe Model** (Multi-GNN) that we successfully trained on the massive IBM dataset.

---

## 1. Architectural Context

### A. Existing Visualization Architecture
*   **Backend (`FCCI/backend/`)**: A Python-based server (`server.py`, `inference_bridge.py`) that handles graph data extraction (from Neo4j / CSVs) and passes subgraphs to the model for inference.
*   **Frontend (`FCCI/frontend/`)**: A Vite/React application that visualizes the nodes (Accounts) and edges (Transactions), highlighting fraudulent nodes/edges in red.

### B. New Model Architecture (Multi-GNN)
*   **Model Class**: `GINe` (Graph Isomorphism Network with Edge features).
*   **Graph Type**: `HeteroData` (Heterogeneous graph with `('node', 'to', 'node')` edge types).
*   **Edge Features**: The model expects exactly 4 features per transaction edge in a specific float tensor format:
    1.  `Amount`
    2.  `Currency`
    3.  `Format`
    4.  `Timestamp` (or Time Delta, depending on how it was scaled during training)
*   **Sampling Mechanic**: Uses PyTorch Geometric's standard `LinkNeighborLoader`. Because this is the *Static* Multi-GNN, it uses the lightning-fast C++ random neighbor sampler, meaning you do not have to worry about complex temporal sorting during live inference.

---

## 2. Step-by-Step Integration Instructions

### Step 1: Migrate the Core Model Files
1. Copy the final Multi-GNN weights (`checkpoint_gin.tar` or `.pth`) from the `Multi-GNN` training directory into the `backend/` directory.
2. Copy `models.py` from `Multi-GNN/` to `backend/`. This file contains the PyTorch class definition for the `GINe` network which the backend needs to rebuild the neural layers.

### Step 2: Update `inference_bridge.py`
Update the backend script to instantiate the new architecture instead of the legacy model.

```python
import torch
from models import GINe # From the newly copied models.py

# 1. Instantiate the static Multi-GNN model
model = GINe(
    in_channels=1, 
    hidden_channels=66, # Ensure this matches the training configuration!
    out_channels=2,     # Binary classification (Fraud vs. Not Fraud)
    edge_dim=4          # Amount, Currency, Format, Timestamp
)

# 2. Load the Multi-GNN checkpoint safely
checkpoint = torch.load('checkpoint_gin.tar', map_location=torch.device('cpu'))

# Depending on how it was saved, you may need to access ['model_state_dict'] or load it directly
if 'model_state_dict' in checkpoint:
    model.load_state_dict(checkpoint['model_state_dict'])
else:
    model.load_state_dict(checkpoint)

# 3. Set to evaluation mode
model.eval()
```

### Step 3: Subgraph Extraction & Fast Data Pipeline
When a live transaction is flagged for inference by the frontend, the backend must construct the surrounding subgraph to give the GNN context.

1.  **Extract the Neighborhood**: The backend queries Neo4j (or the live DB) to extract all transactions connected to the sender/receiver up to 2 hops away.
2.  **Format into `HeteroData`**: The subgraph must be converted into a PyTorch Geometric `HeteroData` object.
    *   `data['node'].x` -> `torch.ones((num_nodes, 1))` (Since nodes don't have explicit features).
    *   `data['node', 'to', 'node'].edge_index` -> The connections (Shape `[2, num_edges]`).
    *   `data['node', 'to', 'node'].edge_attr` -> The 4 features (Shape `[num_edges, 4]`).
3.  **Fast Sampling**: Use `LinkNeighborLoader` to format the batch. Because this is the static Multi-GNN, you do not need temporal arguments, making this incredibly fast.

```python
from torch_geometric.loader import LinkNeighborLoader

# Target transaction index to evaluate
target_edge_index = torch.tensor([live_transaction_id]) 

loader = LinkNeighborLoader(
    data, 
    num_neighbors=[10, 10], # Sample 10 neighbors at hop 1, 10 at hop 2
    edge_label_index=(('node', 'to', 'node'), data['node', 'to', 'node'].edge_index[:, target_edge_index]),
    batch_size=1,
    shuffle=False
    # No num_workers or time_attr needed here!
)

for batch in loader:
    with torch.no_grad():
        out = model(batch.x_dict, batch.edge_index_dict, batch.edge_attr_dict)
        probabilities = torch.nn.functional.softmax(out[('node', 'to', 'node')], dim=-1)
        fraud_prob = probabilities[:, 1].item() # Extract the probability of fraud
```

### Step 4: Return JSON to Visualization Frontend
The `inference_bridge.py` returns the `fraud_prob` to `server.py`. 
`server.py` formats it into a JSON response to the Vite frontend. The frontend graph library then consumes this probability to dynamically style the network (e.g., turning the specific transaction line bright red on the screen if the Multi-GNN flags it as highly suspicious).
