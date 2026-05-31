#!/bin/bash
set -e

echo "Installing python3.12-venv..."
sudo apt-get update > /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y python3.12-venv > /dev/null

echo "Setting up Virtual Environment..."
python3 -m venv ~/.venv --system-site-packages
source ~/.venv/bin/activate

echo "Cloning repository..."
git clone https://github.com/Bonshal/MULTI-GNN-AML.git /teamspace/studios/this_studio/Multi-GNN || echo "Repo already exists"
cd /teamspace/studios/this_studio/Multi-GNN

echo "Setting up Kaggle credentials..."
mkdir -p ~/.kaggle
echo '{"username":"bonshallangthasa","key":"2ad5574a4312e6aa43400378f16af386"}' > ~/.kaggle/kaggle.json
chmod 600 ~/.kaggle/kaggle.json

echo "Installing requirements..."
pip install kaggle datatable scikit-learn pandas > /dev/null
pip install torch==2.3.0 --index-url https://download.pytorch.org/whl/cpu > /dev/null
pip install torch-geometric==2.5.3 > /dev/null
# No need for cuda packages for just extracting subgraphs
# pip install pyg_lib torch_scatter torch_sparse torch_cluster torch_spline_conv -f https://data.pyg.org/whl/torch-2.3.0+cpu.html > /dev/null

echo "Downloading Medium_HI dataset..."
mkdir -p AML_dataset/Medium_HI
cd AML_dataset/Medium_HI
~/.venv/bin/kaggle datasets download -d ealtman2019/ibm-transactions-for-anti-money-laundering-aml -f HI-Medium_Trans.csv
if [ -f "HI-Medium_Trans.csv.zip" ]; then
    unzip -o HI-Medium_Trans.csv.zip
    rm HI-Medium_Trans.csv.zip
fi
cd ../..

echo "Formatting CSV..."
~/.venv/bin/python format_kaggle_files.py AML_dataset/Medium_HI/HI-Medium_Trans.csv

echo "Running extraction..."
cat << 'EOF' > extract_khop_new.py
import pandas as pd
import numpy as np
import torch
from torch_geometric.utils import k_hop_subgraph
import random

print("Loading formatted transactions CSV (Medium_HI)...")
df = pd.read_csv("AML_dataset/Medium_HI/formatted_transactions.csv")

# Create edge index
src = torch.tensor(df['from_id'].values, dtype=torch.long)
dst = torch.tensor(df['to_id'].values, dtype=torch.long)
edge_index = torch.stack([src, dst], dim=0)

fraud_indices = df.index[df['Is Laundering'] == 1].tolist()
print(f"Total fraud transactions: {len(fraud_indices)}")

# Sample 5 fraud transactions (with a new seed so it's a 'similar batch')
np.random.seed(99)
sampled_fraud_edges = np.random.choice(fraud_indices, 5, replace=False)

# Get the nodes involved in these fraud transactions
fraud_nodes = set()
for idx in sampled_fraud_edges:
    fraud_nodes.add(df.iloc[idx]['from_id'])
    fraud_nodes.add(df.iloc[idx]['to_id'])

node_idx = torch.tensor(list(fraud_nodes), dtype=torch.long)
print(f"Center fraud nodes: {len(node_idx)}")

# Extract 2-hop subgraph (GNN uses 2 layers)
subset_nodes, subset_edge_index, mapping, edge_mask = k_hop_subgraph(
    node_idx, num_hops=2, edge_index=edge_index, relabel_nodes=False, flow="source_to_target"
)

# Convert edge_mask to indices
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
        n_df = all_sub_df[all_sub_df['Is Laundering'] == 0].sample(n=300-len(f_df), random_state=99)
        df_target = pd.concat([f_df, n_df]).sort_values('Timestamp')
    else:
        df_target = df.iloc[subgraph_edges].sort_values('Timestamp')
else:
    df_target = df.iloc[subgraph_edges].sort_values('Timestamp')

print(f"Target edges selected: {len(df_target)}")

# Remap entity IDs to 0..N-1 for clean graph visualization
all_entities = sorted(set(df_target['from_id'].tolist() + df_target['to_id'].tolist()))
entity_map = {old: new for new, old in enumerate(all_entities)}
df_target['from_id'] = df_target['from_id'].map(entity_map)
df_target['to_id'] = df_target['to_id'].map(entity_map)

# Reset EdgeID
df_target = df_target.reset_index(drop=True)
df_target['EdgeID'] = range(len(df_target))

df_target.to_csv('demo_subset_medium_hi_new.csv', index=False)
print("Saved to demo_subset_medium_hi_new.csv")
EOF

~/.venv/bin/python extract_khop_new.py
