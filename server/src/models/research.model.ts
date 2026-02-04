/**
 * Research Model
 * 虚拟课题组数据模型
 */

import { query, queryOne } from "../database/connection.js";
import { generateId } from "../utils/crypto.util.js";
import { logger } from "../utils/logger.js";

/**
 * Research Model Class
 * 虚拟课题组模型类
 */
export class ResearchModel {
  // ============================================================
  // Projects / 项目
  // ============================================================

  /**
   * Get projects by user ID
   * 获取用户的项目列表
   */
  static async getUserProjects(userId: string): Promise<any[]> {
    const sql = `
      SELECT
        p.*,
        COUNT(DISTINCT pm.user_id) as member_count,
        COUNT(DISTINCT c.id) as canvas_count
      FROM research_projects p
      LEFT JOIN research_project_members pm ON p.id = pm.project_id
      LEFT JOIN research_canvases c ON p.id = c.project_id
      WHERE pm.user_id = ? OR p.is_public = TRUE
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `;
    return await query(sql, [userId]);
  }

  /**
   * Get project by ID
   * 获取项目详情
   */
  static async getProjectById(projectId: string): Promise<any | null> {
    const sql = `
      SELECT
        p.*,
        COUNT(DISTINCT pm.user_id) as member_count,
        COUNT(DISTINCT c.id) as canvas_count
      FROM research_projects p
      LEFT JOIN research_project_members pm ON p.id = pm.project_id
      LEFT JOIN research_canvases c ON p.id = c.project_id
      WHERE p.id = ?
      GROUP BY p.id
    `;
    return await queryOne(sql, [projectId]);
  }

