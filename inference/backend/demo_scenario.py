"""
demo_scenario.py — Pure ML Data Loader (Medium_HI)
===================================================
Loads actual IBM AML Medium_HI transactions directly sampled via PyG 1-hop 
subgraphs to perfectly preserve graph structure. No rule engine needed.
"""

import os
import csv
import torch
import numpy as np
from dataclasses import dataclass


@dataclass
class Transaction:
    """A single transaction from the Medium_HI dataset."""
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


# ── Currency / Payment Format Label Maps ─────────────────────────────────

CURRENCY_LABELS = [
    "USD", "EUR", "BTC", "Yuan", "Yen", "GBP", "BRL", "AUD",
    "INR", "RUB", "CAD", "MXN", "CHF", "ILS", "SAR"
]

PAYMENT_FORMAT_LABELS = [
    "Reinvestment", "Cheque", "ACH", "Credit Card", "Wire", "Cash", "Bitcoin"
]


def build_demo_scenario(csv_filename="demo_subset_medium_hi_2.csv"):
    """
    Load the real Medium_HI demo subset CSV (structure-preserved subgraph) or a custom CSV.
    """
    csv_path = os.path.join(os.path.dirname(__file__), csv_filename)

    transactions = []
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


# ── PyG Tensor Conversion (Pure ML, 4 features) ─────────────────────────

def scenario_to_pyg_tensors(scenario: dict):
    """
    Convert the scenario into PyG-compatible tensors.
    Edge features (4 dims): [Timestamp, Amount, Currency, Format]
    This perfectly matches the Medium_HI model training state.
    """
    txs = scenario["transactions"]
    num_nodes = len(scenario["entity_names"])
    num_edges = len(txs)

    x = torch.ones((num_nodes, 1), dtype=torch.float32)

    src, dst, base_attrs, labels, timestamps = [], [], [], [], []
    for tx in txs:
        src.append(tx.sender_idx)
        dst.append(tx.receiver_idx)
        # Pad with 4 zeros to match the 8-feature topology expected by the model
        base_attrs.append([tx.timestamp, tx.amount_sent, tx.sent_currency, tx.payment_format, 0.0, 0.0, 0.0, 0.0])
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


def build_graph_json(scenario: dict):
    """Build the JSON payload for the frontend graph visualization."""
    names = scenario["entity_names"]
    txs = scenario["transactions"]

    active_nodes = set()
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
