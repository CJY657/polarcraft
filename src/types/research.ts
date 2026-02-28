/**
 * Research Canvas Data Types
 * 研究画布数据类型
 */

// ============================================================
// Core Types - 核心类型
// ============================================================

/** Node Types - 节点类型 */
export type NodeType =
  | "problem"      // 问题节点
  | "experiment"   // 实验节点
  | "conclusion"   // 结论节点
  | "note";        // 便签节点

/** Edge/Relationship Types - 边/关系类型 */
export type EdgeType =
  | "derivesTo"    // 推导出
  | "verifies"     // 验证
  | "refutes"      // 反驳
  | "cites"        // 引用
  | "basedOn"      // 基于
  | "relatedTo";   // 关联

/** Node Status - 节点状态 */
export type NodeStatus =
  | "open"          // 开放问题
  | "investigating" // 调查中
  | "answered"      // 已解答
  | "pending"       // 待执行
  | "running"       // 运行中
  | "completed"     // 已完成
  | "draft";        // 草稿

/** Project Status - 项目状态 */
export type ProjectStatus =
  | "draft"      // 草稿
  | "active"     // 进行中
  | "completed"  // 已完成
  | "archived";  // 已归档

/** Member Role - 成员角色 */
export type MemberRole =
  | "owner"   // 所有者
  | "admin"   // 管理员
  | "editor"  // 编辑者
  | "viewer"; // 查看者

// ============================================================
// Node Types - 节点类型定义
// ============================================================

/** Base Node Interface */
export interface BaseNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  createdAt: string;
  updatedAt: string;
  createdBy: string; // userId
  assignedTo?: string[]; // userIds for task assignment
}

/** Problem Node - 问题节点 */
export interface ProblemNode extends BaseNode {
  type: "problem";
  title: LabelI18n;
  description: LabelI18n;
  hypothesis?: LabelI18n; // 研究假设
  status: "open" | "investigating" | "answered";
  priority: "low" | "medium" | "high";
  tags?: string[];
}

/** Experiment Node - 实验节点 */
export interface ExperimentNode extends BaseNode {
  type: "experiment";
  title: LabelI18n;
  description: LabelI18n;
  status: "pending" | "running" | "completed" | "failed";
  simulationConfig?: {
    demoId?: string; // Link to existing demo (e.g., "ColorStateDemo")
    parameters: Record<string, any>; // Simulation parameters
    opticalStudioConfig?: any; // Future: OpticalStudio config
  };
  resultSnapshot?: {
    timestamp: string;
    data: any; // Simulation results
    visualization?: string; // URL to chart/image
  };
  linkedDemo?: string; // ID of demo in /feature/demos/
}

/** Conclusion Node - 结论节点 */
export interface ConclusionNode extends BaseNode {
  type: "conclusion";
  title: LabelI18n;
  statement: LabelI18n;
  confidence: number; // 0-1, how confident we are
  evidenceIds: string[]; // IDs of supporting data/experiment nodes
  limitations?: LabelI18n;
  futureWork?: LabelI18n;
}

/** Note Node - 便签节点 */
export interface NoteNode extends BaseNode {
  type: "note";
  title: LabelI18n;
  content: LabelI18n; // 主要内容，支持 Markdown
  color: "yellow" | "green" | "blue" | "pink" | "purple";
  pinned?: boolean; // 是否置顶
}

/** Union Type for All Nodes */
export type ResearchNode =
  | ProblemNode
  | ExperimentNode
  | ConclusionNode
  | NoteNode;

// ============================================================
// Edge Types - 边类型定义
// ============================================================

/** Research Edge/Relationship */
export interface ResearchEdge {
  id: string;
  type: EdgeType;
  source: string; // Node ID
  target: string; // Node ID
  label?: LabelI18n;
  evidence?: {
    strength?: number; // 0-1, how strong the relationship is
    notes?: LabelI18n;
  };
  createdAt: string;
  createdBy: string;
}

// ============================================================
// Canvas/Project Types - 画布/项目类型
// ============================================================

/** Research Canvas - 研究画布 */
export interface ResearchCanvas {
  id: string;
  projectId: string;
  name: LabelI18n;
  description?: LabelI18n;
  nodes: ResearchNode[];
  edges: ResearchEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
}

/** Project Member */
export interface ProjectMember {
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

/** Project Settings */
export interface ProjectSettings {
  isPublic: boolean;
  allowGuestComments: boolean;
  enableTaskBoard: boolean;
  defaultCanvasId?: string;
}

/** Research Project - 研究项目 */
export interface ResearchProject {
  id: string;
  name: LabelI18n;
  description: LabelI18n;
  thumbnail?: string;
  status: ProjectStatus;
  members: ProjectMember[];
  canvases: ResearchCanvas[];
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Task Board Types - 任务看板类型
// ============================================================

/** Task Board View */
export interface TaskBoard {
  projectId: string;
  columns: {
    status: NodeStatus;
    nodes: string[]; // Node IDs
  }[];
}

// ============================================================
// Activity/Collaboration Types - 活动/协作类型
// ============================================================

/** Activity Log Entry */
export interface ActivityEntry {
  id: string;
  projectId: string;
  canvasId?: string;
  userId: string;
  action: "create_node" | "update_node" | "delete_node" | "create_edge" | "delete_edge" | "add_comment";
  targetType: "node" | "edge" | "canvas";
  targetId: string;
  changes?: Record<string, any>;
  timestamp: string;
}

/** Comment on Node */
export interface NodeComment {
  id: string;
  nodeId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  resolved?: boolean;
}

// ============================================================
// API Types - API 类型
// ============================================================

/** API Response Wrapper */
export interface ResearchApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/** Create Project Request */
export interface CreateProjectRequest {
  name: LabelI18n;
  description: LabelI18n;
  isPublic?: boolean;
}

/** Update Project Request */
export interface UpdateProjectRequest {
  name?: LabelI18n;
  description?: LabelI18n;
  status?: ProjectStatus;
  thumbnail?: string;
  settings?: Partial<ProjectSettings>;
}

/** Create Node Request */
export interface CreateNodeRequest {
  type: NodeType;
  position: { x: number; y: number };
  title: LabelI18n;
  [key: string]: any; // Additional properties based on node type
}

/** Update Node Request */
export interface UpdateNodeRequest {
  [key: string]: any; // Dynamic properties based on node type
}

/** Create Edge Request */
export interface CreateEdgeRequest {
  type: EdgeType;
  source: string;
  target: string;
  label?: LabelI18n;
  evidence?: {
    strength?: number;
    notes?: LabelI18n;
  };
}

/** Simulation Request */
export interface SimulationRequest {
  demoId: string;
  parameters: Record<string, any>;
}

/** Simulation Result */
export interface SimulationResult {
  success: boolean;
  data: any;
  visualization?: {
    type: "chart" | "image" | "table";
    url?: string;
    data?: any;
  };
  metadata: {
    executedAt: string;
    executionTime: number;
  };
}

// ============================================================
// Helper Types - 辅助类型
// ============================================================

/** React Flow Node representation */
export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: ResearchNode;
}

/** React Flow Edge representation */
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data: ResearchEdge;
}
