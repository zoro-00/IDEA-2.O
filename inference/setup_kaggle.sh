#!/bin/bash
mkdir -p ~/.kaggle
cat << 'EOF' > ~/.kaggle/kaggle.json
{"username":"bonshallangthasa","key":"KGAT_2ad5574a4312e6aa43400378f16af386"}
EOF
chmod 600 ~/.kaggle/kaggle.json

source /home/zeus/.venv/bin/activate
mkdir -p /home/zeus/Multi-GNN/AML_dataset
cd /home/zeus/Multi-GNN/AML_dataset

echo "Downloading HI-Medium_Trans.csv..."
kaggle datasets download -d ealtman2019/ibm-transactions-for-anti-money-laundering-aml -f HI-Medium_Trans.csv

echo "Downloading HI-Medium_accounts.csv..."
kaggle datasets download -d ealtman2019/ibm-transactions-for-anti-money-laundering-aml -f HI-Medium_accounts.csv

echo "Downloading HI-Medium_Patterns.txt..."
kaggle datasets download -d ealtman2019/ibm-transactions-for-anti-money-laundering-aml -f HI-Medium_Patterns.txt

echo "Unzipping files..."
unzip -o \*.zip
rm \*.zip
echo "Done!"
