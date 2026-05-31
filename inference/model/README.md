# TGNN Training (Temporal Graph Neural Network)
This directory is a separate copy of the Multi-GNN pipeline customized to train a **Temporal Graph Neural Network (TGNN)** on Lightning AI using the `HI-Small` dataset.

## Spatial-Temporal Hybrid Modeling (TGNN)
Traditional GNN models often treat timestamps as static features. Our custom `TGNN` architecture implements a spatial-temporal hybrid model:
1. **Spatial context:** It runs graph convolutions (`GINEConv`) on the transaction graph to update node embeddings.
2. **Temporal dynamics:** For each transaction edge, it extracts the updated sender and receiver node embeddings and concatenates them with the raw edge features—specifically the transaction amount and the transaction velocity (incoming and outgoing time-deltas).
3. **MLP Classifier:** It passes the combined spatial-temporal representation through a multi-layer neural network classifier to predict illicit transactions, making it highly responsive to rapid-firing and cyclical laundering patterns.

## Setup & Cloud Training (Lightning AI)
To train the TGNN model on a Lightning AI instance using the `HI-Small` dataset:

1. Clone or upload this `TGNN_Training` folder to your Lightning AI instance.
2. Make `setup_tgnn_h100.sh` executable and run it:
```bash
chmod +x setup_tgnn_h100.sh
./setup_tgnn_h100.sh
```

This script will:
- Set up a Python virtual environment and install all dependencies.
- Configure Kaggle API credentials.
- Download the raw `HI-Small_Trans.csv` dataset from Kaggle.
- Preprocess and format it into the expected PyTorch Geometric format under `data/Small_HI/`.
- Start training the TGNN model using the time-deltas (`--tds`) feature flag.

## Manual Usage
If you want to run steps manually, format the Kaggle files first:
```bash
python format_kaggle_files.py /path/to/kaggle-files/HI-Small_Trans.csv
```
And then run training with the `tgnn` model and the `--tds` flag:
```bash
python main.py --data Small_HI --model tgnn --tds --batch_size 131072 --save_model --unique_name small_hi_tgnn
```

## Usage
To run the experiments you need to run the `main.py` function and specify any arguments you want to use. There are two required arguments, namely `--data` and `--model`. For the `--data` argument, make sure you store the different datasets in different folders. Then, specify the folder name, e.g `--data Small_HI`. The `--model` parameter should be set to any of the model classed that are available, i.e. to one of `--model [gin, gat, rgcn, pna]`. Thus, to run a standard GNN, you need to run, e.g.:
```
python main.py --data Small_HI --model gin
```
Then you can add different adaptations to the models by selecting the respective arguments from:

<div align="center">

| Argument       | Description                  |
| -------------- | ---------------------------- |
| `--emlps`      | Edge updates via MLPs        |
| `--reverse_mp` | Reverse Message Passing      |
| `--ego`        | Ego ID's to the center nodes |
| `--ports`      | Port Numberings for edges    |

</div>
Thus, to run Multi-GIN with edge updates, you would run the following command:

```
python main.py --data Small_HI --model gin --emlps --reverse_mp --ego --ports
```

## Additional functionalities
There are several arguments that can be set for additional functionality. Here's a list with them:

<div align="center">

| Argument       | Description                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `--tqdm`       | Displays a progress bar during training and inference.                                                                                                   |
| `--save_model` | Saves the best model to the specified `model_to_save` path in the `data_config.json` file. Requires argment `--unique_name` to be specified.             |
| `--finetune`   | Loads a previously trained model (with name given by `--unique_name` and stored in `model_to_load` path in the `data_config.json`) to be finetuned.      |
| `--inference`  | Loads a previously trained model (with name given by `--unique_name` and stored in `model_to_load` path in the `data_config.json`) to do inference only. |

</div>

## Licence
Apache License
Version 2.0, January 2004