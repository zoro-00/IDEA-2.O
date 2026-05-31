#!/bin/bash
set -e

echo "Installing python3-venv..."
sudo apt-get update > /dev/null
sudo apt-get install -y python3.12-venv > /dev/null

echo "Extracting code..."
tar -xzf /teamspace/studios/this_studio/Multi-GNN.tar.gz -C /teamspace/studios/this_studio/ > /dev/null 2>&1 || true
cd /teamspace/studios/this_studio/Multi-GNN

echo "Setting up Virtual Environment..."
python3 -m venv ~/.venv
source ~/.venv/bin/activate

echo "Upgrading pip and installing dependencies..."
pip install --upgrade pip > /dev/null
pip install torch==2.3.0+cu121 torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 > /dev/null
pip install pyg_lib torch_scatter torch_sparse torch_cluster torch_spline_conv -f https://data.pyg.org/whl/torch-2.3.0+cu121.html > /dev/null
pip install torch-geometric pandas scikit-learn tqdm wandb jinja2 > /dev/null

echo "Setting up Kaggle credentials..."
mkdir -p ~/.kaggle
echo '{"username":"bonshallangthasa","key":"KGAT_2ad5574a4312e6aa43400378f16af386"}' > ~/.kaggle/kaggle.json
chmod 600 ~/.kaggle/kaggle.json

echo "Downloading dataset..."
mkdir -p AML_dataset
cd AML_dataset
~/.venv/bin/kaggle datasets download -d ealtman2019/ibm-transactions-for-anti-money-laundering-aml -f LI-Small_Trans.csv
unzip -q -o LI-Small_Trans.csv.zip || true
~/.venv/bin/kaggle datasets download -d ealtman2019/ibm-transactions-for-anti-money-laundering-aml -f LI-Small_accounts.csv
unzip -q -o LI-Small_accounts.csv.zip || true
cd ..

echo "Formatting dataset..."
~/.venv/bin/python format_kaggle_files.py LI-Small_Trans.csv

echo "Preparing checkpoint..."
mkdir -p models
cp GIN_Small_LI_ROC0.958_Recall26pct.tar models/checkpoint_GIN.tar

echo "Running Inference..."
~/.venv/bin/python main.py --inference --testing --data Small_LI --model gin --unique_name GIN
