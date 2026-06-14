'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  Handle, 
  Position,
  NodeProps,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { 
  Mail, 
  FolderKanban, 
  FileText, 
  CalendarDays, 
  TrendingUp, 
  AlertOctagon, 
  Zap, 
  CheckSquare, 
  Activity, 
  Sparkles,
  MousePointerClick
} from 'lucide-react';
import Slack from '@/components/icons/Slack';
import { memoryService } from '@/services/memoryService';
import MemoryDetailPanel from '@/components/MemoryDetailPanel';
import { SourceSystem } from '@/types';

// Custom Node Component to display premium styled elements
function MemoryNode({ data }: any) {
  const getSourceIcon = (source: SourceSystem) => {
    switch (source) {
      case 'Gmail': return <Mail className="w-3 h-3 text-rose-400" />;
      case 'Slack': return <Slack className="w-3 h-3 text-indigo-400" />;
      case 'Linear': return <FolderKanban className="w-3 h-3 text-purple-400" />;
      case 'Notion': return <FileText className="w-3 h-3 text-amber-400" />;
      case 'Calendar': return <CalendarDays className="w-3 h-3 text-teal-400" />;
      case 'Stripe': return <TrendingUp className="w-3 h-3 text-emerald-400" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const getTypeBranding = (type: string) => {
    switch (type) {
      case 'Decision':
        return {
          border: 'border-indigo-500/50 hover:border-indigo-400',
          bg: 'bg-indigo-500/10',
          text: 'text-indigo-400',
          icon: <Zap className="w-3.5 h-3.5 text-indigo-400" />
        };
      case 'Commitment':
        return {
          border: 'border-emerald-500/50 hover:border-emerald-400',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
        };
      case 'Blocker':
        return {
          border: 'border-rose-500/50 hover:border-rose-400',
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
        };
      case 'Metric':
        return {
          border: 'border-amber-500/50 hover:border-amber-400',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          icon: <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
        };
      default:
        return {
          border: 'border-zinc-500/50 hover:border-zinc-400',
          bg: 'bg-zinc-500/10',
          text: 'text-zinc-400',
          icon: <FileText className="w-3.5 h-3.5" />
        };
    }
  };

  const brand = getTypeBranding(data.type);

  return (
    <div className={`w-72 p-3.5 bg-card border rounded-xl shadow-lg transition-all duration-150 relative text-left ${brand.border}`}>
      {/* Target input port (Left) */}
      {data.type !== 'Blocker' && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: '#3f3f46', width: '8px', height: '8px' }}
        />
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-1">
          {brand.icon}
          <span className={`font-bold ${brand.text}`}>{data.type}</span>
        </span>
        <span className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono bg-border/40 px-1.5 py-0.5 rounded">
          {getSourceIcon(data.source)}
          {data.source}
        </span>
      </div>

      {/* Content Summary */}
      <h4 className="text-xs font-bold text-white leading-normal line-clamp-2 mb-1.5">
        {data.title}
      </h4>

      {/* Status Indicators */}
      <div className="flex items-center justify-between text-[8px] text-muted-foreground font-mono mt-2 pt-2 border-t border-border/30">
        <span>ID: {data.id}</span>
        <span className={`px-1.5 py-0.5 rounded font-bold ${
          data.status === 'Fulfilled' || data.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
          data.status === 'Overdue' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' :
          'bg-amber-500/10 text-amber-400 border border-amber-500/25'
        }`}>
          {data.status}
        </span>
      </div>

      {/* Source output port (Right) */}
      {data.type !== 'Commitment' && data.type !== 'Metric' && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: '#3f3f46', width: '8px', height: '8px' }}
        />
      )}
    </div>
  );
}

const nodeTypes = {
  memoryNode: MemoryNode
};

export default function MemoryGraph() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadGraphData() {
      setLoading(true);
      try {
        const data = await memoryService.getMemoryGraph();
        setNodes(data.nodes);
        setEdges(data.edges);
      } catch (err) {
        console.error('Failed to load React Flow graph elements', err);
      } finally {
        setLoading(false);
      }
    }
    loadGraphData();
  }, []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedMemoryId(node.id);
    setIsPanelOpen(true);
  }, []);

  const openMemoryDetails = (id: string) => {
    setSelectedMemoryId(id);
    setIsPanelOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-screen select-none text-foreground overflow-hidden">
      {/* Sticky top info panel */}
      <div className="p-6 border-b border-border bg-card shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Knowledge Graph Visualization
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">Memory Graph Explorer</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Visualizing interconnected dependencies in the founder intelligence layer.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2.5 items-center bg-border/25 border border-border/40 p-3 rounded-lg text-[10px] font-mono font-bold">
          <span className="text-muted-foreground mr-1 uppercase">Legend:</span>
          <span className="flex items-center gap-1 bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded border border-rose-500/25">Blocker</span>
          <span className="text-muted-foreground">➔</span>
          <span className="flex items-center gap-1 bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/25">Decision</span>
          <span className="text-muted-foreground">➔</span>
          <span className="flex items-center gap-1 bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded border border-amber-500/25">Metric</span>
          <span className="text-muted-foreground">and</span>
          <span className="flex items-center gap-1 bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/25">Commitment</span>
        </div>
      </div>

      {/* React Flow canvas */}
      <div className="flex-1 min-h-0 relative bg-zinc-950/40">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950 z-10">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span className="text-xs font-mono text-muted-foreground">Loading interactive nodes...</span>
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <Activity className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm font-bold text-white">No memory yet</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Tell the agent a decision, commitment, blocker, or metric in{' '}
              <span className="text-indigo-400">Ask FounderOps</span> and it&apos;ll appear here as a node.
            </p>
          </div>
        ) : (
          <>
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#0c0c0e]/90 border border-border px-3.5 py-2 rounded-lg text-[10px] text-muted-foreground font-semibold">
              <MousePointerClick className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Left-click nodes to slide open verified provenance context detail.</span>
            </div>
            
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              fitView
              minZoom={0.2}
              maxZoom={1.5}
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: true
              }}
            >
              <Background color="#27272a" gap={24} size={1} />
              <Controls className="!bg-card !border-border !text-white !fill-current" />
            </ReactFlow>
          </>
        )}
      </div>

      {/* slide-out panel for memory details */}
      <MemoryDetailPanel 
        memoryId={selectedMemoryId}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onNavigateToMemory={(id) => openMemoryDetails(id)}
      />
    </div>
  );
}