  /**
   * Create project
   * 创建项目
   */
  static async createProject(data: any, ownerId: string): Promise<string> {
    const id = generateId();
    const sql = `
      INSERT INTO research_projects (
        id, name_zh, name_en, description_zh, description_en,
        thumbnail, status, is_public, allow_guest_comments, enable_task_board
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      id,
      data.name_zh,
      data.name_en || null,
      data.description_zh || null,
      data.description_en || null,
      data.thumbnail || null,
      data.status || "draft",
      data.is_public || false,
      data.allow_guest_comments || false,
      data.enable_task_board !== undefined ? data.enable_task_board : true,
    ]);

    // Add owner as member
    await this.addProjectMember(id, ownerId, "owner");

    logger.info(`Project created: ${id}`);
    return id;
  }

  /**
   * Update project
   * 更新项目
   */
  static async updateProject(projectId: string, data: any): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    const updatable = [
      "name_zh",
      "name_en",
      "description_zh",
      "description_en",
      "thumbnail",
      "status",
      "is_public",
      "allow_guest_comments",
      "enable_task_board",
      "default_canvas_id",
    ];

    for (const field of updatable) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (fields.length === 0) return false;

    params.push(projectId);
    const sql = `UPDATE research_projects SET ${fields.join(", ")} WHERE id = ?`;
    await query(sql, params);

    logger.info(`Project updated: ${projectId}`);
    return true;
  }

  /**
   * Delete project
   * 删除项目
   */
  static async deleteProject(projectId: string): Promise<boolean> {
    const sql = "DELETE FROM research_projects WHERE id = ?";
    await query(sql, [projectId]);
    logger.info(`Project deleted: ${projectId}`);
    return true;
  }

  /**
   * Add project member
   * 添加项目成员
   */
  static async addProjectMember(
    projectId: string,
    userId: string,
    role: string = "viewer",
  ): Promise<boolean> {
    const id = generateId();
    const sql = `
      INSERT INTO research_project_members (id, project_id, user_id, role)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE role = ?
    `;
    await query(sql, [id, projectId, userId, role, role]);
    logger.info(`Member added to project: ${projectId} - ${userId} as ${role}`);
    return true;
  }

  /**
   * Remove project member
   * 移除项目成员
   */
  static async removeProjectMember(projectId: string, userId: string): Promise<boolean> {
    const sql = "DELETE FROM research_project_members WHERE project_id = ? AND user_id = ?";
    await query(sql, [projectId, userId]);
    logger.info(`Member removed from project: ${projectId} - ${userId}`);
    return true;
  }

  /**
   * Get project members
   * 获取项目成员列表
   */
  static async getProjectMembers(projectId: string): Promise<any[]> {
    const sql = `
      SELECT pm.*, u.username, u.avatar_url
      FROM research_project_members pm
      LEFT JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
      ORDER BY pm.role, pm.joined_at
    `;
    return await query(sql, [projectId]);
  }

  // ============================================================
  // Canvases / 画布
  // ============================================================

  /**
   * Get canvases by project ID
   * 获取项目的画布列表
   */
  static async getProjectCanvases(projectId: string): Promise<any[]> {
    const sql = `
      SELECT
        c.*,
        COUNT(DISTINCT n.id) as node_count,
        COUNT(DISTINCT e.id) as edge_count
      FROM research_canvases c
      LEFT JOIN research_nodes n ON c.id = n.canvas_id
      LEFT JOIN research_edges e ON c.id = e.canvas_id
      WHERE c.project_id = ?
      GROUP BY c.id
      ORDER BY c.updated_at DESC
    `;
    return await query(sql, [projectId]);
  }

  /**
   * Get canvas by ID with nodes and edges
   * 获取画布详情（包含节点和边）
   */
  static async getCanvasById(canvasId: string): Promise<any | null> {
    // Get canvas
    const canvas = await queryOne("SELECT * FROM research_canvases WHERE id = ?", [canvasId]);

    if (!canvas) return null;

    // Get nodes
    const nodes = await query("SELECT * FROM research_nodes WHERE canvas_id = ?", [canvasId]);

    // Get edges
    const edges = await query("SELECT * FROM research_edges WHERE canvas_id = ?", [canvasId]);

    return {
      ...canvas,
      nodes,
      edges,
    };
  }

  /**
   * Create canvas
   * 创建画布
   */
  static async createCanvas(projectId: string, data: any): Promise<string> {
    const id = generateId();
    const sql = `
      INSERT INTO research_canvases (
        id, project_id, name_zh, name_en, description_zh, description_en, viewport_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      id,
      projectId,
      data.name_zh,
      data.name_en || null,
      data.description_zh || null,
      data.description_en || null,
      data.viewport_data ? JSON.stringify(data.viewport_data) : null,
    ]);

