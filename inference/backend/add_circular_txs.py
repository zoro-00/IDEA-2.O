import pandas as pd

# Load existing data
csv_path = 'demo_subset_medium_hi_2.csv'
df = pd.read_csv(csv_path)

# Let's add two rings: one small (3 nodes) and one larger (5 nodes)
# to make the demonstration interesting.
# We'll use node IDs that are higher than the current max to avoid conflicts.
max_node = max(df['from_id'].max(), df['to_id'].max())

# Ring 1: 3 nodes (Structuring + Circular)
# E.g. node A -> B -> C -> A
A = max_node + 1
B = max_node + 2
C = max_node + 3

# Ring 2: 5 nodes (Layering + Circular)
D = max_node + 4
E = max_node + 5
F = max_node + 6
G = max_node + 7
H = max_node + 8

base_ts = df['Timestamp'].max() + 1000  # Put them at the end

new_rows = []
edge_id_counter = df['EdgeID'].max() + 1

def add_tx(frm, to, ts, amount, is_fraud=1):
    global edge_id_counter
    new_rows.append({
        'EdgeID': edge_id_counter,
        'from_id': frm,
        'to_id': to,
        'Timestamp': ts,
        'Amount Sent': amount,
        'Sent Currency': 0, # USD
        'Amount Received': amount,
        'Received Currency': 0, # USD
        'Payment Format': 4, # Wire
        'Is Laundering': is_fraud
    })
    edge_id_counter += 1

# Ring 1 Transactions (Amount just below 10k to trigger Structuring)
ts1 = base_ts
amt1 = 9500.00
add_tx(A, B, ts1, amt1)
add_tx(B, C, ts1 + 100, amt1 * 0.98) # slightly less to simulate fees
add_tx(C, A, ts1 + 200, amt1 * 0.96)

# Ring 2 Transactions (High value layering)
ts2 = base_ts + 1000
amt2 = 150000.00
add_tx(D, E, ts2, amt2)
add_tx(E, F, ts2 + 100, amt2 * 0.99)
add_tx(F, G, ts2 + 200, amt2 * 0.98)
add_tx(G, H, ts2 + 300, amt2 * 0.97)
add_tx(H, D, ts2 + 400, amt2 * 0.96)

# Append and save
new_df = pd.DataFrame(new_rows)
df_combined = pd.concat([df, new_df], ignore_index=True)

# Ensure it's sorted by Timestamp
df_combined = df_combined.sort_values(by='Timestamp').reset_index(drop=True)

# Reassign EdgeID to be sequential
df_combined['EdgeID'] = range(len(df_combined))

df_combined.to_csv(csv_path, index=False)
print(f"Added {len(new_rows)} circular transactions.")
