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
  NodeChange,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useCanvasStore } from '../../stores/canvasStore';
import { ProblemNode, ExperimentNode, ConclusionNode, DiscussionNode, MediaNode, NoteNode } from '../nodes';
import { CustomEdge } from '../edges/CustomEdge';
import { NodeDetailsPanel } from '../panels/NodeDetailsPanel';
import { cn } from '@/utils/classNames';
import { getExampleProjectById } from '@/data/researchExampleProjects';
import { PersistentHeader } from '@/components/shared';
import { ArrowLeft, Save, Loader2, Check, AlertCircle } from 'lucide-react';
import { researchApi } from '@/lib/research.service';
import { nodeToApiFormat, edgeToApiFormat, apiToNodeFormat, apiToEdgeFormat, isTemporaryId } from '../../utils/canvasDataConverter';
import type {
  ProblemNodeData,
  ExperimentNodeData,
  ConclusionNodeData,
  DiscussionNodeData,
  MediaNodeData,
  NoteNodeData,
  BaseNodeData,
} from '../../types/node-data.types';

// Node types configuration
const nodeTypes = {
  problem: ProblemNode,
  experiment: ExperimentNode,
  conclusion: ConclusionNode,
  discussion: DiscussionNode,
  media: MediaNode,
  note: NoteNode,
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

  // Save state / 保存状态
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0); // Track last save time for rate limiting

  // Minimum interval between saves (15 seconds) to avoid rate limiting
  const MIN_SAVE_INTERVAL = 15000;
  // Debounce time for auto-save (5 seconds)
  const AUTO_SAVE_DEBOUNCE = 5000;

  // Track if this is an example project (no saving)
  const isExampleProject = !!location.state?.exampleProjectId;

  // Track if this is read-only mode (visitor viewing a public project)
  const isReadOnly = location.state?.readOnly === true;

  // Wrapper for onNodesChange to filter changes in read-only mode
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (isReadOnly) {
        // Only allow selection changes in read-only mode
        const allowedChanges = changes.filter(
          (change) => change.type === 'select' || change.type === 'reset' || change.type === 'setDimensions'
        );
        if (allowedChanges.length > 0) {
          onNodesChange(allowedChanges);
        }
        return;
      }
      onNodesChange(changes);
    },
    [isReadOnly, onNodesChange]
  );

  // Wrapper for onEdgesChange to filter changes in read-only mode
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (isReadOnly) {
        // Only allow selection changes in read-only mode
        const allowedChanges = changes.filter((change) => change.type === 'select' || change.type === 'reset');
        if (allowedChanges.length > 0) {
          onEdgesChange(allowedChanges);
        }
        return;
      }
      onEdgesChange(changes);
    },
    [isReadOnly, onEdgesChange]
  );

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

  // Load canvas data from server for real projects
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(false);
  const [canvasError, setCanvasError] = useState<string | null>(null);

  // Track original server IDs for deletion detection
  const originalNodeIdsRef = useRef<Set<string>>(new Set());
  const originalEdgeIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isExampleProject || !canvasId || !projectId) return;

    async function loadCanvasData() {
      setIsLoadingCanvas(true);
      setCanvasError(null);

      try {
        // Try to get the canvas
        const canvas = await researchApi.getCanvas(canvasId);

        // Store the actual canvas ID for saving
        setCurrentCanvasId(canvas.id);

        // Load nodes and edges
        if (canvas.nodes && canvas.nodes.length > 0) {
          const flowNodes = canvas.nodes.map(apiToNodeFormat);
          setFlowNodes(flowNodes);
          setNodes(flowNodes);
          // Store original node IDs for deletion detection
          originalNodeIdsRef.current = new Set(canvas.nodes.map((n: any) => n.id));
        }

        if (canvas.edges && canvas.edges.length > 0) {
          const flowEdges = canvas.edges.map(apiToEdgeFormat);
          setFlowEdges(flowEdges);
          setEdges(flowEdges);
          // Store original edge IDs for deletion detection
          originalEdgeIdsRef.current = new Set(canvas.edges.map((e: any) => e.id));
        }

        // Set initial save state
        setLastSavedAt(new Date());
      } catch (err) {
        console.error('Failed to load canvas:', err);
        // Canvas doesn't exist - we'll create it on first save
        setCanvasError('画布数据加载失败，将在保存时自动创建');
      } finally {
        setIsLoadingCanvas(false);
      }
    }

    loadCanvasData();
  }, [canvasId, projectId, isExampleProject]);

  // Note: We don't automatically sync from React Flow to Zustand to avoid infinite loops
  // The store can be updated explicitly when needed (e.g., on save)

  // =====================================================
  // Save functionality / 保存功能
  // =====================================================

  // Current canvas ID (may be updated if we create a new canvas)
  const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null);

  // Save all nodes and edges to the server
  const handleSave = useCallback(async (force: boolean = false) => {
    if (isExampleProject || isSaving || isReadOnly) return;

    // Rate limiting: check if minimum interval has passed
    const now = Date.now();
    if (!force && now - lastSaveTimeRef.current < MIN_SAVE_INTERVAL) {
      console.log('Save skipped due to rate limiting');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Determine which canvas ID to use
      let targetCanvasId = currentCanvasId || canvasId;

      // Check if canvas exists, if not create it
      if (!targetCanvasId || targetCanvasId === 'main') {
        // Need to create a new canvas for this project
        const newCanvas = await researchApi.createCanvas(projectId, {
          name_zh: '主画布',
          name_en: 'Main Canvas',
        });
        targetCanvasId = newCanvas.id;
        setCurrentCanvasId(targetCanvasId);
        console.log('Created new canvas:', targetCanvasId);
      } else {
        // Verify canvas exists
        try {
          await researchApi.getCanvas(targetCanvasId);
        } catch {
          // Canvas doesn't exist, create it
          const newCanvas = await researchApi.createCanvas(projectId, {
            name_zh: '主画布',
            name_en: 'Main Canvas',
          });
          targetCanvasId = newCanvas.id;
          setCurrentCanvasId(targetCanvasId);
          console.log('Created new canvas:', targetCanvasId);
        }
      }

      // Get current node/edge IDs (non-temporary)
      const currentNodeIds = new Set(flowNodes.filter(n => !isTemporaryId(n.id)).map(n => n.id));
      const currentEdgeIds = new Set(flowEdges.filter(e => !isTemporaryId(e.id)).map(e => e.id));

      // Delete edges that were removed
      const edgesToDelete = [...originalEdgeIdsRef.current].filter(id => !currentEdgeIds.has(id));
      for (const edgeId of edgesToDelete) {
        try {
          await researchApi.deleteEdge(edgeId);
          console.log('Deleted edge:', edgeId);
        } catch (err) {
          console.warn('Failed to delete edge:', edgeId, err);
        }
      }

      // Delete nodes that were removed
      const nodesToDelete = [...originalNodeIdsRef.current].filter(id => !currentNodeIds.has(id));
      for (const nodeId of nodesToDelete) {
        try {
          await researchApi.deleteNode(nodeId);
          console.log('Deleted node:', nodeId);
        } catch (err) {
          console.warn('Failed to delete node:', nodeId, err);
        }
      }

      // Map old temporary IDs to new server IDs
      const nodeIdMap = new Map<string, string>();

      // Create a copy of flowNodes to update IDs
      const updatedNodes = [...flowNodes];

      // Save all nodes with a small delay between requests to avoid rate limiting
      for (let i = 0; i < updatedNodes.length; i++) {
        const node = updatedNodes[i];
        const oldId = node.id;
        const nodeData = nodeToApiFormat(node);
        if (isTemporaryId(node.id)) {
          // Create new node
          const created = await researchApi.createNode(targetCanvasId, nodeData);
          // Update the node ID with the server-generated ID
          if (created?.id) {
            nodeIdMap.set(oldId, created.id);
            updatedNodes[i] = { ...node, id: created.id };
          } else {
            console.warn('Create node response missing id, keeping temporary ID');
          }
        } else {
          // Update existing node
          await researchApi.updateNode(node.id, nodeData);
        }
        // Small delay between requests (100ms) to avoid rate limiting
        if (i < updatedNodes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Update React Flow state with new node IDs
      setFlowNodes(updatedNodes);
      setNodes(updatedNodes);

      // Create a copy of flowEdges to update IDs and references
      const updatedEdges = [...flowEdges];

      // Save all edges with a small delay between requests
      for (let i = 0; i < updatedEdges.length; i++) {
        const edge = updatedEdges[i];

        // Translate temporary node IDs to real IDs for edges
        const sourceId = nodeIdMap.get(edge.source) || edge.source;
        const targetId = nodeIdMap.get(edge.target) || edge.target;

        const edgeData = {
          ...edgeToApiFormat(edge),
          source_node_id: sourceId,
          target_node_id: targetId,
        };

        if (isTemporaryId(edge.id)) {
          // Create new edge
          const created = await researchApi.createEdge(targetCanvasId, edgeData);
          // Update the edge ID with the server-generated ID
          if (created?.id) {
            updatedEdges[i] = { ...edge, id: created.id, source: sourceId, target: targetId };
          } else {
            console.warn('Create edge response missing id, keeping temporary ID');
            // Still update source and target references
            updatedEdges[i] = { ...edge, source: sourceId, target: targetId };
          }
        } else {
          // Update existing edge
          await researchApi.updateEdge(edge.id, edgeData);
          // Update source and target references in case they changed
          updatedEdges[i] = { ...edge, source: sourceId, target: targetId };
        }
        // Small delay between requests (100ms)
        if (i < updatedEdges.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Update React Flow state with new edge IDs and references
      setFlowEdges(updatedEdges);
      setEdges(updatedEdges);

      // Save canvas viewport
      const viewport = reactFlowInstance.getViewport();
      await researchApi.updateCanvas(targetCanvasId, {
        viewport_data: { x: viewport.x, y: viewport.y, zoom: viewport.zoom }
      });

      // Update original IDs for future deletion detection
      originalNodeIdsRef.current = new Set(updatedNodes.map(n => n.id));
      originalEdgeIdsRef.current = new Set(updatedEdges.map(e => e.id));

      lastSaveTimeRef.current = Date.now();
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      setCanvasError(null);
    } catch (err) {
      console.error('Failed to save canvas:', err);
      setSaveError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  }, [canvasId, currentCanvasId, projectId, flowNodes, flowEdges, isExampleProject, isSaving, reactFlowInstance]);

  // Auto-save with debounce
  const scheduleAutoSave = useCallback(() => {
    if (isExampleProject || isReadOnly) return;

    setHasUnsavedChanges(true);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule new save with debounce
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, AUTO_SAVE_DEBOUNCE);
  }, [handleSave, isExampleProject]);

  // Track node changes for auto-save
  useEffect(() => {
    if (flowNodes.length > 0 && !isExampleProject) {
      scheduleAutoSave();
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [flowNodes, scheduleAutoSave, isExampleProject]);

  // Track edge changes for auto-save
  useEffect(() => {
    if (flowEdges.length > 0 && !isExampleProject) {
      scheduleAutoSave();
    }
  }, [flowEdges, scheduleAutoSave, isExampleProject]);

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return '刚刚';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      if (isReadOnly) return;
      const newEdge = {
        ...params,
        type: 'custom',
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        data: { edgeType: 'relatedTo' },
      };
      setFlowEdges((eds) => addEdge(newEdge, eds));
    },
    [setFlowEdges, isReadOnly]
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
    conclusion: '#a855f7',
    discussion: '#06b6d4',
    media: '#ec4899',
    note: '#eab308',
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
    let nodeData: BaseNodeData = {
      type: type,  // Add type to data for API conversion
      title: { 'zh-CN': getNodeDefaultTitle(type), zh: getNodeDefaultTitle(type) },
      ...baseFields,
    };

    // Add type-specific required fields
    switch (type) {
      case 'problem':
        nodeData = {
          ...nodeData,
          type: 'problem',
          description: { 'zh-CN': '', zh: '' },
          status: 'open',
          priority: 'medium',
        } as ProblemNodeData;
        break;
      case 'experiment':
        nodeData = {
          ...nodeData,
          type: 'experiment',
          description: { 'zh-CN': '', zh: '' },
          status: 'pending',
        } as ExperimentNodeData;
        break;
      case 'conclusion':
        nodeData = {
          ...nodeData,
          type: 'conclusion',
          description: { 'zh-CN': '', zh: '' },
          statement: { 'zh-CN': '', zh: '' },
          confidence: 0.5,
          evidenceIds: [],
        } as ConclusionNodeData;
        break;
      case 'discussion':
        nodeData = {
          ...nodeData,
          type: 'discussion',
          topic: { 'zh-CN': '', zh: '' },
          status: 'active',
          participants: [],
        } as DiscussionNodeData;
        break;
      case 'media':
        nodeData = {
          ...nodeData,
          type: 'media',
          url: '',
          mediaType: 'image',
          description: { 'zh-CN': '', zh: '' },
        } as MediaNodeData;
        break;
      case 'note':
        nodeData = {
          ...nodeData,
          type: 'note',
          content: { 'zh-CN': '', zh: '' },
          color: 'yellow',
          pinned: false,
        } as NoteNodeData;
        break;
    }

    const newNode = {
      id: nodeId,
      type: type as 'problem' | 'experiment' | 'conclusion' | 'discussion' | 'media' | 'note',
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
      conclusion: '新结论',
      discussion: '新讨论',
      media: '新媒体',
      note: '新便签',
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
      markdown += `课题ID: ${projectId}\n画布ID: ${canvasId}\n导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

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
        const nodeDataType = node.data as BaseNodeData;
        const status = 'status' in nodeDataType ? (nodeDataType as { status?: string }).status : '';
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
            // Detect data format: API format has position_x, React Flow format has position object
            // 检测数据格式：API 格式有 position_x，React Flow 格式有 position 对象
            const isApiFormat = data.nodes[0]?.position_x !== undefined;

            let nodes, edges;
            if (isApiFormat) {
              // API format needs conversion to React Flow format
              // API 格式需要转换为 React Flow 格式
              nodes = data.nodes.map(apiToNodeFormat);
              edges = (data.edges || []).map(apiToEdgeFormat);
            } else {
              // React Flow format can be used directly
              // React Flow 格式可以直接使用
              nodes = data.nodes;
              edges = data.edges || [];
            }

            setFlowNodes(nodes);
            setFlowEdges(edges);
            setNodes(nodes);
            setEdges(edges);
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
            课题: {projectId} | {flowNodes.length} 节点 · {flowEdges.length} 关系
          </div>
        }
        rightContent={
          <div className="flex items-center gap-2">
            {/* Save status indicator - 只读模式隐藏 */}
            {!isExampleProject && !isReadOnly && (
              <div className="flex items-center gap-2">
                {saveError ? (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    保存失败
                  </span>
                ) : isLoadingCanvas ? (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    加载中...
                  </span>
                ) : canvasError ? (
                  <span className="flex items-center gap-1 text-xs text-yellow-500">
                    <AlertCircle className="w-3 h-3" />
                    {canvasError}
                  </span>
                ) : hasUnsavedChanges ? (
                  <span className="text-xs text-yellow-400">有未保存的更改</span>
                ) : lastSavedAt ? (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Check className="w-3 h-3" />
                    已保存 {formatRelativeTime(lastSavedAt)}
                  </span>
                ) : null}

                {/* Save button */}
                <button
                  onClick={() => handleSave(true)}
                  disabled={isSaving || !hasUnsavedChanges}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors",
                    hasUnsavedChanges
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-slate-700 text-gray-500 cursor-not-allowed"
                  )}
                  title="保存画布"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  保存
                </button>
              </div>
            )}

            {/* Import button - 只读模式隐藏 */}
            {!isReadOnly && (
            <>
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
            </>
            )}

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
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
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
            课题: {projectId} | 画布: {canvasId}
            {isReadOnly && <span className="ml-2 text-amber-400">(只读)</span>}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            节点: {flowNodes.length} | 关系: {flowEdges.length}
          </div>
        </div>

        {/* Add Node Toolbar - 只读模式隐藏 */}
        {!isReadOnly && (
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
          <button
            className="px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-white text-sm rounded-lg border border-yellow-400 transition-colors"
            onClick={() => createNode('note')}
          >
            + 便签
          </button>
        </div>
        )}

        {/* Instructions */}
        {flowNodes.length === 0 && !isReadOnly && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-600 p-8 max-w-md">
              <h3 className="text-white text-lg font-semibold mb-4">开始您的探索</h3>
              <p className="text-gray-400 text-sm mb-4">
                点击右上角的按钮创建节点，通过拖拽节点右侧的点创建节点之间的连接
              </p>
            </div>
          </div>
        )}

        {/* Read-only empty state */}
        {flowNodes.length === 0 && isReadOnly && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-600 p-8 max-w-md">
              <h3 className="text-white text-lg font-semibold mb-4">画布为空</h3>
              <p className="text-gray-400 text-sm mb-4">
                此课题暂无画布内容
              </p>
            </div>
          </div>
        )}
        </div>

        {/* Side Panel for Node Details */}
        <div className="w-80 border-l border-slate-700 bg-slate-800/50 flex flex-col">
          <NodeDetailsPanel theme={theme} onUpdateNode={updateNode} onRemoveNode={removeNode} readOnly={isReadOnly} />
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
