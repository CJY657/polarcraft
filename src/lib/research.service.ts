/**
 * Research Service
 * 研究项目 API 服务
 *
 * Handles all API calls related to the virtual research group system
 * 处理虚拟课题组系统相关的所有 API 调用
 */

import { api } from './api';

// =====================================================
// Types / 类型定义
// =====================================================

export interface ResearchProject {
  id: string;
  name_zh: string;
  name_en: string | null;
  description_zh: string | null;
  description_en: string | null;
  thumbnail: string | null;
  status: 'draft' | 'active' | 'completed' | 'archived';
  is_public: boolean;
  allow_guest_comments: boolean;
  enable_task_board: boolean;
  default_canvas_id: string | null;
  member_count: number;
  canvas_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joined_at: string;
  username: string;
  avatar_url: string | null;
}

export interface ProjectWithMembers extends ResearchProject {
  members: ProjectMember[];
}

export interface CreateProjectInput {
  name_zh: string;
  name_en?: string;
  description_zh?: string;
  description_en?: string;
  is_public?: boolean;
}

export interface UpdateProjectInput {
  name_zh?: string;
  name_en?: string;
  description_zh?: string;
  description_en?: string;
  thumbnail?: string;
  status?: 'draft' | 'active' | 'completed' | 'archived';
  is_public?: boolean;
}

// Node Types / 节点类型
export type NodeType = 'problem' | 'experiment' | 'conclusion' | 'discussion' | 'media' | 'note';

// Edge Types / 边类型
export type EdgeType = 'derivesTo' | 'verifies' | 'refutes' | 'cites' | 'basedOn' | 'relatedTo';

// Create Node Input / 创建节点输入
export interface CreateNodeInput {
  type: NodeType;
  position_x: number;
  position_y: number;
  title_zh?: string;
  title_en?: string;
  description_zh?: string;
  description_en?: string;
  status?: string;
  // Problem fields
  hypothesis_zh?: string;
  hypothesis_en?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  // Experiment fields
  simulation_config?: any;
  result_snapshot?: any;
  linked_demo?: string;
  // Conclusion fields
  statement_zh?: string;
  statement_en?: string;
  confidence?: number;
  evidence_ids?: string[];
  limitations_zh?: string;
  limitations_en?: string;
  future_work_zh?: string;
  future_work_en?: string;
  // Discussion fields
  topic_zh?: string;
  topic_en?: string;
  participants?: string[];
  // Media fields
  media_url?: string;
  media_type?: string;
  // Note fields
  content_zh?: string;
  content_en?: string;
  color?: string;
  pinned?: boolean;
}

// Create Edge Input / 创建边输入
export interface CreateEdgeInput {
  type: EdgeType;
  source_node_id: string;
  target_node_id: string;
  label_zh?: string;
  label_en?: string;
  evidence_strength?: number;
  evidence_notes_zh?: string;
  evidence_notes_en?: string;
}

// Research Node / 研究节点
export interface ResearchNode {
  id: string;
  canvas_id: string;
  type: NodeType;
  position_x: number;
  position_y: number;
  title_zh: string | null;
  title_en: string | null;
  description_zh: string | null;
  description_en: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  assigned_to: string[] | null;
  // Problem fields
  hypothesis_zh?: string | null;
  hypothesis_en?: string | null;
  priority?: 'low' | 'medium' | 'high' | null;
  tags?: string[] | null;
  // Experiment fields
  simulation_config?: any | null;
  result_snapshot?: any | null;
  linked_demo?: string | null;
  // Conclusion fields
  statement_zh?: string | null;
  statement_en?: string | null;
  confidence?: number | null;
  evidence_ids?: string[] | null;
  limitations_zh?: string | null;
  limitations_en?: string | null;
  future_work_zh?: string | null;
  future_work_en?: string | null;
  // Discussion fields
  topic_zh?: string | null;
  topic_en?: string | null;
  participants?: string[] | null;
  // Media fields
  media_url?: string | null;
  media_type?: string | null;
  // Note fields
  content_zh?: string | null;
  content_en?: string | null;
  color?: string | null;
  pinned?: boolean | null;
}

// Research Edge / 研究边
export interface ResearchEdge {
  id: string;
  canvas_id: string;
  type: EdgeType;
  source_node_id: string;
  target_node_id: string;
  label_zh: string | null;
  label_en: string | null;
  evidence_strength: number | null;
  evidence_notes_zh: string | null;
  evidence_notes_en: string | null;
  created_at: string;
  created_by: string;
}

// Research Canvas / 研究画布
export interface ResearchCanvas {
  id: string;
  project_id: string;
  name_zh: string;
  name_en: string | null;
  description_zh: string | null;
  description_en: string | null;
  viewport_data: { x: number; y: number; zoom: number } | null;
  created_at: string;
  updated_at: string;
  nodes?: ResearchNode[];
  edges?: ResearchEdge[];
}

// =====================================================
// Research API Methods / 研究 API 方法
// =====================================================

