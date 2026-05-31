import os
import sys

# We will import demo_server and override its build_demo_scenario function
import demo_scenario
original_build = demo_scenario.build_demo_scenario

def custom_build():
    print("Loading custom dataset: custom_test_dataset.csv")
    return original_build(csv_filename="custom_test_dataset.csv")

# Monkeypatch before demo_server imports it
import demo_server
demo_server.build_demo_scenario = custom_build

def run_analysis():
    # 1. Load data & model
    demo_server.load_scenario()
    demo_server.load_model()
    demo_server.precompute_gnn_scores()
    
    # 2. Extract results
    scenario = demo_server.SCENARIO
    gnn_scores = demo_server.GNN_SCORES
    txs = scenario["transactions"]
    
    print("\n" + "="*80)
    print("  FRAUD TOPOLOGY DETECTION ANALYSIS REPORT")
    print("="*80)
    
    # Track node state for RuleEngine
    node_state = {}
    rule_engine = demo_server.RuleEngine()
    
    threshold = demo_server.ALERT_THRESHOLD
    
    topology_stats = {
        "Circular": {"total": 0, "detected": 0},
        "Dispersion (Fan-out)": {"total": 0, "detected": 0},
        "Gathering (Fan-in)": {"total": 0, "detected": 0},
        "Layering": {"total": 0, "detected": 0}
    }
    
    for i, tx in enumerate(txs):
        # Update node state
        if tx.sender_idx not in node_state:
            node_state[tx.sender_idx] = {"in": 0, "out": 0}
        if tx.receiver_idx not in node_state:
            node_state[tx.receiver_idx] = {"in": 0, "out": 0}
            
        node_state[tx.sender_idx]["out"] += 1
        node_state[tx.receiver_idx]["in"] += 1
        
        if tx.is_fraud == 1:
            gnn_score = gnn_scores[i]
            reasons = rule_engine.evaluate(tx, node_state)
            reasons_text = " ".join(reasons)
            
            is_detected = gnn_score > threshold
            
            # Determine which topology this belongs to based on node IDs
            # 101-104: Circular
            # 201-206: Fan-out
            # 301-305: Fan-in
            # 401-403: Layering
            
            topo = None
            if 100 < tx.sender_idx <= 104 or 100 < tx.receiver_idx <= 104:
                topo = "Circular"
            elif 200 < tx.sender_idx <= 206 or 200 < tx.receiver_idx <= 206:
                topo = "Dispersion (Fan-out)"
            elif 300 < tx.sender_idx <= 305 or 300 < tx.receiver_idx <= 305:
                topo = "Gathering (Fan-in)"
            elif 400 < tx.sender_idx <= 403 or 400 < tx.receiver_idx <= 403:
                topo = "Layering"
                
            if topo:
                topology_stats[topo]["total"] += 1
                if is_detected:
                    topology_stats[topo]["detected"] += 1
                
                print(f"TX {i:04d} | Topo: {topo:20s} | GNN Score: {gnn_score:.4f} | Detected: {'YES' if is_detected else 'NO '} | Rules: {reasons_text}")

    print("\n" + "="*80)
    print("  SUMMARY STATISTICS")
    print("="*80)
    for topo, stats in topology_stats.items():
        total = stats["total"]
        detected = stats["detected"]
        if total > 0:
            acc = (detected / total) * 100
            print(f"{topo:25s}: {detected}/{total} detected ({acc:.1f}%)")
            
if __name__ == "__main__":
    run_analysis()
