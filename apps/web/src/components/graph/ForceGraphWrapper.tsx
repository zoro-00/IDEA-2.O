"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { GraphNode, GraphEdge } from "@/types";

// ForceGraph2D requires browser environment
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-[#475569] font-mono text-xs">INITIALIZING GRAPH ENGINE...</div>
});

interface ForceGraphWrapperProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  highlightNodes?: Set<string>;
  highlightLinks?: Set<string>;
}

export function ForceGraphWrapper({ 
  nodes, 
  edges, 
  width, 
  height, 
  onNodeClick,
  highlightNodes = new Set(),
  highlightLinks = new Set()
}: ForceGraphWrapperProps) {

  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    // Transform edges to expected format (source/target can be objects in force-graph, but start as strings)
    const links = edges.map(e => ({ ...e }));
    setGraphData({ nodes: nodes as any, links: links as any });
  }, [nodes, edges]);

  return (
    <div className="w-full h-full overflow-hidden cursor-crosshair">
      <ForceGraph2D
        width={width}
        height={height}
        graphData={graphData}
        nodeLabel="name"
        nodeColor={(node: any) => highlightNodes.has(node.id) ? "#F43F5E" : (node.risk > 70 ? "#F97316" : "#3B82F6")}
        nodeRelSize={6}
        linkColor={(link: any) => {
          const id = `${link.source.id || link.source}-${link.target.id || link.target}`;
          return highlightLinks.has(id) ? "rgba(244, 63, 94, 0.8)" : "rgba(59, 130, 246, 0.2)";
        }}
        linkWidth={(link: any) => {
          const id = `${link.source.id || link.source}-${link.target.id || link.target}`;
          return highlightLinks.has(id) ? 2 : 1;
        }}
        linkDirectionalParticles={(link: any) => {
          const id = `${link.source.id || link.source}-${link.target.id || link.target}`;
          return highlightLinks.has(id) ? 4 : 0;
        }}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.01}
        onNodeClick={onNodeClick as any}
        backgroundColor="transparent"
      />
    </div>
  );
}
