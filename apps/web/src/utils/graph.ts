// ============================================================
// STAR — Graph Utils
// ============================================================
import type { GraphNode, GraphEdge } from "@/types";

/**
 * Basic Force-Directed Layout Simulation (Simplified for Canvas)
 */
export function simulateForceGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  iterations: number = 50
) {
  const k = Math.sqrt((width * height) / nodes.length);
  const repulse = (d: number) => (k * k) / d;
  const attract = (d: number) => (d * d) / k;

  const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();
  
  nodes.forEach(n => {
    positions.set(n.id, {
      x: n.x || (Math.random() - 0.5) * width,
      y: n.y || (Math.random() - 0.5) * height,
      vx: 0,
      vy: 0
    });
  });

  for (let i = 0; i < iterations; i++) {
    // Repulsion
    for (let u = 0; u < nodes.length; u++) {
      for (let v = u + 1; v < nodes.length; v++) {
        const p1 = positions.get(nodes[u].id)!;
        const p2 = positions.get(nodes[v].id)!;
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
        const f = repulse(dist);
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        p1.vx += fx; p1.vy += fy;
        p2.vx -= fx; p2.vy -= fy;
      }
    }

    // Attraction
    edges.forEach(e => {
      const p1 = positions.get(e.source);
      const p2 = positions.get(e.target);
      if (!p1 || !p2) return;
      
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
      const f = attract(dist);
      const fx = (dx / dist) * f;
      const fy = (dy / dist) * f;
      p1.vx -= fx; p1.vy -= fy;
      p2.vx += fx; p2.vy += fy;
    });

    // Update positions
    nodes.forEach(n => {
      const p = positions.get(n.id)!;
      // Damping
      p.vx *= 0.85;
      p.vy *= 0.85;
      p.x += p.vx;
      p.y += p.vy;
      
      // Bounds
      p.x = Math.max(-width/2, Math.min(width/2, p.x));
      p.y = Math.max(-height/2, Math.min(height/2, p.y));
    });
  }

  // Write back to nodes array
  return nodes.map(n => {
    const p = positions.get(n.id)!;
    return { ...n, x: p.x, y: p.y };
  });
}
