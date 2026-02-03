/**
 * Research Canvas Component
 * 研究画布组件
 *
 * Main canvas component for the research system
 * 虚拟课题组系统的主要画布组件
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useCanvasStore } from '../../stores/canvasStore';
import { ProblemNode, ExperimentNode, LiteratureNode, DataNode, ConclusionNode, DiscussionNode, MediaNode } from '../nodes';
import { CustomEdge } from '../edges/CustomEdge';
import { NodeDetailsPanel } from '../panels/NodeDetailsPanel';
import { cn } from '@/utils/classNames';
import { getExampleProjectById } from '@/data/researchExampleProjects';
import { PersistentHeader } from '@/components/shared';
import { ArrowLeft } from 'lucide-react';

// Node types configuration
const nodeTypes = {
  problem: ProblemNode,
  experiment: ExperimentNode,
  literature: LiteratureNode,
  data: DataNode,
  conclusion: ConclusionNode,
  discussion: DiscussionNode,
  media: MediaNode,
};

// Edge types configuration
const edgeTypes = {
  custom: CustomEdge,
};

interface ResearchCanvasProps {
  projectId: string;
  canvasId: string;
  theme?: 'dark' | 'light';
}

function ResearchCanvasInner({ projectId, canvasId, theme = 'dark' }: ResearchCanvasProps) {
  const location = useLocation();
  const reactFlowInstance = useReactFlow();
  // Use selectors to avoid unnecessary re-renders when nodes/edges change
  const addNode = useCanvasStore((state) => state.addNode);
  const updateNodeStore = useCanvasStore((state) => state.updateNode);
  const removeNodeStore = useCanvasStore((state) => state.removeNode);
  const setNodes = useCanvasStore((state) => state.setNodes);
  const setEdges = useCanvasStore((state) => state.setEdges);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const clearSelection = useCanvasStore((state) => state.clearSelection);

  // Wrapper to update both React Flow state and Zustand store
  const updateNode = useCallback((nodeId: string, updates: Partial<Node>) => {
    updateNodeStore(nodeId, updates);
    setFlowNodes((nds) => nds.map((node) =>
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, [updateNodeStore]);

  const removeNode = useCallback((nodeId: string) => {
    removeNodeStore(nodeId);
    setFlowNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setFlowEdges((eds) => eds.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    ));
  }, [removeNodeStore]);

  const removeEdge = useCallback((edgeId: string) => {
    setFlowEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
  }, []);

  // React Flow state
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState([]);

  // Augment edges with onDelete callback
  const edgesWithCallbacks = useMemo(() => {
    return flowEdges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        onDelete: removeEdge,
      },
    }));
  }, [flowEdges, removeEdge]);

  // Import/Export state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as globalThis.Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  // Get project title for display
  const getProjectTitle = () => {
    const exampleProjectId = location.state?.exampleProjectId;
    if (exampleProjectId) {
      const project = getExampleProjectById(exampleProjectId);
      if (project) return project.title['zh-CN'];
    }
    return canvasId === 'main' ? '主画布' : canvasId;
  };

  // Load example project data if provided
  useEffect(() => {
    const exampleProjectId = location.state?.exampleProjectId;
    if (exampleProjectId) {
      const exampleProject = getExampleProjectById(exampleProjectId);
      if (exampleProject) {
        // Load the example project's nodes and edges
        setNodes(exampleProject.nodes);
        setEdges(exampleProject.edges);
        // Also set the flow state directly
        setFlowNodes(exampleProject.nodes);
        setFlowEdges(exampleProject.edges);
      }
    }
  }, [location.state?.exampleProjectId]);

  // Note: We don't automatically sync from React Flow to Zustand to avoid infinite loops
  // The store can be updated explicitly when needed (e.g., on save)

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'custom',
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        data: { edgeType: 'relatedTo' },
      };
      setFlowEdges((eds) => addEdge(newEdge, eds));
    },
    [setFlowEdges]
  );

  // Handle node click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // Handle pane click to clear selection
  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Node colors for mini-map
  const nodeColorMap = useMemo(() => ({
    problem: '#f59e0b',
    experiment: '#3b82f6',
    literature: '#22c55e',
    data: '#ef4444',
    conclusion: '#a855f7',
    discussion: '#06b6d4',
    media: '#ec4899',
  }), []);

  const nodeColorClassName = useCallback((node: Node) => {
    return nodeColorMap[node.type as keyof typeof nodeColorMap] || '#64748b';
  }, [nodeColorMap]);

  // Create a new node with proper type-specific data
  const createNode = useCallback((type: string) => {
    const now = Date.now();
    const nodeId = `${type}-${now}`;

    // Get current viewport center
    const { getViewport } = reactFlowInstance;
    const viewport = getViewport();

    // Get container dimensions for accurate center calculation
    const containerRect = reactFlowWrapper.current?.getBoundingClientRect();
    const containerWidth = containerRect?.width || window.innerWidth;
    const containerHeight = containerRect?.height || window.innerHeight;

    const centerX = (-viewport.x + containerWidth / 2) / viewport.zoom;
    const centerY = (-viewport.y + containerHeight / 2) / viewport.zoom;

    // Add small random offset to avoid stacking
    const pos = {
      x: centerX + (Math.random() - 0.5) * 50,
      y: centerY + (Math.random() - 0.5) * 50,
    };

    // Base fields for all nodes
    const baseFields = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user',
    };

    // Create type-specific data
    let nodeData: any = {
      title: { 'zh-CN': getNodeDefaultTitle(type), zh: getNodeDefaultTitle(type) },
      ...baseFields,
    };

    // Add type-specific required fields
    switch (type) {
      case 'problem':
        nodeData = {
          ...nodeData,
          description: { 'zh-CN': '', zh: '' },
          status: 'open',
          priority: 'medium',
        };
        break;
      case 'experiment':
        nodeData = {
          ...nodeData,
          description: { 'zh-CN': '', zh: '' },
          status: 'pending',
        };
        break;
      case 'literature':
        nodeData = {
          ...nodeData,
          summary: { 'zh-CN': '', zh: '' },
          authors: ['作者'],
          citation: '',
        };
        break;
      case 'data':
        nodeData = {
          ...nodeData,
          dataType: 'observation',
          values: {},
        };
        break;
      case 'conclusion':
        nodeData = {
          ...nodeData,
          description: { 'zh-CN': '', zh: '' },
          statement: { 'zh-CN': '', zh: '' },
          confidence: 0.5,
          evidenceIds: [],
        };
        break;
      case 'discussion':
        nodeData = {
          ...nodeData,
          topic: { 'zh-CN': '', zh: '' },
          status: 'active',
          participants: [],
        };
        break;
      case 'media':
        nodeData = {
          ...nodeData,
          url: '',
          mediaType: 'image',
          description: { 'zh-CN': '', zh: '' },
        };
        break;
    }

    const newNode = {
      id: nodeId,
      type: type as any,
      position: pos,
      data: nodeData,
    };
    // Update both the store and React Flow state
    addNode(newNode);
    setFlowNodes((nds) => [...nds, newNode]);
  }, [addNode, setFlowNodes, reactFlowInstance]);

  function getNodeDefaultTitle(type: string): string {
    const titles: Record<string, string> = {
      problem: '新问题',
      experiment: '新实验',
      literature: '新文献',
      data: '新数据',
      conclusion: '新结论',
      discussion: '新讨论',
      media: '新媒体',
    };
    return titles[type] || '新节点';
  }

  // Handle export to JSON
  const handleExport = (format: 'json' | 'markdown' | 'csv') => {
    const data = {
      projectId,
      canvasId,
      nodes: flowNodes,
      edges: flowEdges,
      exportedAt: new Date().toISOString(),
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectId}-${canvasId}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'markdown') {
      // Export as markdown
      let markdown = `# ${getProjectTitle()}\n\n`;
      markdown += `项目ID: ${projectId}\n画布ID: ${canvasId}\n导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

      // Export nodes
      markdown += `## 节点 (${flowNodes.length}个)\n\n`;
      flowNodes.forEach((node) => {
        markdown += `### ${node.data.title?.zh || node.data.title?.['zh-CN'] || '未命名'}\n`;
        markdown += `- **类型**: ${node.type}\n`;
        if ('description' in node.data && node.data.description) {
          markdown += `- **描述**: ${node.data.description?.zh || node.data.description?.['zh-CN'] || ''}\n`;
        }
        markdown += `- **位置**: (${Math.round(node.position.x)}, ${Math.round(node.position.y)})\n\n`;
      });

      // Export edges
      markdown += `## 关系 (${flowEdges.length}条)\n\n`;
      flowEdges.forEach((edge) => {
        markdown += `- ${edge.source} → ${edge.target}\n`;
      });

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectId}-${canvasId}-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Export nodes as CSV
      let csv = 'ID,Type,Title,Status,X,Y\n';
      flowNodes.forEach((node) => {
        const title = (node.data.title?.zh || node.data.title?.['zh-CN'] || '').replace(/,/g, '，');
        const status = 'status' in node.data ? (node.data as any).status : '';
        csv += `"${node.id}","${node.type}","${title}","${status}","${Math.round(node.position.x)}","${Math.round(node.position.y)}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectId}-${canvasId}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setShowExportMenu(false);
  };

  // Handle import from JSON
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.nodes && Array.isArray(data.nodes)) {
            setFlowNodes(data.nodes);
            setFlowEdges(data.edges || []);
            setNodes(data.nodes);
            setEdges(data.edges || []);
          }
        } catch (error) {
          console.error('Failed to parse JSON:', error);
          alert('导入失败：无效的 JSON 文件');
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Persistent Header */}
      <PersistentHeader
        moduleKey="labGroup"
        moduleName={getProjectTitle()}
        variant="glass"
        className={cn(
          "flex-shrink-0",
          theme === "dark" ? "bg-slate-900/80" : "bg-white/80"
        )}
        centerContent={
          <div className="text-xs text-gray-500">
            项目: {projectId} | {flowNodes.length} 节点 · {flowEdges.length} 关系
          </div>
        }
        rightContent={
          <div className="flex items-center gap-2">
            {/* Import button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-slate-600 text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="导入 JSON 文件"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0-16H8a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2h-2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16m-8 0l-4 4m4-4l4 4" />
              </svg>
              导入
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />

            {/* Export button */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-slate-600 text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="导出"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0-16H8a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2h-2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H4" />
                </svg>
                导出
                <svg className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Export dropdown menu */}
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[120px] z-50">
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    导出为 JSON
                  </button>
                  <button
                    onClick={() => handleExport('markdown')}
                    className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    导出为 Markdown
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    导出为 CSV
                  </button>
                </div>
              )}
            </div>

            {/* Back button */}
            <Link
              to="/lab/projects"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-800 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Link>
          </div>
        }
      />

      {/* Canvas Area */}
      <div className="flex-1 flex min-h-0">
        {/* Main Canvas Area */}
        <div ref={reactFlowWrapper} className="flex-1 relative bg-slate-900">
        <ReactFlow
          nodes={flowNodes}
          edges={edgesWithCallbacks}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.1}
          maxZoom={8}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          className={cn(
            "bg-slate-900",
            theme === 'dark' ? "dark" : "light"
          )}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="rgba(100, 150, 255, 0.1)"
          />
          <Controls />
          <MiniMap
            nodeColor={nodeColorClassName}
            maskColor="rgba(0, 0, 0, 0.6)"
            className="bg-slate-800"
            pannable
            zoomable
          />
        </ReactFlow>

        {/* Canvas Info */}
        <div className="absolute top-4 left-4 px-3 py-2 bg-slate-800/80 rounded-lg border border-slate-700">
          <div className="text-xs text-gray-400">
            项目: {projectId} | 画布: {canvasId}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            节点: {flowNodes.length} | 关系: {flowEdges.length}
          </div>
        </div>

        {/* Add Node Toolbar */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg border border-amber-500 transition-colors"
            onClick={() => createNode('problem')}
          >
            + 问题
          </button>
          <button
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg border border-blue-500 transition-colors"
            onClick={() => createNode('experiment')}
          >
            + 实验
          </button>
          <button
            className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg border border-green-500 transition-colors"
            onClick={() => createNode('literature')}
          >
            + 文献
          </button>
          <button
            className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg border border-red-500 transition-colors"
            onClick={() => createNode('data')}
          >
            + 数据
          </button>
          <button
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg border border-purple-500 transition-colors"
            onClick={() => createNode('conclusion')}
          >
            + 结论
          </button>
          <button
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg border border-cyan-500 transition-colors"
            onClick={() => createNode('discussion')}
          >
            + 讨论
          </button>
          <button
            className="px-3 py-2 bg-pink-600 hover:bg-pink-500 text-white text-sm rounded-lg border border-pink-500 transition-colors"
            onClick={() => createNode('media')}
          >
            + 媒体
          </button>
        </div>

        {/* Instructions */}
        {flowNodes.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-600 p-8 max-w-md">
              <h3 className="text-white text-lg font-semibold mb-4">开始您的探索</h3>
              <p className="text-gray-400 text-sm mb-4">
                点击右上角的按钮创建节点，通过拖拽节点右侧的点创建节点之间的连接
              </p>
            </div>
          </div>
        )}
        </div>

        {/* Side Panel for Node Details */}
        <div className="w-80 border-l border-slate-700 bg-slate-800/50 flex flex-col">
          <NodeDetailsPanel theme={theme} onUpdateNode={updateNode} onRemoveNode={removeNode} />
        </div>
      </div>
    </div>
  );
}

/**
 * Research Canvas with React Flow Provider
 * 带 React Flow Provider 的研究画布
 */
export function ResearchCanvas(props: ResearchCanvasProps) {
  return (
    <ReactFlowProvider>
      <ResearchCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
