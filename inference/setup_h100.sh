#!/bin/bash
set -e

echo "Installing python3-venv..."
sudo apt-get update && sudo apt-get install -y python3.12-venv

echo "Setting up Virtual Environment..."
python3 -m venv ~/.venv
source ~/.venv/bin/activate

echo "Unzipping code..."
unzip -o Multi_GNN_Code_Latest.zip -d Multi-GNN
cd Multi-GNN

echo "Setting up Kaggle credentials..."
mkdir -p ~/.kaggle
echo '{"username":"bonshallangthasa","key":"2ad5574a4312e6aa43400378f16af386"}' > ~/.kaggle/kaggle.json
chmod 600 ~/.kaggle/kaggle.json

echo "Installing requirements..."
pip install kaggle datatable scikit-learn pandas wandb
pip install torch torchvision torchaudio
pip install torch_geometric

echo "Downloading Medium_HI dataset..."
mkdir -p AML_dataset
cd AML_dataset
kaggle datasets download -d ealtman2019/ibm-transactions-for-anti-money-laundering-aml -f HI-Medium_Trans.csv
unzip -o HI-Medium_Trans.csv.zip
rm HI-Medium_Trans.csv.zip
cd ..

echo "Formatting CSV..."
python format_kaggle_files.py AML_dataset/HI-Medium_Trans.csv

echo "Moving formatted dataset to PyG directory..."
mkdir -p data/Medium_HI
mv AML_dataset/formatted_transactions.csv data/Medium_HI/

echo "Starting training on Medium_HI..."
python main.py --data Medium_HI --model gin --testing --batch_size 131072 --save_model --unique_name medium_hi_run1
