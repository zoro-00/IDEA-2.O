"use client";

import { useEffect, useRef, useCallback } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  risk: number;
  connections: number[];
  pulsePhase: number;
}

export default function AnimatedGraphBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const timeRef = useRef(0);

  const initNodes = useCallback((width: number, height: number) => {
    const nodes: Node[] = [];
    const count = Math.min(Math.floor((width * height) / 18000), 80);

    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1,
        risk: Math.random(),
        connections: [],
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Pre-compute connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && Math.random() > 0.6) {
          nodes[i].connections.push(j);
        }
      }
    }

    nodesRef.current = nodes;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      initNodes(window.innerWidth, window.innerHeight);
    };

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouse);

    const animate = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const nodes = nodesRef.current;
      const mouse = mouseRef.current;
      timeRef.current += 0.01;
      const time = timeRef.current;

      ctx.clearRect(0, 0, width, height);

      // Update and draw
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Mouse interaction
        const mdx = mouse.x - node.x;
        const mdy = mouse.y - node.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 200) {
          node.vx -= (mdx / mDist) * 0.02;
          node.vy -= (mdy / mDist) * 0.02;
        }

        // Update position
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.999;
        node.vy *= 0.999;

        // Wrap around
        if (node.x < -20) node.x = width + 20;
        if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20;
        if (node.y > height + 20) node.y = -20;

        // Draw connections
        for (const j of node.connections) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 250) {
            const alpha = (1 - dist / 250) * 0.15;
            const isSuspicious = node.risk > 0.7 && other.risk > 0.7;

            // Animated flow particle
            const flowProgress = (time * 0.5 + i * 0.1) % 1;
            const fx = node.x + (other.x - node.x) * flowProgress;
            const fy = node.y + (other.y - node.y) * flowProgress;

            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = isSuspicious
              ? `rgba(255, 59, 59, ${alpha})`
              : `rgba(0, 245, 255, ${alpha})`;
            ctx.lineWidth = isSuspicious ? 1 : 0.5;
            ctx.stroke();

            // Flow particle
            if (alpha > 0.05) {
              ctx.beginPath();
              ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
              ctx.fillStyle = isSuspicious
                ? `rgba(255, 59, 59, ${alpha * 3})`
                : `rgba(0, 245, 255, ${alpha * 3})`;
              ctx.fill();
            }
          }
        }

        // Draw node
        const pulse = Math.sin(time * 2 + node.pulsePhase) * 0.3 + 0.7;
        const nodeAlpha = 0.3 + pulse * 0.4;

        // Glow
        if (node.risk > 0.6) {
          const gradient = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, node.radius * 8
          );
          const glowColor = node.risk > 0.8
            ? `rgba(255, 59, 59, ${nodeAlpha * 0.15})`
            : `rgba(0, 245, 255, ${nodeAlpha * 0.1})`;
          gradient.addColorStop(0, glowColor);
          gradient.addColorStop(1, "transparent");
          ctx.fillStyle = gradient;
          ctx.fillRect(
            node.x - node.radius * 8,
            node.y - node.radius * 8,
            node.radius * 16,
            node.radius * 16
          );
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle =
          node.risk > 0.8
            ? `rgba(255, 59, 59, ${nodeAlpha})`
            : node.risk > 0.5
            ? `rgba(0, 245, 255, ${nodeAlpha})`
            : `rgba(148, 163, 184, ${nodeAlpha * 0.5})`;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, [initNodes]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
