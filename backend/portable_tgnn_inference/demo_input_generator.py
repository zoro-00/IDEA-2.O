from __future__ import annotations

from typing import List, Tuple

import numpy as np
import torch
from torch_geometric.data import Data


def _normalize_columns(values: np.ndarray) -> np.ndarray:
    mean = values.mean(axis=0, keepdims=True)
    std = values.std(axis=0, keepdims=True)
    std[std == 0] = 1.0
    return (values - mean) / std


def generate_demo_graph(seed: int = 7, num_nodes: int = 30) -> Data:
    rng = np.random.default_rng(seed)
    node_features = np.ones((num_nodes, 1), dtype=np.float32)

    edges: List[Tuple[int, int]] = []
    labels: List[int] = []
    timestamps: List[float] = []
    amounts: List[float] = []
    currencies: List[float] = []
    formats: List[float] = []
    in_ports: List[float] = []
    out_ports: List[float] = []
    in_tds: List[float] = []
    out_tds: List[float] = []

    def add_edge(src: int, dst: int, timestamp: float, amount: float, currency: float, payment_format: float, label: int, in_port: float, out_port: float, in_td: float, out_td: float) -> None:
        edges.append((src, dst))
        labels.append(label)
        timestamps.append(timestamp)
        amounts.append(amount)
        currencies.append(currency)
        formats.append(payment_format)
        in_ports.append(in_port)
        out_ports.append(out_port)
        in_tds.append(in_td)
        out_tds.append(out_td)

    base_time = 1_700_000_000.0

    laundering_ring = [1, 4, 7, 10, 1]
    for i in range(len(laundering_ring) - 1):
        add_edge(
            laundering_ring[i],
            laundering_ring[i + 1],
            base_time + i * 180,
            42_000 + i * 1_000,
            float(i % 4),
            float(i % 3),
            1,
            float(i),
            float((i + 1) % 3),
            float(30 + i),
            float(40 + i),
        )

    layering_chain = [12, 15, 18, 21, 24]
    for i in range(len(layering_chain) - 1):
        add_edge(
            layering_chain[i],
            layering_chain[i + 1],
            base_time + 900 + i * 75,
            8_000 + i * 250,
            float((i + 1) % 3),
            float((i + 2) % 4),
            1 if i < 3 else 0,
            float((i + 2) % 5),
            float((i + 3) % 5),
            float(5 + i),
            float(7 + i),
        )

    structuring_sources = [2, 3, 5, 6, 8, 9]
    for i, src in enumerate(structuring_sources):
        add_edge(
            src,
            11,
            base_time + 1_500 + i * 60,
            9_500 + i * 125,
            float(i % 2),
            float(i % 4),
            1 if i in {1, 4} else 0,
            float(i % 3),
            float((i + 1) % 3),
            float(3 + i),
            float(4 + i),
        )

    while len(edges) < 46:
        src = int(rng.integers(0, num_nodes))
        dst = int(rng.integers(0, num_nodes))
        if src == dst:
            continue
        add_edge(
            src,
            dst,
            base_time + 2_500 + len(edges) * 45,
            float(rng.uniform(500, 25_000)),
            float(rng.integers(0, 4)),
            float(rng.integers(0, 5)),
            0,
            float(rng.integers(0, 5)),
            float(rng.integers(0, 5)),
            float(rng.uniform(1, 60)),
            float(rng.uniform(1, 60)),
        )

    edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous()
    edge_attr = np.column_stack(
        [
            timestamps,
            amounts,
            currencies,
            formats,
            in_ports,
            out_ports,
            in_tds,
            out_tds,
        ]
    ).astype(np.float32)
    edge_attr = _normalize_columns(edge_attr)

    y = torch.tensor(labels, dtype=torch.long)
    x = torch.tensor(_normalize_columns(node_features), dtype=torch.float32)

    return Data(
        x=x,
        edge_index=edge_index,
        edge_attr=torch.tensor(edge_attr, dtype=torch.float32),
        y=y,
    )


if __name__ == "__main__":
    graph = generate_demo_graph()
    print(graph)
