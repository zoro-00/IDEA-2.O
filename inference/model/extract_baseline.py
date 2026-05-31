import pandas as pd
import numpy as np
import torch
import json
import os

# Path to the locally stored IBM dataset
DATA_PATH = "data/Small_LI/formatted_transactions.csv"

def extract_statistics():
    print(f"Loading data from {DATA_PATH}...")
    df_edges = pd.read_csv(DATA_PATH)
    
    edge_features = ['Timestamp', 'Amount Received', 'Received Currency', 'Payment Format']
    
    print(f"Extracting features: {edge_features}")
    edge_attr = torch.tensor(df_edges.loc[:, edge_features].to_numpy()).float()
    
    # Calculate global mean and standard deviation
    edge_mean = edge_attr.mean(0)
    edge_std = edge_attr.std(0)
    
    # Avoid division by zero
    edge_std = torch.where(edge_std == 0, torch.tensor(1.0), edge_std)
    
    stats = {
        "features": edge_features,
        "edge_mean": edge_mean.tolist(),
        "edge_std": edge_std.tolist()
    }
    
    print("\n--- Baseline Statistics ---")
    for i, feature in enumerate(edge_features):
        print(f"{feature}:")
        print(f"  Mean: {edge_mean[i].item():.4f}")
        print(f"  Std:  {edge_std[i].item():.4f}")
        
    # Save to a config file
    out_path = "model_baseline_stats.json"
    with open(out_path, 'w') as f:
        json.dump(stats, f, indent=4)
        
    print(f"\nSaved baseline statistics to {out_path}")

if __name__ == "__main__":
    if os.path.exists(DATA_PATH):
        extract_statistics()
    else:
        print(f"Error: Could not find {DATA_PATH}")
