-- PolarCraft Profile and Application System - Database Migration
-- 个人资料和申请系统数据库迁移脚本

-- =====================================================
-- User Educations Table / 用户教育/工作经历表
-- =====================================================
CREATE TABLE IF NOT EXISTS user_educations (
    id CHAR(36) PRIMARY KEY COMMENT '记录唯一标识 (UUID)',
    user_id CHAR(36) NOT NULL COMMENT '用户ID',
    organization VARCHAR(255) NOT NULL COMMENT '学校/单位名称',
    major VARCHAR(255) NOT NULL COMMENT '专业/领域',
    start_date DATE NOT NULL COMMENT '开始年月',
    end_date DATE DEFAULT NULL COMMENT '结束年月，NULL表示至今',
    is_current BOOLEAN DEFAULT FALSE COMMENT '是否当前',
    degree_level VARCHAR(50) DEFAULT NULL COMMENT '学位级别 (bachelor/master/phd/other)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_organization (organization(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户教育/工作经历表';

-- =====================================================
-- Project Settings Table / 项目扩展设置表
-- =====================================================
CREATE TABLE IF NOT EXISTS research_project_settings (
    id CHAR(36) PRIMARY KEY COMMENT '设置唯一标识 (UUID)',
    project_id CHAR(36) NOT NULL COMMENT '项目ID',
    visibility ENUM('public', 'private', 'invite_only') DEFAULT 'private' COMMENT '项目可见性',
    require_approval BOOLEAN DEFAULT TRUE COMMENT '加入是否需要审批',
    recruitment_requirements TEXT COMMENT '招募要求描述',
    max_members INT DEFAULT NULL COMMENT '最大成员数，NULL表示无限制',
    recruitment_deadline DATE DEFAULT NULL COMMENT '招募截止日期',
    is_recruiting BOOLEAN DEFAULT TRUE COMMENT '是否正在招募',
    contact_email VARCHAR(255) DEFAULT NULL COMMENT '联系邮箱',
    discussion_channel VARCHAR(255) DEFAULT NULL COMMENT '讨论频道链接',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    FOREIGN KEY (project_id) REFERENCES research_projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_settings (project_id),
    INDEX idx_visibility (visibility),
    INDEX idx_recruiting (is_recruiting)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目扩展设置表';

-- =====================================================
-- Project Creator Profiles Table / 项目创建者资料表
-- =====================================================
CREATE TABLE IF NOT EXISTS research_project_creator_profiles (
    id CHAR(36) PRIMARY KEY COMMENT '资料唯一标识 (UUID)',
    project_id CHAR(36) NOT NULL COMMENT '项目ID',
    user_id CHAR(36) NOT NULL COMMENT '创建者用户ID',
    display_name VARCHAR(100) NOT NULL COMMENT '显示姓名',
    organization VARCHAR(255) NOT NULL COMMENT '单位',
    education_id CHAR(36) DEFAULT NULL COMMENT '关联的教育经历ID',
    major VARCHAR(255) DEFAULT NULL COMMENT '专业',
    grade VARCHAR(50) DEFAULT NULL COMMENT '年级',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    FOREIGN KEY (project_id) REFERENCES research_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (education_id) REFERENCES user_educations(id) ON DELETE SET NULL,
    UNIQUE KEY unique_creator_profile (project_id, user_id),
    INDEX idx_project (project_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目创建者资料表';

-- =====================================================
-- Project Applications Table / 项目申请表
-- =====================================================
CREATE TABLE IF NOT EXISTS research_project_applications (
    id CHAR(36) PRIMARY KEY COMMENT '申请唯一标识 (UUID)',
    project_id CHAR(36) NOT NULL COMMENT '项目ID',
    user_id CHAR(36) NOT NULL COMMENT '申请人用户ID',

    -- Application form data / 申请表单数据
    display_name VARCHAR(100) NOT NULL COMMENT '显示姓名',
    organization VARCHAR(255) NOT NULL COMMENT '单位',
    education_id CHAR(36) DEFAULT NULL COMMENT '关联的教育经历ID',
    major VARCHAR(255) DEFAULT NULL COMMENT '专业',
    grade VARCHAR(50) DEFAULT NULL COMMENT '年级',
    research_experience TEXT COMMENT '科研经历',
    expertise TEXT COMMENT '专长技能',
    motivation TEXT COMMENT '申请理由',

    -- Application status / 申请状态
    status ENUM('pending', 'approved', 'rejected', 'withdrawn') DEFAULT 'pending' COMMENT '申请状态',
    reviewed_by CHAR(36) DEFAULT NULL COMMENT '审核人用户ID',
    reviewed_at TIMESTAMP NULL COMMENT '审核时间',
    review_notes TEXT COMMENT '审核备注',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    FOREIGN KEY (project_id) REFERENCES research_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (education_id) REFERENCES user_educations(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_application (project_id, user_id),
    INDEX idx_project (project_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目申请表';
