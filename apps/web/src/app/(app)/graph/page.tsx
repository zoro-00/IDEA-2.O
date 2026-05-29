"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ForceGraphWrapper } from "@/components/graph/ForceGraphWrapper";
import { GlassCard } from "@/components/ui/GlassCard";
import { starApi } from "@/lib/api";
import { Search, Filter, ZoomIn, ZoomOut, Maximize, Share2, Loader2 } from "lucide-react";
import type { GraphNode, GraphEdge } from "@/types";

export default function GraphPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    starApi.getFullGraph()
      .then(data => {
        const mappedNodes: GraphNode[] = data.nodes.map(n => ({
          ...n,
          anomalyScore: n.anomaly_score,
          riskLevel: n.risk_level,
          community: String(n.community)
        })) as unknown as GraphNode[];
        setNodes(mappedNodes);
        setEdges(data.links as unknown as GraphEdge[]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    
    // Highlight 1-hop neighborhood
    const newHighlightNodes = new Set<string>();
    const newHighlightLinks = new Set<string>();
    
    newHighlightNodes.add(node.id);
    
    edges.forEach(edge => {
      const sourceId = typeof edge.source === 'object' ? (edge.source as any).id : edge.source;
      const targetId = typeof edge.target === 'object' ? (edge.target as any).id : edge.target;
      
      if (sourceId === node.id || targetId === node.id) {
        newHighlightNodes.add(sourceId);
        newHighlightNodes.add(targetId);
        newHighlightLinks.add(`${sourceId}-${targetId}`);
      }
    });

    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  };

  const clearSelection = () => {
    setSelectedNode(null);
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-[#020617] overflow-hidden flex">
      
      {/* Main Graph Area */}
      <div className="flex-1 relative cursor-crosshair" onClick={() => selectedNode && clearSelection()}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-[#94A3B8]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <ForceGraphWrapper 
            nodes={nodes} 
            edges={edges} 
            onNodeClick={handleNodeClick}
            highlightNodes={highlightNodes}
            highlightLinks={highlightLinks}
          />
        )}
        
        {/* Floating Controls */}
        <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
          <div className="flex items-center bg-[#0F172A]/80 backdrop-blur border border-white/10 rounded-lg p-1 shadow-2xl">
            <input 
              type="text" 
              placeholder="Search Graph ID..." 
              className="bg-transparent border-none text-xs text-white px-3 py-1.5 focus:outline-none w-48 font-mono placeholder-[#475569]"
            />
            <button className="p-1.5 text-[#94A3B8] hover:text-white transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
          <GlassCard intensity="heavy" className="p-2 flex flex-col gap-1 border-white/10">
            <button className="p-2 text-[#94A3B8] hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"><ZoomIn className="w-4 h-4" /></button>
            <button className="p-2 text-[#94A3B8] hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"><ZoomOut className="w-4 h-4" /></button>
            <button className="p-2 text-[#94A3B8] hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"><Maximize className="w-4 h-4" /></button>
          </GlassCard>
        </div>
      </div>

      {/* Slide-over Node Inspector */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: selectedNode ? 0 : "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="absolute top-0 right-0 w-[400px] h-full bg-[#030712]/95 backdrop-blur-xl border-l border-white/10 z-20 flex flex-col shadow-2xl"
      >
        {selectedNode && (
          <>
            <div className="p-6 border-b border-white/5 flex items-start justify-between">
              <div>
                <div className="text-[10px] text-[#00F5FF] font-mono tracking-widest mb-1">NODE DETECTED</div>
                <h2 className="text-xl font-bold text-white mb-1">{selectedNode.name}</h2>
                <div className="font-mono text-xs text-[#94A3B8]">{selectedNode.id}</div>
              </div>
              <button onClick={clearSelection} className="text-[#475569] hover:text-white text-2xl leading-none">&times;</button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0F172A] p-4 rounded-lg border border-white/5">
                  <div className="text-[10px] text-[#94A3B8] font-mono mb-1">RISK SCORE</div>
                  <div className={`text-2xl font-mono font-bold ${selectedNode.risk > 70 ? 'text-[#F43F5E]' : 'text-[#10B981]'}`}>
                    {selectedNode.risk}
                  </div>
                </div>
                <div className="bg-[#0F172A] p-4 rounded-lg border border-white/5">
                  <div className="text-[10px] text-[#94A3B8] font-mono mb-1">ANOMALY %</div>
                  <div className="text-2xl font-mono font-bold text-white">
                    {(selectedNode.anomalyScore * 100).toFixed(1)}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-3">Attributes</h3>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[#475569]">Type</span>
                    <span className="text-[#E2E8F0]">{selectedNode.type}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[#475569]">Community</span>
                    <span className="text-[#00F5FF]">C-{selectedNode.community}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[#475569]">Flagged</span>
                    <span className={selectedNode.flagged ? "text-[#F43F5E]" : "text-[#10B981]"}>
                      {selectedNode.flagged ? "YES" : "NO"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6]/20 border border-[#3B82F6]/30 rounded-lg transition-colors font-bold text-sm">
                  <Search className="w-4 h-4" />
                  Deep Dive Investigation
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>

    </div>
  );
}
