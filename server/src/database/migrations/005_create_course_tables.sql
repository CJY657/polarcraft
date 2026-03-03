-- PolarCraft Course Management System - Database Migration
-- 课程管理系统数据库初始化脚本

-- =====================================================
-- Courses Table / 课程表
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
    id CHAR(36) PRIMARY KEY COMMENT '课程唯一标识 (UUID)',
    unit_id VARCHAR(100) NOT NULL COMMENT '单元ID',
    title_zh VARCHAR(255) NOT NULL COMMENT '课程标题（中文）',
    title_en VARCHAR(255) DEFAULT NULL COMMENT '课程标题（英文）',
    description_zh TEXT COMMENT '课程描述（中文）',
    description_en TEXT COMMENT '课程描述（英文）',
    cover_image VARCHAR(512) DEFAULT NULL COMMENT '课程封面图URL',
    color VARCHAR(20) DEFAULT '#C9A227' COMMENT '课程颜色',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    UNIQUE KEY unique_unit_id (unit_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程表';

-- =====================================================
-- Course Main Slides Table / 课程主课件表
-- =====================================================
CREATE TABLE IF NOT EXISTS course_main_slides (
    id CHAR(36) PRIMARY KEY COMMENT '主课件唯一标识 (UUID)',
    course_id CHAR(36) NOT NULL COMMENT '课程ID',
    url VARCHAR(512) NOT NULL COMMENT 'PDF URL',
    title_zh VARCHAR(255) COMMENT '标题（中文）',
    title_en VARCHAR(255) COMMENT '标题（英文）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程主课件表';

-- =====================================================
-- Course Media Table / 课程媒体资源表
-- =====================================================
CREATE TABLE IF NOT EXISTS course_media (
    id CHAR(36) PRIMARY KEY COMMENT '媒体资源唯一标识 (UUID)',
    course_id CHAR(36) NOT NULL COMMENT '课程ID',
    type ENUM('pptx', 'image', 'video') NOT NULL COMMENT '媒体类型',
    url VARCHAR(512) NOT NULL COMMENT '媒体URL',
    title_zh VARCHAR(255) NOT NULL COMMENT '标题（中文）',
    title_en VARCHAR(255) DEFAULT NULL COMMENT '标题（英文）',
    duration INT DEFAULT NULL COMMENT '时长（秒，用于视频）',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course (course_id),
    INDEX idx_type (type),
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程媒体资源表';

-- =====================================================
-- Course Hyperlinks Table / 课程超链接表
-- =====================================================
CREATE TABLE IF NOT EXISTS course_hyperlinks (
    id CHAR(36) PRIMARY KEY COMMENT '超链接唯一标识 (UUID)',
    course_id CHAR(36) NOT NULL COMMENT '课程ID',
    page INT NOT NULL COMMENT 'PDF 页码（从 1 开始）',
    x DECIMAL(6, 5) NOT NULL COMMENT '中心点 X 坐标（0-1 比例）',
    y DECIMAL(6, 5) NOT NULL COMMENT '中心点 Y 坐标（0-1 比例）',
    width DECIMAL(6, 5) NOT NULL COMMENT '宽度（0-1 比例）',
    height DECIMAL(6, 5) NOT NULL COMMENT '高度（0-1 比例）',
    target_media_id CHAR(36) NOT NULL COMMENT '目标媒体ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (target_media_id) REFERENCES course_media(id) ON DELETE CASCADE,
    INDEX idx_course (course_id),
    INDEX idx_page (course_id, page)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程超链接表';
