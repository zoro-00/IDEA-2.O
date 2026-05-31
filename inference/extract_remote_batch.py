import pandas as pd
import numpy as np
import torch
from torch_geometric.utils import k_hop_subgraph
import sys
import os

if len(sys.argv) != 2:
    print("Usage: python extract_batch.py <dataset_name>")
    sys.exit(1)

dataset = sys.argv[1] # e.g., Small_HI, Small_LI
csv_path = f"AML_dataset/{dataset}/formatted_transactions.csv"
out_name = f"demo_subset_{dataset.lower()}.csv"

if not os.path.exists(csv_path):
    print(f"File not found: {csv_path}")
    sys.exit(1)

print(f"Loading formatted transactions CSV ({dataset})...")
df = pd.read_csv(csv_path)

src = torch.tensor(df['from_id'].values, dtype=torch.long)
dst = torch.tensor(df['to_id'].values, dtype=torch.long)
edge_index = torch.stack([src, dst], dim=0)

fraud_indices = df.index[df['Is Laundering'] == 1].tolist()
print(f"Total fraud transactions: {len(fraud_indices)}")

if len(fraud_indices) == 0:
    print("No fraud transactions found. Exiting.")
    sys.exit(0)

# Sample some fraud transactions (e.g. 5)
np.random.seed(123)
sample_size = min(5, len(fraud_indices))
sampled_fraud_edges = np.random.choice(fraud_indices, sample_size, replace=False)

fraud_nodes = set()
for idx in sampled_fraud_edges:
    fraud_nodes.add(df.iloc[idx]['from_id'])
    fraud_nodes.add(df.iloc[idx]['to_id'])

node_idx = torch.tensor(list(fraud_nodes), dtype=torch.long)
print(f"Center fraud nodes: {len(node_idx)}")

# Attempt 2-hop
subset_nodes, subset_edge_index, mapping, edge_mask = k_hop_subgraph(
    node_idx, num_hops=2, edge_index=edge_index, relabel_nodes=False, flow="source_to_target"
)
subgraph_edges = edge_mask.nonzero(as_tuple=True)[0].numpy()
print(f"2-hop subgraph edges: {len(subgraph_edges)}")

if len(subgraph_edges) > 300:
    print("Subgraph too large, attempting 1-hop instead...")
    subset_nodes, subset_edge_index, mapping, edge_mask = k_hop_subgraph(
        node_idx, num_hops=1, edge_index=edge_index, relabel_nodes=False, flow="source_to_target"
    )
    subgraph_edges = edge_mask.nonzero(as_tuple=True)[0].numpy()
    print(f"1-hop subgraph edges: {len(subgraph_edges)}")
    
    if len(subgraph_edges) > 300:
        all_sub_df = df.iloc[subgraph_edges]
        f_df = all_sub_df[all_sub_df['Is Laundering'] == 1]
        n_df = all_sub_df[all_sub_df['Is Laundering'] == 0].sample(n=min(300, len(all_sub_df[all_sub_df['Is Laundering'] == 0])), random_state=123)
        df_target = pd.concat([f_df, n_df]).sort_values('Timestamp')
    else:
        df_target = df.iloc[subgraph_edges].sort_values('Timestamp')
else:
    df_target = df.iloc[subgraph_edges].sort_values('Timestamp')

print(f"Target edges selected: {len(df_target)}")

# Remap entity IDs to 0..N-1
all_entities = sorted(set(df_target['from_id'].tolist() + df_target['to_id'].tolist()))
entity_map = {old: new for new, old in enumerate(all_entities)}
df_target['from_id'] = df_target['from_id'].map(entity_map)
df_target['to_id'] = df_target['to_id'].map(entity_map)

# Reset EdgeID
df_target = df_target.reset_index(drop=True)
df_target['EdgeID'] = range(len(df_target))

df_target.to_csv(out_name, index=False)
print(f"Saved to {out_name}")
