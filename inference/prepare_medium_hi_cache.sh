#!/bin/bash
set -e

echo "Installing python3.12-venv..."
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y python3.12-venv

echo "Setting up Virtual Environment..."
python3 -m venv ~/.venv --system-site-packages
source ~/.venv/bin/activate

echo "Cloning repository..."
git clone https://github.com/Bonshal/MULTI-GNN-AML.git /home/zeus/Multi-GNN || echo "Repo already exists"
cd /home/zeus/Multi-GNN

echo "Setting up Kaggle credentials..."
mkdir -p ~/.kaggle
echo '{"username":"bonshallangthasa","key":"2ad5574a4312e6aa43400378f16af386"}' > ~/.kaggle/kaggle.json
chmod 600 ~/.kaggle/kaggle.json

echo "Installing requirements..."
pip install kaggle datatable scikit-learn pandas wandb
pip install torch==2.3.0 --index-url https://download.pytorch.org/whl/cu121
pip install torch-geometric==2.5.3
pip install pyg_lib torch_scatter torch_sparse torch_cluster torch_spline_conv -f https://data.pyg.org/whl/torch-2.3.0+cu121.html

echo "Downloading Medium_HI dataset..."
mkdir -p AML_dataset
cd AML_dataset
kaggle datasets download -d ealtman2019/ibm-transactions-for-anti-money-laundering-aml -f HI-Medium_Trans.csv
if [ -f "HI-Medium_Trans.csv.zip" ]; then
    unzip -o HI-Medium_Trans.csv.zip
    rm HI-Medium_Trans.csv.zip
fi
cd ..

echo "Formatting CSV..."
python format_kaggle_files.py AML_dataset/HI-Medium_Trans.csv

echo "Moving formatted dataset to PyG directory..."
mkdir -p data/Medium_HI
mv AML_dataset/formatted_transactions.csv data/Medium_HI/

echo "Triggering PyG Graph Caching..."
cat << 'EOF' > cache_graph.py
import json
from data_loading import get_data
from util import create_parser

parser = create_parser()
args = parser.parse_args(['--data', 'Medium_HI', '--model', 'gat', '--tds', '--ports'])

with open('data_config.json', 'r') as config_file:
    data_config = json.load(config_file)

print("Starting CPU-bound PyG graph generation (Time Deltas & Ports)...")
tr_data, val_data, te_data, tr_inds, val_inds, te_inds = get_data(args, data_config)
print("Graph caching complete! PT files saved to disk. Ready for H200.")
EOF

python cache_graph.py
