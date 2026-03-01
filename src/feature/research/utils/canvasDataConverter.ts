/**
 * Canvas Data Converter
 * 画布数据转换工具
 *
 * Converts between React Flow format and Backend API format
 * 在 React Flow 格式和后端 API 格式之间转换
 */

import type { Node, Edge } from 'reactflow';
import type {
  ResearchNode,
  ResearchEdge,
  ProblemNode,
  ExperimentNode,
  ConclusionNode,
  NoteNode,
} from '@/types/research';
import type {
  CreateNodeInput,
  CreateEdgeInput,
  ResearchNode as ApiNode,
  ResearchEdge as ApiEdge,
} from '@/lib/research.service';
import type {
  ProblemNodeData,
  ExperimentNodeData,
  ConclusionNodeData,
  DiscussionNodeData,
  MediaNodeData,
  NoteNodeData,
  BaseNodeData,
  getLabelValue,
} from '../types/node-data.types';

import type {
  ProblemNodeData,
  ExperimentNodeData,
  ConclusionNodeData,
  DiscussionNodeData,
  MediaNodeData,
  NoteNodeData,
  BaseNodeData,
} from '../types/node-data.types';

// =====================================================
// LabelI18n Helper
// =====================================================

/**
 * Helper to get Chinese label value
 * 获取中文标签值
 */
function getZhLabel(label: LabelI18n | undefined): string | undefined {
  if (!label) return undefined;
  return label['zh-CN'] || label.zh || undefined;
}

/**
 * Helper to get English label value
 * 获取英文标签值
 */
function getEnLabel(label: LabelI18n | undefined): string | undefined {
  if (!label) return undefined;
  return label.en || undefined;
}

// =====================================================
// Node Conversion - 节点转换
// =====================================================

/**
 * Convert React Flow Node to API format
 * 将 React Flow 节点转换为 API 格式
 */
export function nodeToApiFormat(
  node: Node<ResearchNode>,
  isNew: boolean = false
): Partial<CreateNodeInput> {
  const data = node.data as BaseNodeData;
  // Use data.type if available, otherwise fall back to node.type
  const nodeType = data.type || node.type;

  const baseInput: Partial<CreateNodeInput> = {
    position_x: node.position.x,
    position_y: node.position.y,
    title_zh: getZhLabel(data.title),
    title_en: getEnLabel(data.title),
  };

  // Handle different node types
  switch (nodeType) {
    case 'problem': {
      const problemData = data as ProblemNodeData;
      return {
        ...baseInput,
        type: 'problem',
        hypothesis_zh: getZhLabel(problemData.hypothesis),
        hypothesis_en: getEnLabel(problemData.hypothesis),
        description_zh: getZhLabel(problemData.description),
        description_en: getEnLabel(problemData.description),
        status: problemData.status,
        priority: problemData.priority,
        tags: problemData.tags,
      };
    }

    case 'experiment': {
      const experimentData = data as ExperimentNodeData;
      return {
        ...baseInput,
        type: 'experiment',
        description_zh: getZhLabel(experimentData.description),
        description_en: getEnLabel(experimentData.description),
        status: experimentData.status,
        simulation_config: experimentData.simulationConfig,
        result_snapshot: experimentData.resultSnapshot,
        linked_demo: experimentData.linkedDemo,
      };
    }

    case 'conclusion': {
      const conclusionData = data as ConclusionNodeData;
      return {
        ...baseInput,
        type: 'conclusion',
        description_zh: getZhLabel(conclusionData.description),
        description_en: getEnLabel(conclusionData.description),
        statement_zh: getZhLabel(conclusionData.statement),
        statement_en: getEnLabel(conclusionData.statement),
        confidence: conclusionData.confidence,
        evidence_ids: conclusionData.evidenceIds,
        limitations_zh: getZhLabel(conclusionData.limitations),
        limitations_en: getEnLabel(conclusionData.limitations),
        future_work_zh: getZhLabel(conclusionData.futureWork),
        future_work_en: getEnLabel(conclusionData.futureWork),
      };
    }

    case 'note': {
      const noteData = data as NoteNodeData;
      // Note type - 便签类型
      return {
        ...baseInput,
        type: 'note',
        content_zh: getZhLabel(noteData.content),
        content_en: getEnLabel(noteData.content),
        color: noteData.color,
        pinned: noteData.pinned,
      };
    }

    case 'discussion': {
      const discussionData = data as DiscussionNodeData;
      // Discussion type - 讨论类型
      return {
        ...baseInput,
        type: 'discussion',
        topic_zh: getZhLabel(discussionData.topic),
        topic_en: getEnLabel(discussionData.topic),
        status: discussionData.status,
        participants: discussionData.participants,
      };
    }

    case 'media': {
      const mediaData = data as MediaNodeData;
      // Media type - 媒体类型
      return {
        ...baseInput,
        type: 'media',
        media_url: mediaData.url,
        media_type: mediaData.mediaType,
        description_zh: getZhLabel(mediaData.description),
        description_en: getEnLabel(mediaData.description),
      };
    }

    default:
      // Default to problem type
      return {
        ...baseInput,
        type: 'problem',
      };
  }
}

