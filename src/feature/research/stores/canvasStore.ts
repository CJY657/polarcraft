/**
 * Canvas Store
 * 画布状态管理
 *
 * Zustand store for managing research canvas state
 * 使用 Zustand 管理研究画布状态
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Node, Edge } from 'reactflow';
import type { ResearchNode, ResearchEdge } from '@/types/research';

interface CanvasState {
  // Canvas state / 画布状态
  nodes: Node<ResearchNode>[];
  edges: Edge<ResearchEdge>[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  viewport: { x: number; y: number; zoom: number };

  // Save state / 保存状态
  canvasId: string | null;
  projectId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
  saveError: string | null;

  // Node Actions / 节点操作
  setNodes: (nodes: Node<ResearchNode>[]) => void;
  setEdges: (edges: Edge<ResearchEdge>[]) => void;
  addNode: (node: Node<ResearchNode>) => void;
  updateNode: (nodeId: string, updates: Partial<Node<ResearchNode>>) => void;
  removeNode: (nodeId: string) => void;

  // Edge Actions / 边操作
  addEdge: (edge: Edge<ResearchEdge>) => void;
  updateEdge: (edgeId: string, updates: Partial<Edge<ResearchEdge>>) => void;
  removeEdge: (edgeId: string) => void;

  // Selection / 选择
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  clearSelection: () => void;

  // Viewport / 视口
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;

  // Canvas context / 画布上下文
  setCanvasContext: (canvasId: string, projectId: string) => void;

  // Save state actions / 保存状态操作
  setLoading: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  markAsChanged: () => void;
  markAsSaved: () => void;
  setSaveError: (error: string | null) => void;

  // Reset / 重置
  reset: () => void;
}

const initialState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  viewport: { x: 0, y: 0, zoom: 1 },
  canvasId: null,
  projectId: null,
  isLoading: false,
  isSaving: false,
  lastSavedAt: null,
  hasUnsavedChanges: false,
  saveError: null,
};

export const useCanvasStore = create<CanvasState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Node operations / 节点操作
      setNodes: (nodes) =>
        set({ nodes, hasUnsavedChanges: true }, false, 'setNodes'),

      setEdges: (edges) =>
        set({ edges, hasUnsavedChanges: true }, false, 'setEdges'),

      addNode: (node) =>
        set(
          (state) => ({ nodes: [...state.nodes, node], hasUnsavedChanges: true }),
          false,
          'addNode'
        ),

      updateNode: (nodeId, updates) =>
        set(
          (state) => ({
            nodes: state.nodes.map((node) =>
              node.id === nodeId ? { ...node, ...updates } : node
            ),
            hasUnsavedChanges: true,
          }),
          false,
          'updateNode'
        ),

      removeNode: (nodeId) =>
        set(
          (state) => ({
            nodes: state.nodes.filter((node) => node.id !== nodeId),
            edges: state.edges.filter(
              (edge) => edge.source !== nodeId && edge.target !== nodeId
            ),
            hasUnsavedChanges: true,
          }),
          false,
          'removeNode'
        ),

      // Edge operations / 边操作
      addEdge: (edge) =>
        set(
          (state) => ({ edges: [...state.edges, edge], hasUnsavedChanges: true }),
          false,
          'addEdge'
        ),

      updateEdge: (edgeId, updates) =>
        set(
          (state) => ({
            edges: state.edges.map((edge) =>
              edge.id === edgeId ? { ...edge, ...updates } : edge
            ),
            hasUnsavedChanges: true,
          }),
          false,
          'updateEdge'
        ),

      removeEdge: (edgeId) =>
        set(
          (state) => ({
            edges: state.edges.filter((edge) => edge.id !== edgeId),
            hasUnsavedChanges: true,
          }),
          false,
          'removeEdge'
        ),

      // Selection / 选择
      selectNode: (nodeId) =>
        set({ selectedNodeId: nodeId }, false, 'selectNode'),

      selectEdge: (edgeId) =>
        set({ selectedEdgeId: edgeId }, false, 'selectEdge'),

      clearSelection: () =>
        set({ selectedNodeId: null, selectedEdgeId: null }, false, 'clearSelection'),

      // Viewport / 视口
      setViewport: (viewport) =>
        set({ viewport, hasUnsavedChanges: true }, false, 'setViewport'),

      // Canvas context / 画布上下文
      setCanvasContext: (canvasId, projectId) =>
        set({ canvasId, projectId }, false, 'setCanvasContext'),

      // Save state actions / 保存状态操作
      setLoading: (isLoading) =>
        set({ isLoading }, false, 'setLoading'),

      setSaving: (isSaving) =>
        set({ isSaving }, false, 'setSaving'),

      markAsChanged: () =>
        set({ hasUnsavedChanges: true }, false, 'markAsChanged'),

      markAsSaved: () =>
        set(
          { hasUnsavedChanges: false, lastSavedAt: new Date(), saveError: null },
          false,
          'markAsSaved'
        ),

      setSaveError: (error) =>
        set({ saveError: error }, false, 'setSaveError'),

      // Reset / 重置
      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'CanvasStore' }
  )
);

// Selectors / 选择器
export const selectNodes = (state: CanvasState) => state.nodes;
export const selectEdges = (state: CanvasState) => state.edges;
export const selectSelectedNode = (state: CanvasState) =>
  state.nodes.find((n) => n.id === state.selectedNodeId) || null;
export const selectSelectedEdge = (state: CanvasState) =>
  state.edges.find((e) => e.id === state.selectedEdgeId) || null;
export const selectHasUnsavedChanges = (state: CanvasState) => state.hasUnsavedChanges;
export const selectIsSaving = (state: CanvasState) => state.isSaving;
export const selectLastSavedAt = (state: CanvasState) => state.lastSavedAt;
