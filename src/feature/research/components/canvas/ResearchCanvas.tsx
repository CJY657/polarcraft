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
import { ArrowLeft, Save, Loader2, AlertCircle, Grab } from 'lucide-react';
import { researchApi } from '@/lib/research.service';
import { nodeToApiFormat, edgeToApiFormat, apiToNodeFormat, apiToEdgeFormat, isTemporaryId } from '../../utils/canvasDataConverter';
import { CanvasSidebar } from './CanvasSidebar';
import { CanvasToolbar } from './CanvasToolbar';
import type { ResearchNode } from '@/types/research';
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
    setFlowNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    );
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
          (change) => change.type === 'select' || change.type === 'reset' || (change.type as string) === 'dimensions'
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
          const created = await researchApi.createNode(targetCanvasId, nodeData as any);
          // Update the node ID with the server-generated ID
          if (created?.id) {
            nodeIdMap.set(oldId, created.id);
            updatedNodes[i] = { ...node, id: created.id };
          } else {
            console.warn('Create node response missing id, keeping temporary ID');
          }
        } else {
          // Update existing node
          await researchApi.updateNode(node.id, nodeData as any);
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
          const created = await researchApi.createEdge(targetCanvasId, edgeData as any);
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
          await researchApi.updateEdge(edge.id, edgeData as any);
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
      setHasUnsavedChanges(true);
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
  const createNode = useCallback((type: string, position?: { x: number; y: number }) => {
    const now = Date.now();
    const nodeId = `${type}-${now}`;

    let pos = position;

    if (!pos) {
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
      pos = {
        x: centerX + (Math.random() - 0.5) * 50,
        y: centerY + (Math.random() - 0.5) * 50,
      };
    }

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
      data: nodeData as any as ResearchNode,
    };
    // Update both the store and React Flow state
    addNode(newNode);
    setFlowNodes((nds) => [...nds, newNode]);
    setHasUnsavedChanges(true);
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

  // Drag and Drop handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      // Get drop position relative to canvas
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      createNode(type, position);
    },
    [reactFlowInstance, createNode]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete key to remove selected nodes/edges
      if ((event.key === 'Delete' || event.key === 'Backspace') && !isReadOnly) {
        // Only if not in an input/textarea
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          const selectedNodes = flowNodes.filter(n => n.selected);
          const selectedEdges = flowEdges.filter(e => e.selected);

          if (selectedNodes.length > 0 || selectedEdges.length > 0) {
            selectedNodes.forEach(n => removeNode(n.id));
            selectedEdges.forEach(e => removeEdge(e.id));
            setHasUnsavedChanges(true);
          }
        }
      }

      // Ctrl + S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flowNodes, flowEdges, removeNode, removeEdge, isReadOnly, handleSave]);

  const handleDeleteSelected = useCallback(() => {
    if (isReadOnly) return;
    const selectedNodes = flowNodes.filter(n => n.selected);
    const selectedEdges = flowEdges.filter(e => e.selected);

    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      if (confirm(`确定要删除选中的 ${selectedNodes.length} 个节点和 ${selectedEdges.length} 条连线吗？`)) {
        selectedNodes.forEach(n => removeNode(n.id));
        selectedEdges.forEach(e => removeEdge(e.id));
        setHasUnsavedChanges(true);
      }
    }
  }, [flowNodes, flowEdges, removeNode, removeEdge, isReadOnly]);

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

  const selectedCount = flowNodes.filter(n => n.selected).length + flowEdges.filter(e => e.selected).length;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* Persistent Header */}
      <PersistentHeader
        moduleKey="labGroup"
        moduleName={getProjectTitle()}
        variant="glass"
        compact={true}
        className={cn(
          "flex-shrink-0 border-b",
          theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}
        centerContent={
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500 font-mono">
              ID: {projectId}
            </div>
            <div className={cn(
              "h-4 w-px",
              theme === 'dark' ? "bg-slate-800" : "bg-slate-200"
            )} />
            <div className="flex items-center gap-1.5">
              <div className={cn("w-2 h-2 rounded-full", hasUnsavedChanges ? "bg-amber-500" : "bg-emerald-500")} />
              <span className="text-xs text-slate-400">
                {hasUnsavedChanges ? '未保存' : '已同步'}
              </span>
            </div>
          </div>
        }
        rightContent={
          <div className="flex items-center gap-2">
            {/* Save status indicator - 只读模式隐藏 */}
            {!isExampleProject && !isReadOnly && (
              <div className="flex items-center gap-2 mr-2">
                {saveError ? (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    错误
                  </span>
                ) : isLoadingCanvas ? (
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                ) : lastSavedAt && !hasUnsavedChanges ? (
                  <span className="text-[10px] text-slate-500">
                    保存于 {formatRelativeTime(lastSavedAt)}
                  </span>
                ) : null}

                <button
                  onClick={() => handleSave(true)}
                  disabled={isSaving || !hasUnsavedChanges}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 text-xs rounded-full font-medium transition-all",
                    hasUnsavedChanges
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  )}
                >
                  {isSaving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  保存
                </button>
              </div>
            )}

            <div className="flex items-center bg-slate-800/50 rounded-full p-0.5 border border-slate-700/50">
               {/* Import button */}
              {!isReadOnly && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  title="导入"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </button>
              )}

              {/* Export button */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  title="导出"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M8 12l4 4m0 0l4-4m-4 4V4" />
                  </svg>
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 min-w-[140px] z-[60]">
                    <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">JSON 格式</button>
                    <button onClick={() => handleExport('markdown')} className="w-full text-left px-4 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Markdown 格式</button>
                    <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">CSV 格式</button>
                  </div>
                )}
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

            <Link
              to="/lab/projects"
              className="ml-2 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-700/50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              退出
            </Link>
          </div>
        }
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex min-h-0 bg-slate-950">
        {/* Left Sidebar */}
        {!isReadOnly && <CanvasSidebar theme={theme} />}

        {/* Canvas Area */}
        <div ref={reactFlowWrapper} className="flex-1 relative overflow-hidden group/canvas">
          <ReactFlow
            nodes={flowNodes}
            edges={edgesWithCallbacks}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={0.05}
            maxZoom={4}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            className={cn(
              theme === 'dark' ? "bg-slate-950" : "bg-slate-50"
            )}
            snapToGrid={true}
            snapGrid={[16, 16]}
          >
            <Background
              variant={BackgroundVariant.Lines}
              gap={32}
              size={1}
              color={theme === 'dark' ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)"}
              className="bg-slate-950"
            />
            <Background
              variant={BackgroundVariant.Lines}
              gap={160}
              size={1}
              color={theme === 'dark' ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"}
              id="major-grid"
            />

            {/* Custom Toolbar */}
            <CanvasToolbar
              theme={theme}
              onDelete={handleDeleteSelected}
              selectedCount={selectedCount}
            />

            <MiniMap
              nodeColor={nodeColorClassName}
              maskColor={theme === 'dark' ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)"}
              className={cn(
                "rounded-xl border shadow-2xl transition-all duration-300 opacity-0 group-hover/canvas:opacity-100",
                theme === 'dark' ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
              )}
              style={{ bottom: 20, right: 20, width: 150, height: 100 }}
              pannable
              zoomable
            />
          </ReactFlow>

          {/* Floating Instructions */}
          {flowNodes.length === 0 && !isReadOnly && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="text-center space-y-4 animate-in fade-in zoom-in duration-700">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
                  <Grab className="w-8 h-8 text-blue-500/50" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-200 font-medium">准备好开始了吗？</h3>
                  <p className="text-slate-500 text-sm">从左侧边栏拖拽组件到此处开始建模</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Property Editor */}
        <div className={cn(
          "w-80 flex-shrink-0 border-l flex flex-col transition-all duration-300 shadow-2xl z-10",
          theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
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
