#!/bin/bash
set -e
source ~/.venv/bin/activate
cd /home/zeus/Multi-GNN

echo "Formatting CSV..."
python format_kaggle_files.py AML_dataset/HI-Medium_Trans.csv

echo "Running Inference..."
python threshold_search.py --data Medium_HI --model gat --tds --ports --batch_size 131072 > inference_results.txt
cat inference_results.txt