export const researchApi = {
  // =====================================================
  // Projects / 项目
  // =====================================================

  /**
   * Get user's projects
   * 获取用户的项目列表
   */
  getUserProjects: async (): Promise<ResearchProject[]> => {
    const response = await api.get<ResearchProject[]>('/api/research/projects');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取项目列表失败');
  },

  /**
   * Get project by ID
   * 获取项目详情
   */
  getProject: async (projectId: string): Promise<ProjectWithMembers> => {
    const response = await api.get<ProjectWithMembers>(`/api/research/projects/${projectId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取项目详情失败');
  },

  /**
   * Create new project
   * 创建新项目
   */
  createProject: async (input: CreateProjectInput): Promise<ResearchProject> => {
    const response = await api.post<ResearchProject>('/api/research/projects', input);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '创建项目失败');
  },

  /**
   * Update project
   * 更新项目
   */
  updateProject: async (projectId: string, input: UpdateProjectInput): Promise<ResearchProject> => {
    const response = await api.put<ResearchProject>(`/api/research/projects/${projectId}`, input);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '更新项目失败');
  },

  /**
   * Delete project
   * 删除项目
   */
  deleteProject: async (projectId: string): Promise<void> => {
    const response = await api.delete(`/api/research/projects/${projectId}`);
    if (!response.success) {
      throw new Error(response.error?.message || '删除项目失败');
    }
  },

  /**
   * Add member to project
   * 添加项目成员
   */
  addProjectMember: async (projectId: string, userId: string, role: 'admin' | 'editor' | 'viewer' = 'viewer'): Promise<void> => {
    const response = await api.post(`/api/research/projects/${projectId}/members`, { userId, role });
    if (!response.success) {
      throw new Error(response.error?.message || '添加成员失败');
    }
  },

  /**
   * Remove member from project
   * 移除项目成员
   */
  removeProjectMember: async (projectId: string, userId: string): Promise<void> => {
    const response = await api.delete(`/api/research/projects/${projectId}/members/${userId}`);
    if (!response.success) {
      throw new Error(response.error?.message || '移除成员失败');
    }
  },

  // =====================================================
  // Canvases / 画布
  // =====================================================

  /**
   * Get project canvases
   * 获取项目的画布列表
   */
  getProjectCanvases: async (projectId: string): Promise<any[]> => {
    const response = await api.get<any[]>(`/api/research/projects/${projectId}/canvases`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取画布列表失败');
  },

  /**
   * Get canvas by ID
   * 获取画布详情
   */
  getCanvas: async (canvasId: string): Promise<any> => {
    const response = await api.get<any>(`/api/research/canvases/${canvasId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取画布详情失败');
  },

  /**
   * Create canvas
   * 创建画布
   */
  createCanvas: async (projectId: string, data: { name_zh: string; name_en?: string }): Promise<any> => {
    const response = await api.post<any>(`/api/research/projects/${projectId}/canvases`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '创建画布失败');
  },

  /**
   * Update canvas
   * 更新画布
   */
  updateCanvas: async (canvasId: string, data: { viewport_data?: any }): Promise<ResearchCanvas> => {
    const response = await api.put<ResearchCanvas>(`/api/research/canvases/${canvasId}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '更新画布失败');
  },

  /**
   * Delete canvas
   * 删除画布
   */
  deleteCanvas: async (canvasId: string): Promise<void> => {
    const response = await api.delete(`/api/research/canvases/${canvasId}`);
    if (!response.success) {
      throw new Error(response.error?.message || '删除画布失败');
    }
  },

  // =====================================================
  // Nodes / 节点
  // =====================================================

  /**
   * Create node
   * 创建节点
   */
  createNode: async (canvasId: string, data: CreateNodeInput): Promise<ResearchNode> => {
    const response = await api.post<ResearchNode>(`/api/research/canvases/${canvasId}/nodes`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '创建节点失败');
  },

  /**
   * Get node by ID
   * 获取节点详情
   */
  getNode: async (nodeId: string): Promise<ResearchNode> => {
    const response = await api.get<ResearchNode>(`/api/research/nodes/${nodeId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取节点详情失败');
  },

  /**
   * Update node
   * 更新节点
   */
  updateNode: async (nodeId: string, data: Partial<CreateNodeInput>): Promise<ResearchNode> => {
    const response = await api.put<ResearchNode>(`/api/research/nodes/${nodeId}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '更新节点失败');
  },

  /**
   * Delete node
   * 删除节点
   */
  deleteNode: async (nodeId: string): Promise<void> => {
    const response = await api.delete(`/api/research/nodes/${nodeId}`);
    if (!response.success) {
      throw new Error(response.error?.message || '删除节点失败');
    }
  },

  // =====================================================
  // Edges / 边
  // =====================================================

  /**
   * Create edge
   * 创建边
   */
  createEdge: async (canvasId: string, data: CreateEdgeInput): Promise<ResearchEdge> => {
    const response = await api.post<ResearchEdge>(`/api/research/canvases/${canvasId}/edges`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '创建边失败');
  },

  /**
   * Get edge by ID
   * 获取边详情
   */
  getEdge: async (edgeId: string): Promise<ResearchEdge> => {
    const response = await api.get<ResearchEdge>(`/api/research/edges/${edgeId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取边详情失败');
  },

  /**
   * Update edge
   * 更新边
   */
  updateEdge: async (edgeId: string, data: Partial<CreateEdgeInput>): Promise<ResearchEdge> => {
    const response = await api.put<ResearchEdge>(`/api/research/edges/${edgeId}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '更新边失败');
  },

  /**
   * Delete edge
   * 删除边
   */
  deleteEdge: async (edgeId: string): Promise<void> => {
    const response = await api.delete(`/api/research/edges/${edgeId}`);
    if (!response.success) {
      throw new Error(response.error?.message || '删除边失败');
    }
  },

  // =====================================================
  // Activity / 活动日志
  // =====================================================

  /**
   * Get project activity log
   * 获取项目活动日志
   */
  getProjectActivity: async (projectId: string, limit: number = 50): Promise<any[]> => {
    const response = await api.get<any[]>(`/api/research/projects/${projectId}/activity?limit=${limit}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || '获取活动日志失败');
  },
};
