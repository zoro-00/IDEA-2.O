// ============================================================
// STAR — useWebSocketSim Hook
// Real-time connection to STAR backend WebSocket.
// Falls back to mock simulation when backend is unreachable.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useAMLStore } from "@/store/useAMLStore";
import { WEBSOCKET_INTERVAL_MS } from "@/constants";
import type { AMLAlert, Transaction } from "@/types";

const RECONNECT_INTERVAL_MS = 5000;

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
  const addAlert = useAMLStore((state) => state.addAlert);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [backendConnected, setBackendConnected] = useState(false);

  // ── Attempt real backend WebSocket connection ──────────────
  useEffect(() => {
    if (!isStreaming) return;

    let reconnectTimer: NodeJS.Timeout | null = null;

    const connectWS = () => {
      // Derive backend WS URL from NEXT_PUBLIC_API_URL or current origin
      const base = (process.env.NEXT_PUBLIC_API_URL as string) || (typeof window !== 'undefined' && window.location?.origin) || 'http://localhost:8000';
      const wsBase = base.replace(/^http/, "ws");
      const wsEndpoint = `${wsBase.replace(/\/$/, "")}/ws/stream`;
      const wsUrl = wsEndpoint;
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setBackendConnected(true);
          console.log("[STAR] Connected to real backend WebSocket");
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === "transaction" && msg.data) {
              const d = msg.data;
              addTransaction({
                id: d.id,
                from: d.from,
                to: d.to,
                amount: d.amount,
                currency: d.currency || "USD",
                timestamp: d.timestamp || new Date().toLocaleTimeString(),
                type: "wire",
                channel: "SWIFT",
                risk: d.risk || "low",
                anomalyScore: d.anomalyScore || 0,
                flags: d.flags || [],
                jurisdiction: d.jurisdiction || "US",
              });
            }

            if (msg.type === "alert" && msg.data) {
              const d = msg.data;
              addAlert({
                id: d.id || `ALT-${Date.now()}`,
                type: d.type || "gnn_flagged",
                severity: d.severity || "medium",
                score: d.score || 0,
                entities: d.entities || [],
                entityCount: d.entityCount || 0,
                amount: d.amount || "$0.00",
                amountRaw: d.amountRaw || 0,
                time: d.time || new Date().toLocaleTimeString(),
                timestamp: d.timestamp || Date.now(),
                description: d.description || "",
                status: "open",
                tags: d.tags || [],
                relatedTransactions: d.relatedTransactions || [],
              });
            }
          } catch (e) {
            console.warn("[STAR WS] Parse error", e);
          }
        };

        ws.onclose = () => {
          setBackendConnected(false);
          console.log("[STAR] Backend WS closed — falling back to mock");
          // Schedule reconnect
          reconnectTimer = setTimeout(connectWS, RECONNECT_INTERVAL_MS);
        };

        ws.onerror = () => {
          setBackendConnected(false);
          ws.close();
        };
      } catch {
        setBackendConnected(false);
      }
    };

    connectWS();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [isStreaming, addTransaction, addAlert]);

  // ── Mock fallback when backend not connected ───────────────
  useEffect(() => {
    if (!isStreaming || backendConnected) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          addTransaction(generateRandomTransaction());
        }, Math.random() * 800);
      }
    }, WEBSOCKET_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStreaming, backendConnected, addTransaction]);

  return { backendConnected };
}
