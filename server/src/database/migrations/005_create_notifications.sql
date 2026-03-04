-- PolarCraft Notification System - Database Migration
-- 通知系统数据库迁移脚本

-- =====================================================
-- User Notifications Table / 用户通知表
-- =====================================================
CREATE TABLE IF NOT EXISTS user_notifications (
    id CHAR(36) PRIMARY KEY COMMENT '通知唯一标识 (UUID)',
    user_id CHAR(36) NOT NULL COMMENT '接收通知的用户ID',
    type ENUM('project_invite', 'application_approved', 'application_rejected', 'comment_reply', 'system') NOT NULL COMMENT '通知类型',
    title VARCHAR(255) NOT NULL COMMENT '通知标题',
    content TEXT COMMENT '通知内容',
    data JSON COMMENT '额外数据 (project_id, comment_id 等)',
    is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
    action_url VARCHAR(255) DEFAULT NULL COMMENT '点击跳转链接',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户通知表';