/**
 * Convert API Node to React Flow format
 * 将 API 节点转换为 React Flow 格式
 */
export function apiToNodeFormat(apiNode: ApiNode): Node<ResearchNode> {
  const baseNode = {
    id: apiNode.id,
    position: { x: apiNode.position_x, y: apiNode.position_y },
    data: {
      id: apiNode.id,
      createdAt: apiNode.created_at,
      updatedAt: apiNode.updated_at,
      createdBy: apiNode.created_by,
      assignedTo: apiNode.assigned_to || [],
    } as BaseNodeData,
  };

  switch (apiNode.type) {
    case 'problem':
      return {
        ...baseNode,
        type: 'problem',
        data: {
          ...baseNode.data,
          type: 'problem',
          title: { 'zh-CN': apiNode.title_zh, en: apiNode.title_en },
          description: { 'zh-CN': apiNode.description_zh, en: apiNode.description_en },
          hypothesis: { 'zh-CN': apiNode.hypothesis_zh, en: apiNode.hypothesis_en },
          status: apiNode.status as 'open' | 'investigating' | 'answered',
          priority: apiNode.priority || 'medium',
          tags: apiNode.tags || [],
        } as ProblemNodeData,
      };

    case 'experiment':
      return {
        ...baseNode,
        type: 'experiment',
        data: {
          ...baseNode.data,
          type: 'experiment',
          title: { 'zh-CN': apiNode.title_zh, en: apiNode.title_en },
          description: { 'zh-CN': apiNode.description_zh, en: apiNode.description_en },
          status: apiNode.status as 'pending' | 'running' | 'completed' | 'failed',
          simulationConfig: apiNode.simulation_config,
          resultSnapshot: apiNode.result_snapshot,
          linkedDemo: apiNode.linked_demo,
        } as ExperimentNodeData,
      };

    case 'conclusion':
      return {
        ...baseNode,
        type: 'conclusion',
        data: {
          ...baseNode.data,
          type: 'conclusion',
          title: { 'zh-CN': apiNode.title_zh, en: apiNode.title_en },
          statement: { 'zh-CN': apiNode.statement_zh, en: apiNode.statement_en },
          confidence: apiNode.confidence || 0.5,
          evidenceIds: apiNode.evidence_ids || [],
          limitations: { 'zh-CN': apiNode.limitations_zh, en: apiNode.limitations_en },
          futureWork: { 'zh-CN': apiNode.future_work_zh, en: apiNode.future_work_en },
        } as ConclusionNodeData,
      };

    case 'discussion':
      return {
        ...baseNode,
        type: 'discussion',
        data: {
          ...baseNode.data,
          type: 'discussion',
          title: { 'zh-CN': apiNode.title_zh, en: apiNode.title_en },
          topic: { 'zh-CN': apiNode.topic_zh, en: apiNode.topic_en },
          status: apiNode.status as 'active' | 'resolved' | 'archived',
          participants: apiNode.participants || [],
        } as DiscussionNodeData,
      };

    case 'media':
      return {
        ...baseNode,
        type: 'media',
        data: {
          ...baseNode.data,
          type: 'media',
          title: { 'zh-CN': apiNode.title_zh, en: apiNode.title_en },
          description: { 'zh-CN': apiNode.description_zh, en: apiNode.description_en },
          url: apiNode.media_url,
          mediaType: apiNode.media_type as 'image' | 'video' | 'audio' | 'file',
        } as MediaNodeData,
      };

    case 'note':
      return {
        ...baseNode,
        type: 'note',
        data: {
          ...baseNode.data,
          type: 'note',
          title: { 'zh-CN': apiNode.title_zh, en: apiNode.title_en },
          content: { 'zh-CN': apiNode.content_zh, en: apiNode.content_en },
          color: apiNode.color || 'yellow',
          pinned: apiNode.pinned || false,
        } as NoteNodeData,
      };

    default:
      // Fallback to problem type
      return {
        ...baseNode,
        type: 'problem',
        data: {
          ...baseNode.data,
          type: 'problem',
          title: { 'zh-CN': apiNode.title_zh, en: apiNode.title_en },
          description: { 'zh-CN': apiNode.description_zh, en: apiNode.description_en },
          status: 'open',
          priority: 'medium',
          tags: [],
        } as ProblemNodeData,
      };
  }
}

