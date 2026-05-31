#!/bin/bash


echo "Killing previous Small_HI training job..."
pkill -f 'main.py'

mkdir -p /teamspace/studios/this_studio/Multi-GNN/AML_dataset
cd /teamspace/studios/this_studio/Multi-GNN/AML_dataset
echo "Downloading LI-Small_Trans.csv..."
/home/zeus/.venv/bin/kaggle datasets download -d ealtman2019/ibm-transactions-for-anti-money-laundering-aml -f LI-Small_Trans.csv
unzip -o \*.zip
rm \*.zip

mkdir -p /teamspace/studios/this_studio/Multi-GNN/data/Small_LI
cp LI-Small_Trans.csv /teamspace/studios/this_studio/Multi-GNN/data/Small_LI/
cd /teamspace/studios/this_studio/Multi-GNN
echo "Formatting dataset..."
/home/zeus/.venv/bin/python format_kaggle_files.py /teamspace/studios/this_studio/Multi-GNN/data/Small_LI/LI-Small_Trans.csv

echo "Starting fine-tuning on Small_LI..."
nohup /home/zeus/.venv/bin/python main.py --data Small_LI --model gin --batch_size 81920 --n_epochs 50 --save_model --finetune --unique_name tgnn_v1 > training_v3_LI_output.log 2>&1 &

echo "Done!"
