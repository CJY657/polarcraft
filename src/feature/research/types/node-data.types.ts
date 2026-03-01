/**
 * Node Data Types for Research Module
 * 研究模块节点数据类型
 *
 * This file contains comprehensive TypeScript interfaces and type guards
 * for all node types used in the research canvas system.
 * 此文件包含研究画布系统中所有节点类型的全面 TypeScript 接口和类型守卫
 */

import type { LabelI18n } from '@/types/i18n';

// ============================================================
// Base Node Data - 基础节点数据
// ============================================================

/**
 * Base fields shared by all node data types
 * 所有节点数据类型共享的基础字段
 */
export interface BaseNodeData {
  id?: string;
  type?: string;
  title?: LabelI18n;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  assignedTo?: string[];
}

// ============================================================
// Problem Node Data - 问题节点数据
// ============================================================

/**
 * Problem Node specific data
 * 问题节点特有数据
 */
export interface ProblemNodeData extends BaseNodeData {
  type: 'problem';
  title: LabelI18n;
  description: LabelI18n;
  hypothesis?: LabelI18n;
  status: 'open' | 'investigating' | 'answered';
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
}

// ============================================================
// Experiment Node Data - 实验节点数据
// ============================================================

/**
 * Simulation configuration
 * 模拟配置
 */
export interface SimulationConfig {
  demoId?: string;
  parameters: Record<string, unknown>;
  opticalStudioConfig?: unknown;
}

/**
 * Result snapshot
 * 结果快照
 */
export interface ResultSnapshot {
  timestamp: string;
  data: unknown;
  visualization?: string;
}

/**
 * Experiment Node specific data
 * 实验节点特有数据
 */
export interface ExperimentNodeData extends BaseNodeData {
  type: 'experiment';
  title: LabelI18n;
  description: LabelI18n;
  status: 'pending' | 'running' | 'completed' | 'failed';
  simulationConfig?: SimulationConfig;
  resultSnapshot?: ResultSnapshot;
  linkedDemo?: string;
}

// ============================================================
// Conclusion Node Data - 结论节点数据
// ============================================================

/**
 * Conclusion Node specific data
 * 结论节点特有数据
 */
export interface ConclusionNodeData extends BaseNodeData {
  type: 'conclusion';
  title: LabelI18n;
  statement: LabelI18n;
  confidence: number;
  evidenceIds: string[];
  limitations?: LabelI18n;
  futureWork?: LabelI18n;
  description?: LabelI18n;
}

// ============================================================
// Discussion Node Data - 讨论节点数据
// ============================================================

/**
 * Comment in discussion
 * 讨论中的评论
 */
export interface DiscussionComment {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  replyTo?: {
    id: string;
    author: string;
    content: string;
  };
}

/**
 * Discussion Node specific data
 * 讨论节点特有数据
 */
export interface DiscussionNodeData extends BaseNodeData {
  type: 'discussion';
  title: LabelI18n;
  topic: LabelI18n;
  status: 'active' | 'resolved' | 'archived';
  participants?: string[];
  comments?: DiscussionComment[];
}

// ============================================================
// Media Node Data - 媒体节点数据
// ============================================================

/**
 * Media type enumeration
 * 媒体类型枚举
 */
export type MediaType = 'image' | 'video' | 'audio' | 'file';

/**
 * Media Node specific data
 * 媒体节点特有数据
 */
export interface MediaNodeData extends BaseNodeData {
  type: 'media';
  title: LabelI18n;
  description?: LabelI18n;
  url: string;
  mediaType: MediaType;
  thumbnail?: string;
}

// ============================================================
// Note Node Data - 便签节点数据
// ============================================================

/**
 * Note color enumeration
 * 便签颜色枚举
 */
export type NoteColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple';

/**
 * Note Node specific data
 * 便签节点特有数据
 */
