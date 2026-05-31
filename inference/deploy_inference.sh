#!/bin/bash
set -e

echo "Installing python3.12-venv..."
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y python3.12-venv

echo "Setting up Virtual Environment..."
python3 -m venv ~/.venv --system-site-packages
source ~/.venv/bin/activate

echo "Cloning repository..."
git clone https://github.com/Bonshal/MULTI-GNN-AML.git /home/zeus/Multi-GNN
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
unzip -o HI-Medium_Trans.csv.zip
rm HI-Medium_Trans.csv.zip
cd ..

echo "Formatting CSV..."
python format_kaggle_files.py AML_dataset/HI-Medium_Trans.csv

echo "Running Inference..."
python threshold_search.py --data Medium_HI --model gat --tds --ports --batch_size 131072 > inference_results.txt
cat inference_results.txt
