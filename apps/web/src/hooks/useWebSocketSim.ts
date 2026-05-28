// ============================================================
// STAR — useWebSocketSim Hook
// Simulates a streaming WebSocket connection for AML data
// ============================================================
import { useEffect, useRef } from "react";
import { useAMLStore } from "@/store/useAMLStore";
import { WEBSOCKET_INTERVAL_MS } from "@/constants";
import type { Transaction } from "@/types";

const generateRandomTransaction = (): Transaction => {
  const isSuspicious = Math.random() > 0.85;
  const amounts = [1200, 4500, 9500, 24000, 48000, 120000];
  const amount = amounts[Math.floor(Math.random() * amounts.length)] + Math.floor(Math.random() * 500);

  return {
    id: `TXN-${Math.floor(Math.random() * 90000) + 10000}`,
    from: `ACC-${Math.floor(Math.random() * 9000) + 1000}`,
    to: `ACC-${Math.floor(Math.random() * 9000) + 1000}`,
    amount,
    currency: "USD",
    timestamp: new Date().toLocaleTimeString([], { hour12: false }),
    type: Math.random() > 0.5 ? "wire" : "ach",
    channel: Math.random() > 0.5 ? "SWIFT" : "FEDWIRE",
    risk: isSuspicious ? (Math.random() > 0.5 ? "critical" : "high") : "low",
    anomalyScore: isSuspicious ? 0.75 + Math.random() * 0.24 : 0.1 + Math.random() * 0.3,
    flags: isSuspicious ? ["High velocity", "Structuring pattern"] : [],
    jurisdiction: Math.random() > 0.8 ? "KY" : "US",
  };
};

export function useWebSocketSim() {
  const isStreaming = useAMLStore((state) => state.isStreaming);
  const addTransaction = useAMLStore((state) => state.addTransaction);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isStreaming) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      // Add 1-3 random transactions to simulate bursty WebSocket traffic
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          addTransaction(generateRandomTransaction());
        }, Math.random() * 800); // Random offset within the interval
      }
    }, WEBSOCKET_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStreaming, addTransaction]);
}