export interface NoteNodeData extends BaseNodeData {
  type: 'note';
  title: LabelI18n;
  content: LabelI18n;
  color: NoteColor;
  pinned?: boolean;
}

// ============================================================
// Union Type - 联合类型
// ============================================================

/**
 * Union type for all node data types
 * 所有节点数据类型的联合类型
 */
export type NodeData =
  | ProblemNodeData
  | ExperimentNodeData
  | ConclusionNodeData
  | DiscussionNodeData
  | MediaNodeData
  | NoteNodeData;

// ============================================================
// Type Guards - 类型守卫
// ============================================================

/**
 * Check if data has a type field
 * 检查数据是否有 type 字段
 */
function hasType(data: unknown): data is { type: string } {
  return typeof data === 'object' && data !== null && 'type' in data;
}

/**
 * Type guard for ProblemNodeData
 * ProblemNodeData 类型守卫
 */
export function isProblemNodeData(data: unknown): data is ProblemNodeData {
  if (!hasType(data)) return false;
  return data.type === 'problem';
}

/**
 * Type guard for ExperimentNodeData
 * ExperimentNodeData 类型守卫
 */
export function isExperimentNodeData(data: unknown): data is ExperimentNodeData {
  if (!hasType(data)) return false;
  return data.type === 'experiment';
}

/**
 * Type guard for ConclusionNodeData
 * ConclusionNodeData 类型守卫
 */
export function isConclusionNodeData(data: unknown): data is ConclusionNodeData {
  if (!hasType(data)) return false;
  return data.type === 'conclusion';
}

/**
 * Type guard for DiscussionNodeData
 * DiscussionNodeData 类型守卫
 */
export function isDiscussionNodeData(data: unknown): data is DiscussionNodeData {
  if (!hasType(data)) return false;
  return data.type === 'discussion';
}

/**
 * Type guard for MediaNodeData
 * MediaNodeData 类型守卫
 */
export function isMediaNodeData(data: unknown): data is MediaNodeData {
  if (!hasType(data)) return false;
  return data.type === 'media';
}

/**
 * Type guard for NoteNodeData
 * NoteNodeData 类型守卫
 */
export function isNoteNodeData(data: unknown): data is NoteNodeData {
  if (!hasType(data)) return false;
  return data.type === 'note';
}

/**
 * Narrow node data to specific type based on node type
 * 根据节点类型将节点数据窄化为特定类型
 */
export function narrowNodeData(
  data: BaseNodeData,
  nodeType: string
): NodeData | null {
  switch (nodeType) {
    case 'problem':
      return isProblemNodeData(data) ? data : null;
    case 'experiment':
      return isExperimentNodeData(data) ? data : null;
    case 'conclusion':
      return isConclusionNodeData(data) ? data : null;
    case 'discussion':
      return isDiscussionNodeData(data) ? data : null;
    case 'media':
      return isMediaNodeData(data) ? data : null;
    case 'note':
      return isNoteNodeData(data) ? data : null;
    default:
      return null;
  }
}

// ============================================================
// Helper Types - 辅助类型
// ============================================================

/**
 * Extract type-safe field from node data
 * 从节点数据中提取类型安全的字段
 */
export function getNodeField<T extends keyof NodeData>(
  data: BaseNodeData,
  field: T
): NodeData[T] | undefined {
  if (field in data) {
    return data[field] as NodeData[T];
  }
  return undefined;
}

/**
 * Get label value with fallback
 * 获取带回退的标签值
 */
export function getLabelValue(
  label: LabelI18n | undefined,
  locale: 'zh-CN' | 'zh' | 'en' = 'zh-CN'
): string | undefined {
  if (!label) return undefined;
  return label[locale] || label['zh-CN'] || label.zh || label.en || undefined;
}

/**
 * Type guard for LabelI18n
 * LabelI18n 类型守卫
 */
export function isLabelI18n(value: unknown): value is LabelI18n {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('zh-CN' in value || 'zh' in value || 'en' in value)
  );
}
