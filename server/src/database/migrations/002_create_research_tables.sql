-- PolarCraft Virtual Research Group System - Database Migration
-- 虚拟课题组系统数据库初始化脚本

-- =====================================================
-- Research Projects Table / 研究项目表
-- =====================================================
CREATE TABLE IF NOT EXISTS research_projects (
    id CHAR(36) PRIMARY KEY COMMENT '项目唯一标识 (UUID)',
    name_zh VARCHAR(255) NOT NULL COMMENT '项目名称（中文）',
    name_en VARCHAR(255) DEFAULT NULL COMMENT '项目名称（英文）',
    description_zh TEXT COMMENT '项目描述（中文）',
    description_en TEXT COMMENT '项目描述（英文）',
    thumbnail VARCHAR(512) DEFAULT NULL COMMENT '项目缩略图URL',
    status ENUM('draft', 'active', 'completed', 'archived') DEFAULT 'draft' COMMENT '项目状态',
    is_public BOOLEAN DEFAULT FALSE COMMENT '是否公开',
    allow_guest_comments BOOLEAN DEFAULT FALSE COMMENT '是否允许游客评论',
    enable_task_board BOOLEAN DEFAULT TRUE COMMENT '是否启用任务看板',
    default_canvas_id CHAR(36) DEFAULT NULL COMMENT '默认画布ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_status (status),
    INDEX idx_is_public (is_public),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='研究项目表';

-- =====================================================
-- Project Members Table / 项目成员表
-- =====================================================
CREATE TABLE IF NOT EXISTS research_project_members (
    id CHAR(36) PRIMARY KEY COMMENT '成员记录ID (UUID)',
    project_id CHAR(36) NOT NULL COMMENT '项目ID',
    user_id CHAR(36) NOT NULL COMMENT '用户ID',
    role ENUM('owner', 'admin', 'editor', 'viewer') DEFAULT 'viewer' COMMENT '成员角色',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',

    FOREIGN KEY (project_id) REFERENCES research_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_membership (project_id, user_id),
    INDEX idx_user_projects (user_id, project_id),
    INDEX idx_project_members (project_id, role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目成员表';

-- =====================================================
-- Research Canvases Table / 研究画布表
-- =====================================================
CREATE TABLE IF NOT EXISTS research_canvases (
    id CHAR(36) PRIMARY KEY COMMENT '画布唯一标识 (UUID)',
    project_id CHAR(36) NOT NULL COMMENT '所属项目ID',
    name_zh VARCHAR(255) NOT NULL COMMENT '画布名称（中文）',
    name_en VARCHAR(255) DEFAULT NULL COMMENT '画布名称（英文）',
    description_zh TEXT COMMENT '画布描述（中文）',
    description_en TEXT COMMENT '画布描述（英文）',
    viewport_data JSON COMMENT '视口数据 {x, y, zoom}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    last_opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后打开时间',

    FOREIGN KEY (project_id) REFERENCES research_projects(id) ON DELETE CASCADE,
    INDEX idx_project (project_id),
    INDEX idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='研究画布表';

-- =====================================================
-- Research Nodes Table / 研究节点表
-- =====================================================
CREATE TABLE IF NOT EXISTS research_nodes (
    id CHAR(36) PRIMARY KEY COMMENT '节点唯一标识 (UUID)',
    canvas_id CHAR(36) NOT NULL COMMENT '所属画布ID',
    type ENUM('problem', 'experiment', 'conclusion') NOT NULL COMMENT '节点类型',
    position_x DECIMAL(10, 2) NOT NULL COMMENT 'X坐标',
    position_y DECIMAL(10, 2) NOT NULL COMMENT 'Y坐标',

    -- Common fields / 通用字段
    title_zh VARCHAR(255) COMMENT '标题（中文）',
    title_en VARCHAR(255) COMMENT '标题（英文）',
    description_zh TEXT COMMENT '描述（中文）',
    description_en TEXT COMMENT '描述（英文）',
    status VARCHAR(50) COMMENT '状态',
    created_by CHAR(36) NOT NULL COMMENT '创建者用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    assigned_to JSON COMMENT '分配给的用户ID数组',

    -- Problem-specific / 问题节点专用
    hypothesis_zh TEXT COMMENT '假设（中文）',
    hypothesis_en TEXT COMMENT '假设（英文）',
    priority ENUM('low', 'medium', 'high') COMMENT '优先级',
    tags JSON COMMENT '标签数组',

    -- Experiment-specific / 实验节点专用
    simulation_config JSON COMMENT '仿真配置',
    result_snapshot JSON COMMENT '结果快照',
    linked_demo VARCHAR(100) COMMENT '关联的演示ID',

    -- Conclusion-specific / 结论节点专用
    statement_zh TEXT COMMENT '陈述（中文）',
    statement_en TEXT COMMENT '陈述（英文）',
    confidence DECIMAL(3, 2) COMMENT '置信度 (0.00-1.00)',
    evidence_ids JSON COMMENT '证据节点ID数组',
    limitations_zh TEXT COMMENT '局限性（中文）',
    limitations_en TEXT COMMENT '局限性（英文）',
    future_work_zh TEXT COMMENT '未来工作（中文）',
    future_work_en TEXT COMMENT '未来工作（英文）',

    FOREIGN KEY (canvas_id) REFERENCES research_canvases(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_canvas (canvas_id),
    INDEX idx_type (type),
    INDEX idx_position (position_x, position_y),
    INDEX idx_status (status),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='研究节点表';

-- =====================================================
-- Research Edges Table / 研究边（关系）表
-- =====================================================
CREATE TABLE IF NOT EXISTS research_edges (
    id CHAR(36) PRIMARY KEY COMMENT '边唯一标识 (UUID)',
    canvas_id CHAR(36) NOT NULL COMMENT '所属画布ID',
    type ENUM('derivesTo', 'verifies', 'refutes', 'cites', 'basedOn', 'relatedTo') NOT NULL COMMENT '关系类型',
    source_node_id CHAR(36) NOT NULL COMMENT '源节点ID',
    target_node_id CHAR(36) NOT NULL COMMENT '目标节点ID',
    label_zh VARCHAR(255) COMMENT '标签（中文）',
    label_en VARCHAR(255) COMMENT '标签（英文）',
    evidence_strength DECIMAL(3, 2) COMMENT '证据强度 (0.00-1.00)',
    evidence_notes_zh TEXT COMMENT '证据备注（中文）',
    evidence_notes_en TEXT COMMENT '证据备注（英文）',
    created_by CHAR(36) NOT NULL COMMENT '创建者用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    FOREIGN KEY (canvas_id) REFERENCES research_canvases(id) ON DELETE CASCADE,
    FOREIGN KEY (source_node_id) REFERENCES research_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_node_id) REFERENCES research_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_canvas (canvas_id),
    INDEX idx_nodes (source_node_id, target_node_id),
    INDEX idx_type (type),
    INDEX idx_source (source_node_id),
    INDEX idx_target (target_node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='研究边表';

-- =====================================================
-- Node Comments Table / 节点评论表
-- =====================================================
CREATE TABLE IF NOT EXISTS research_node_comments (
    id CHAR(36) PRIMARY KEY COMMENT '评论唯一标识 (UUID)',
    node_id CHAR(36) NOT NULL COMMENT '节点ID',
    user_id CHAR(36) NOT NULL COMMENT '用户ID',
    content TEXT NOT NULL COMMENT '评论内容',
    resolved BOOLEAN DEFAULT FALSE COMMENT '是否已解决',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    FOREIGN KEY (node_id) REFERENCES research_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_node (node_id),
    INDEX idx_resolved (resolved),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='节点评论表';

-- =====================================================
-- Activity Log Table / 活动日志表
-- =====================================================
CREATE TABLE IF NOT EXISTS research_activity_log (
    id CHAR(36) PRIMARY KEY COMMENT '日志唯一标识 (UUID)',
    project_id CHAR(36) NOT NULL COMMENT '项目ID',
    canvas_id CHAR(36) COMMENT '画布ID',
    user_id CHAR(36) NOT NULL COMMENT '用户ID',
    action VARCHAR(50) NOT NULL COMMENT '操作类型',
    target_type VARCHAR(20) NOT NULL COMMENT '目标类型',
    target_id CHAR(36) NOT NULL COMMENT '目标ID',
    changes JSON COMMENT '变更内容',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    FOREIGN KEY (project_id) REFERENCES research_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_project (project_id),
    INDEX idx_canvas (canvas_id),
    INDEX idx_user (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动日志表';