    logger.info(`Canvas created: ${id} in project ${projectId}`);
    return id;
  }

  /**
   * Update canvas
   * 更新画布
   */
  static async updateCanvas(canvasId: string, data: any): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    const updatable = ["name_zh", "name_en", "description_zh", "description_en", "viewport_data"];

    for (const field of updatable) {
      if (data[field] !== undefined) {
        const value = field === "viewport_data" ? JSON.stringify(data[field]) : data[field];
        fields.push(`${field} = ?`);
        params.push(value);
      }
    }

    if (fields.length === 0) return false;

    params.push(canvasId);
    const sql = `UPDATE research_canvases SET ${fields.join(", ")}, last_opened_at = NOW() WHERE id = ?`;
    await query(sql, params);

    logger.info(`Canvas updated: ${canvasId}`);
    return true;
  }

  /**
   * Delete canvas
   * 删除画布
   */
  static async deleteCanvas(canvasId: string): Promise<boolean> {
    const sql = "DELETE FROM research_canvases WHERE id = ?";
    await query(sql, [canvasId]);
    logger.info(`Canvas deleted: ${canvasId}`);
    return true;
  }

  // ============================================================
  // Nodes / 节点
  // ============================================================

  /**
   * Get node by ID
   * 获取节点详情
   */
  static async getNodeById(nodeId: string): Promise<any | null> {
    return await queryOne("SELECT * FROM research_nodes WHERE id = ?", [nodeId]);
  }

  /**
   * Create node
   * 创建节点
   */
  static async createNode(canvasId: string, data: any, createdBy: string): Promise<string> {
    const id = generateId();
    const sql = `
      INSERT INTO research_nodes (
        id, canvas_id, type, position_x, position_y,
        title_zh, title_en, description_zh, description_en, status,
        created_by, assigned_to
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      id,
      canvasId,
      data.type,
      data.position.x,
      data.position.y,
      data.title_zh,
      data.title_en || null,
      data.description_zh || null,
      data.description_en || null,
      data.status || null,
      createdBy,
      data.assigned_to ? JSON.stringify(data.assigned_to) : null,
    ]);

    // Add type-specific fields
    await this.updateNode(id, data);

    logger.info(`Node created: ${id} of type ${data.type}`);
    return id;
  }

  /**
   * Update node
   * 更新节点
   */
  static async updateNode(nodeId: string, data: any): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    // Common fields
    const commonFields = [
      "title_zh",
      "title_en",
      "description_zh",
      "description_en",
      "status",
      "position_x",
      "position_y",
    ];

    for (const field of commonFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    // Type-specific fields (JSON)
    const jsonFields = [
      "hypothesis_zh",
      "hypothesis_en",
      "tags",
      "simulation_config",
      "result_snapshot",
      "authors",
      "key_findings_zh",
      "key_findings_en",
      "data_values",
      "evidence_ids",
      "statement_zh",
      "statement_en",
      "limitations_zh",
      "limitations_en",
      "future_work_zh",
      "future_work_en",
      "assigned_to",
    ];

    for (const field of jsonFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(typeof data[field] === "string" ? data[field] : JSON.stringify(data[field]));
      }
    }

    // Numeric fields
    const numericFields = ["priority", "year", "confidence", "uncertainty"];

    for (const field of numericFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    // String fields
    const stringFields = ["doi", "url", "pdf_url", "unit", "linked_demo", "source_node_id"];

    for (const field of stringFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (fields.length === 0) return false;

    params.push(nodeId);
    const sql = `UPDATE research_nodes SET ${fields.join(", ")} WHERE id = ?`;
    await query(sql, params);

    logger.info(`Node updated: ${nodeId}`);
    return true;
  }

  /**
   * Delete node
   * 删除节点
   */
  static async deleteNode(nodeId: string): Promise<boolean> {
    const sql = "DELETE FROM research_nodes WHERE id = ?";
    await query(sql, [nodeId]);
    logger.info(`Node deleted: ${nodeId}`);
    return true;
  }

  // ============================================================
  // Edges / 边（关系）
  // ============================================================

  /**
   * Create edge
   * 创建边
   */
  static async createEdge(canvasId: string, data: any, createdBy: string): Promise<string> {
    const id = generateId();
    const sql = `
      INSERT INTO research_edges (
        id, canvas_id, type, source_node_id, target_node_id,
        label_zh, label_en, evidence_strength,
        evidence_notes_zh, evidence_notes_en, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      id,
      canvasId,
      data.type,
      data.source,
      data.target,
      data.label_zh || null,
      data.label_en || null,
      data.evidence?.strength || null,
      data.evidence?.notes_zh || null,
      data.evidence?.notes_en || null,
      createdBy,
    ]);

    logger.info(`Edge created: ${id} of type ${data.type}`);
    return id;
  }

  /**
   * Update edge
   * 更新边
   */
  static async updateEdge(edgeId: string, data: any): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    const updatable = [
      "type",
      "label_zh",
      "label_en",
      "evidence_strength",
      "evidence_notes_zh",
      "evidence_notes_en",
    ];

    for (const field of updatable) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (fields.length === 0) return false;

    params.push(edgeId);
    const sql = `UPDATE research_edges SET ${fields.join(", ")} WHERE id = ?`;
    await query(sql, params);

    logger.info(`Edge updated: ${edgeId}`);
    return true;
  }

  /**
   * Delete edge
   * 删除边
   */
  static async deleteEdge(edgeId: string): Promise<boolean> {
    const sql = "DELETE FROM research_edges WHERE id = ?";
    await query(sql, [edgeId]);
    logger.info(`Edge deleted: ${edgeId}`);
    return true;
  }

  // ============================================================
  // Comments / 评论
  // ============================================================

  /**
   * Get comments for node
   * 获取节点评论
   */
  static async getNodeComments(nodeId: string): Promise<any[]> {
    const sql = `
      SELECT c.*, u.username, u.avatar_url
      FROM research_node_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.node_id = ?
      ORDER BY c.created_at ASC
    `;
    return await query(sql, [nodeId]);
  }

  /**
   * Add comment
   * 添加评论
   */
  static async addComment(nodeId: string, userId: string, content: string): Promise<string> {
    const id = generateId();
    const sql = `
      INSERT INTO research_node_comments (id, node_id, user_id, content)
      VALUES (?, ?, ?, ?)
    `;
    await query(sql, [id, nodeId, userId, content]);
    logger.info(`Comment added to node: ${nodeId}`);
    return id;
  }

  /**
   * Update comment
   * 更新评论
   */
  static async updateComment(commentId: string, userId: string, content: string): Promise<boolean> {
    const sql = `
      UPDATE research_node_comments
      SET content = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `;
    await query(sql, [content, commentId, userId]);
    logger.info(`Comment updated: ${commentId}`);
    return true;
  }

  /**
   * Delete comment
   * 删除评论
   */
  static async deleteComment(commentId: string): Promise<boolean> {
    const sql = "DELETE FROM research_node_comments WHERE id = ?";
    await query(sql, [commentId]);
    logger.info(`Comment deleted: ${commentId}`);
    return true;
  }

  // ============================================================
  // Activity Log / 活动日志
  // ============================================================

  /**
   * Log activity
   * 记录活动
   */
  static async logActivity(
    projectId: string,
    userId: string,
    action: string,
    targetType: string,
    targetId: string,
    changes?: any,
  ): Promise<string> {
    const id = generateId();
    const sql = `
      INSERT INTO research_activity_log (
        id, project_id, user_id, action, target_type, target_id, changes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      id,
      projectId,
      userId,
      action,
      targetType,
      targetId,
      changes ? JSON.stringify(changes) : null,
    ]);
    return id;
  }

  /**
   * Get project activity
   * 获取项目活动日志
   */
  static async getProjectActivity(projectId: string, limit: number = 50): Promise<any[]> {
    const sql = `
      SELECT a.*, u.username, u.avatar_url
      FROM research_activity_log a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.project_id = ?
      ORDER BY a.created_at DESC
      LIMIT ?
    `;
    return await query(sql, [projectId, limit]);
  }

  // ============================================================
  // Task Board / 任务看板
  // ============================================================

  /**
   * Get task board data
   * 获取任务看板数据
   */
  static async getTaskBoard(projectId: string): Promise<any> {
    // Get all canvases in project
    const canvases = await query("SELECT id FROM research_canvases WHERE project_id = ?", [
      projectId,
    ]);

    const canvasIds = canvases.map((c: any) => c.id);
    if (canvasIds.length === 0) return { columns: [] };

    // Get nodes grouped by status
    const nodes = await query(
      `SELECT status, id, title_zh, type, assigned_to
       FROM research_nodes
       WHERE canvas_id IN (${canvasIds.map(() => "?").join(",")})
       AND status IS NOT NULL`,
      canvasIds,
    );

    // Group by status
    const columns: any = {};
    nodes.forEach((node: any) => {
      if (!columns[node.status]) {
        columns[node.status] = [];
      }
      columns[node.status].push(node.id);
    });

    return {
      columns: Object.entries(columns).map(([status, nodes]) => ({
        status,
        nodes,
      })),
    };
  }
}
