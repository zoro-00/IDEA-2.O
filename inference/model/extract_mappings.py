import pandas as pd

raw = pd.read_csv("C:/Users/bonsh/Desktop/Projects/FCCI/Multi-GNN/AML_dataset/LI-Small_Trans.csv", nrows=1000)

currency = {}
paymentFormat = {}

def get_dict_val(name, collection):
    if name in collection:
        val = collection[name]
    else:
        val = len(collection)
        collection[name] = val
    return val

for i in range(len(raw)):
    get_dict_val(raw.loc[i, "Receiving Currency"], currency)
    get_dict_val(raw.loc[i, "Payment Currency"], currency)
    get_dict_val(raw.loc[i, "Payment Format"], paymentFormat)

print("Currency Mapping:", currency)
print("Payment Format Mapping:", paymentFormat)