// =====================================================
// Edge Conversion - 边转换
// =====================================================

/**
 * Convert React Flow Edge to API format
 * 将 React Flow 边转换为 API 格式
 */
export function edgeToApiFormat(edge: Edge<ResearchEdge>): Partial<CreateEdgeInput> {
  const data = edge.data;

  return {
    type: data?.type || 'relatedTo',
    source_node_id: edge.source,
    target_node_id: edge.target,
    label_zh: data?.label ? getZhLabel(data.label) : undefined,
    label_en: data?.label ? getEnLabel(data.label) : undefined,
    evidence_strength: data?.evidence?.strength,
    evidence_notes_zh: data?.evidence?.notes ? getZhLabel(data.evidence.notes) : undefined,
    evidence_notes_en: data?.evidence?.notes ? getEnLabel(data.evidence.notes) : undefined,
  };
}

/**
 * Convert API Edge to React Flow format
 * 将 API 边转换为 React Flow 格式
 */
export function apiToEdgeFormat(apiEdge: ApiEdge): Edge<ResearchEdge> {
  return {
    id: apiEdge.id,
    source: apiEdge.source_node_id,
    target: apiEdge.target_node_id,
    type: 'custom',  // Use 'custom' type to match registered edgeTypes
    data: {
      id: apiEdge.id,
      type: apiEdge.type,
      source: apiEdge.source_node_id,
      target: apiEdge.target_node_id,
      label: {
        'zh-CN': apiEdge.label_zh,
        en: apiEdge.label_en,
      },
      evidence: {
        strength: apiEdge.evidence_strength || undefined,
        notes: {
          'zh-CN': apiEdge.evidence_notes_zh,
          en: apiEdge.evidence_notes_en,
        },
      },
      createdAt: apiEdge.created_at,
      createdBy: apiEdge.created_by,
    } as ResearchEdge,
  };
}

// =====================================================
// Batch Conversion - 批量转换
// =====================================================

/**
 * Convert all nodes from API to React Flow format
 * 将所有 API 节点转换为 React Flow 格式
 */
export function apiNodesToFlowNodes(apiNodes: ApiNode[]): Node<ResearchNode>[] {
  return apiNodes.map(apiToNodeFormat);
}

/**
 * Convert all edges from API to React Flow format
 * 将所有 API 边转换为 React Flow 格式
 */
export function apiEdgesToFlowEdges(apiEdges: ApiEdge[]): Edge<ResearchEdge>[] {
  return apiEdges.map(apiToEdgeFormat);
}

// =====================================================
// Utility Functions - 工具函数
// =====================================================

// Node type prefixes used for temporary IDs
// 用于临时 ID 的节点类型前缀
const NODE_TYPE_PREFIXES = ['problem', 'experiment', 'conclusion', 'note', 'discussion', 'media'];

// UUID regex pattern (backend uses UUIDs)
// UUID 正则表达式（后端使用 UUID）
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a node ID is temporary (newly created)
 * 检查节点 ID 是否为临时（新创建的）
 */
export function isTemporaryId(id: string): boolean {
  // Check if it's a UUID (backend format)
  if (UUID_PATTERN.test(id)) {
    return false;
  }

  // Check for common temporary ID patterns
  // Note: 'e-' is used for edges (e-${source}-${target}-${timestamp})
  if (id.startsWith('temp-') || id.startsWith('node-') || id.startsWith('edge-') || id.startsWith('e-')) {
    return true;
  }

  // Check for node type prefixes (e.g., "problem-1234567890")
  for (const prefix of NODE_TYPE_PREFIXES) {
    if (id.startsWith(`${prefix}-`)) {
      return true;
    }
  }

  // Short IDs are likely temporary
  return id.length < 10;
}

/**
 * Generate a temporary ID for new nodes
 * 为新节点生成临时 ID
 */
export function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
