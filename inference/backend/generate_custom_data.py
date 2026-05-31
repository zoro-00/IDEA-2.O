import csv
import random

def generate_data():
    transactions = []
    current_time = 100.0
    
    # Generate 300 background transactions chronologically
    for _ in range(300):
        from_id = random.randint(0, 99)
        to_id = random.randint(0, 99)
        if from_id == to_id:
            continue
            
        # Moderate noise: mostly USD and ACH, but occasionally higher amounts
        amt = round(random.uniform(10, 5000), 2)
        currency = random.choices([0, 1, 5], weights=[0.85, 0.1, 0.05])[0] 
        format_type = random.choices([0, 1, 2, 4], weights=[0.2, 0.2, 0.5, 0.1])[0]
        
        transactions.append({
            "from_id": from_id, "to_id": to_id,
            "Timestamp": current_time,
            "Amount Sent": amt, "Sent Currency": currency,
            "Amount Received": amt, "Received Currency": currency, "Payment Format": format_type,
            "Is Laundering": 0
        })
        current_time += random.uniform(5.0, 15.0)

    # Helper to insert a block of transactions chronologically into the stream
    def insert_block(block_txs):
        insert_idx = random.randint(50, len(transactions) - 50)
        base_time = transactions[insert_idx]["Timestamp"]
        
        # Adjust timestamps for the block so they happen rapidly in sequence
        for j, tx in enumerate(block_txs):
            tx["Timestamp"] = base_time + (j * 2.0) + random.uniform(0.1, 1.0)
            
        # Insert them in
        for j, tx in enumerate(block_txs):
            transactions.insert(insert_idx + j, tx)

    # 2. Circular Topology
    circle_txs = []
    circle_nodes = [101, 102, 103, 104]
    circle_amt = 150000.0
    for i in range(len(circle_nodes)):
        u = circle_nodes[i]
        v = circle_nodes[(i+1) % len(circle_nodes)]
        circle_txs.append({
            "from_id": u, "to_id": v,
            "Amount Sent": circle_amt, "Sent Currency": 1,
            "Amount Received": circle_amt, "Received Currency": 1, "Payment Format": 4,
            "Is Laundering": 1
        })
    insert_block(circle_txs)
        
    # 3. Fan-out (Dispersion)
    fanout_txs = []
    fanout_hub = 201
    fanout_leaves = [202, 203, 204, 205, 206]
    for leaf in fanout_leaves:
        amt = round(random.uniform(9000, 9999), 2)
        fanout_txs.append({
            "from_id": fanout_hub, "to_id": leaf,
            "Amount Sent": amt, "Sent Currency": 0,
            "Amount Received": amt, "Received Currency": 0, "Payment Format": 6,
            "Is Laundering": 1
        })
    insert_block(fanout_txs)

    # 4. Fan-in (Gathering)
    fanin_txs = []
    fanin_hub = 305
    fanin_leaves = [301, 302, 303, 304]
    for leaf in fanin_leaves:
        amt = round(random.uniform(50000, 80000), 2)
        fanin_txs.append({
            "from_id": leaf, "to_id": fanin_hub,
            "Amount Sent": amt, "Sent Currency": 0,
            "Amount Received": amt, "Received Currency": 0, "Payment Format": 4,
            "Is Laundering": 1
        })
    insert_block(fanin_txs)
        
    # 5. Layering (Pass-through)
    layering_txs = []
    layering_txs.append({
        "from_id": 401, "to_id": 402,
        "Amount Sent": 120000.0, "Sent Currency": 0,
        "Amount Received": 120000.0, "Received Currency": 0, "Payment Format": 4, 
        "Is Laundering": 1
    })
    layering_txs.append({
        "from_id": 402, "to_id": 403,
        "Amount Sent": 120000.0, "Sent Currency": 0, 
        "Amount Received": 115000.0, "Received Currency": 1, "Payment Format": 4,
        "Is Laundering": 1
    })
    insert_block(layering_txs)
    
    # Sort strictly by timestamp just to be safe, then apply EdgeID
    transactions.sort(key=lambda x: x["Timestamp"])
    for i, tx in enumerate(transactions):
        tx["EdgeID"] = i
    
    csv_file = "custom_test_dataset.csv"
    fields = ["EdgeID", "from_id", "to_id", "Timestamp", "Amount Sent", "Sent Currency", 
              "Amount Received", "Received Currency", "Payment Format", "Is Laundering"]
              
    with open(csv_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(transactions)
        
    print(f"Generated {len(transactions)} temporally sound transactions to {csv_file}")
    
if __name__ == "__main__":
    generate_data()
