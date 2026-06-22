import { Button, Icon } from "@blueprintjs/core";
import { emit, listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  Background,
  Controls,
  Edge,
  Handle,
  MiniMap,
  Node,
  NodeProps,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { useEffect } from "react";
import { useStore } from "../lib/store";

// --- Custom Nodes ---

function SourceNode({
  data,
}: NodeProps<Node<{ label: string; format: string; columns: string[] }>>) {
  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-sm min-w-[200px] overflow-hidden font-sans">
      <div className="bg-blue-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="font-semibold text-gray-800 text-sm flex items-center gap-2">
          <Icon icon="database" size={14} className="text-blue-500" />
          {data.label}
        </div>
        <span className="text-xs text-gray-500 uppercase font-mono bg-blue-100 px-1.5 py-0.5 rounded">
          {data.format}
        </span>
      </div>
      <div className="py-1">
        {data.columns.map((col) => (
          <div
            key={col}
            className="relative px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 flex items-center justify-between"
          >
            <span className="font-mono">{col}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={col}
              style={{
                top: "50%",
                right: "-4px",
                width: "8px",
                height: "8px",
                background: "#3b82f6",
              }}
            />
          </div>
        ))}
        {data.columns.length === 0 && (
          <div className="px-3 py-2 text-xs text-gray-400 italic">
            No columns
          </div>
        )}
      </div>
    </div>
  );
}

function EntityNode({
  data,
}: NodeProps<
  Node<{
    subjectTemplate: string;
    classUris: string[];
    properties: {
      id: string;
      predicateUri: string;
      value: string;
      type: string;
    }[];
  }>
>) {
  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-sm min-w-[250px] overflow-hidden font-sans">
      <div className="bg-emerald-50 px-3 py-2 border-b border-gray-200">
        <div className="font-semibold text-gray-800 text-sm flex items-center gap-2 mb-1">
          <Icon icon="cube" size={14} className="text-emerald-600" />
          {data.subjectTemplate || "(Empty Subject)"}
        </div>
        {data.classUris.map((cls, idx) => (
          <div
            key={idx}
            className="text-xs text-emerald-700 italic truncate"
            title={cls}
          >
            a {cls}
          </div>
        ))}
      </div>
      <div className="py-1">
        {data.properties.map((prop, idx) => (
          <div
            key={idx}
            className="relative px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 flex flex-col border-b border-gray-100 last:border-0"
          >
            <Handle
              type="target"
              position={Position.Left}
              id={prop.id || `prop-${idx}`}
              style={{
                top: "50%",
                left: "-4px",
                width: "8px",
                height: "8px",
                background: "#10b981",
              }}
            />
            <span
              className="font-semibold truncate text-gray-800"
              title={prop.predicateUri}
            >
              {prop.predicateUri || "(No Predicate)"}
            </span>
            <span className="text-gray-500 truncate" title={prop.value}>
              {prop.type === "column" ? `$( ${prop.value} )` : prop.value}
            </span>
          </div>
        ))}
        {data.properties.length === 0 && (
          <div className="px-3 py-2 text-xs text-gray-400 italic">
            No properties mapped
          </div>
        )}
      </div>
    </div>
  );
}

const nodeTypes = {
  sourceNode: SourceNode,
  entityNode: EntityNode,
};

// --- Main Component ---

export function MappingGraph({ isPopout = false }: { isPopout?: boolean }) {
  const project = useStore((state) => state.project);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: "LR", ranksep: 200, nodesep: 50 });
    // Generate nodes and edges from project state
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // 1. Create Source Nodes
    project.sources.forEach((source) => {
      const columns = source.columns || [];
      const height = 40 + columns.length * 28 + 20;

      const node = {
        id: `source-${source.id}`,
        type: "sourceNode",
        position: { x: 0, y: 0 },
        data: {
          label: source.id,
          format: source.format,
          columns,
        },
      };
      newNodes.push(node);
      dagreGraph.setNode(node.id, { width: 200, height });
    });

    // 2. Create Entity Nodes & Edges
    project.entities.forEach((entity) => {
      const height =
        40 + entity.classUris.length * 20 + entity.properties.length * 36 + 20;
      const node = {
        id: `entity-${entity.id}`,
        type: "entityNode",
        position: { x: 0, y: 0 },
        data: {
          subjectTemplate: entity.subjectTemplate,
          classUris: entity.classUris,
          properties: entity.properties.map((p, i) => ({
            ...p,
            id: `prop-${i}`,
          })),
        },
      };
      newNodes.push(node);
      dagreGraph.setNode(node.id, { width: 250, height });

      // Create edges for properties mapped to columns
      entity.properties.forEach((prop, propIdx) => {
        if (prop.type === "column" && prop.value) {
          // Verify the source actually has this column
          const mappedSource = project.sources.find(
            (s) => s.id === entity.sourceId,
          );
          if (mappedSource && mappedSource.columns?.includes(prop.value)) {
            const propId = `prop-${propIdx}`;
            newEdges.push({
              id: `edge-${entity.id}-${propId}`,
              source: `source-${entity.sourceId}`,
              sourceHandle: prop.value,
              target: `entity-${entity.id}`,
              targetHandle: propId,
              animated: true,
              style: { stroke: "#94a3b8", strokeWidth: 2 },
            });
            dagreGraph.setEdge(
              `source-${entity.sourceId}`,
              `entity-${entity.id}`,
            );
          }
        }
      });
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = newNodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.position = {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      };
      return node;
    });

    setNodes(layoutedNodes);
    setEdges(newEdges);
  }, [project, setNodes, setEdges]);

  const handlePopout = async () => {
    // Open a new Tauri WebviewWindow pointing to ?window=graph
    const webview = new WebviewWindow("graph-popout", {
      url: "index.html?window=graph",
      title: "Triplette - Mapping Graph",
      width: 1000,
      height: 800,
    });

    webview.once("tauri://created", () => {
      console.log("Graph window created");
    });
  };

  // Sync state when project changes (if we are the main window)
  useEffect(() => {
    if (!isPopout) {
      // Broadcast state to any listening windows
      emit("sync-project-state", project);

      // Reply to any new windows requesting state
      const unlistenReq = listen("request-project-state", () => {
        emit("sync-project-state", project);
      });

      return () => {
        unlistenReq.then((f) => f());
      };
    } else {
      // We are the popout window: request initial state immediately
      emit("request-project-state");

      const unlisten = listen("sync-project-state", (event) => {
        useStore.setState({ project: event.payload as any });
      });

      return () => {
        unlisten.then((f) => f());
      };
    }
  }, [project, isPopout]);

  return (
    <div
      className={`w-full ${isPopout ? "h-screen" : "h-full"} flex-1 bg-slate-50 relative`}
    >
      {!isPopout && (
        <div className="absolute top-4 right-4 z-10">
          <Button icon="share" onClick={handlePopout}>
            Pop Out Graph
          </Button>
        </div>
      )}
      {nodes.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 italic">
          Add sources and mappings to see the graph.
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls />
          <MiniMap
            zoomable
            pannable
            nodeColor="#e2e8f0"
            maskColor="rgba(248, 250, 252, 0.7)"
          />
          <Background color="#cbd5e1" gap={16} />
        </ReactFlow>
      )}
    </div>
  );
}
