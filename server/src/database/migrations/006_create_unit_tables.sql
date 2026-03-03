-- PolarCraft Unit Management System - Database Migration
-- 单元管理系统数据库初始化脚本

-- =====================================================
-- Units Table / 单元表
-- =====================================================
CREATE TABLE IF NOT EXISTS units (
    id CHAR(36) PRIMARY KEY COMMENT '单元唯一标识 (UUID)',
    title_zh VARCHAR(255) NOT NULL COMMENT '单元标题（中文）',
    title_en VARCHAR(255) DEFAULT NULL COMMENT '单元标题（英文）',
    description_zh TEXT COMMENT '单元描述（中文）',
    description_en TEXT COMMENT '单元描述（英文）',
    cover_image VARCHAR(512) DEFAULT NULL COMMENT '单元封面图URL',
    color VARCHAR(20) DEFAULT '#3B82F6' COMMENT '单元主题色',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_sort (sort_order),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='单元表';

-- =====================================================
-- Unit Main Slides Table / 单元主课件表
-- =====================================================
CREATE TABLE IF NOT EXISTS unit_main_slides (
    id CHAR(36) PRIMARY KEY COMMENT '主课件唯一标识 (UUID)',
    unit_id CHAR(36) NOT NULL COMMENT '单元ID',
    url VARCHAR(512) NOT NULL COMMENT 'PDF URL',
    title_zh VARCHAR(255) COMMENT '标题（中文）',
    title_en VARCHAR(255) COMMENT '标题（英文）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    UNIQUE KEY unique_unit (unit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='单元主课件表';

-- =====================================================
-- Modify Courses Table / 修改课程表
-- =====================================================
-- 移除 unit_id 的唯一约束
ALTER TABLE courses DROP INDEX unique_unit_id;

-- 修改 unit_id 为可选的外键
ALTER TABLE courses MODIFY unit_id CHAR(36) DEFAULT NULL COMMENT '所属单元ID';

-- 添加外键约束
ALTER TABLE courses ADD CONSTRAINT fk_course_unit
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;
