#!/bin/bash
set -e

cd /teamspace/studios/this_studio/Multi-GNN
source ~/.venv/bin/activate

echo "Installing kaggle..."
pip install kaggle > /dev/null

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
