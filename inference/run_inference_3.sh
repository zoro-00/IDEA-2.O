#!/bin/bash
set -e

cd /teamspace/studios/this_studio/Multi-GNN
source ~/.venv/bin/activate

echo "Installing datatable..."
pip install datatable > /dev/null

echo "Formatting dataset..."
~/.venv/bin/python format_kaggle_files.py AML_dataset/LI-Small_Trans.csv

echo "Moving formatted dataset to expected location..."
mkdir -p data/Small_LI
mv AML_dataset/formatted_transactions.csv data/Small_LI/formatted_transactions.csv

echo "Preparing checkpoint..."
mkdir -p models
cp GIN_Small_LI_ROC0.958_Recall26pct.tar models/checkpoint_GIN.tar

echo "Running Inference..."
~/.venv/bin/python main.py --inference --testing --data Small_LI --model gin --unique_name GIN
