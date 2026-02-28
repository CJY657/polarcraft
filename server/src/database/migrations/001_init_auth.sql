-- PolarCraft Authentication System - Database Migration
-- 用户认证系统数据库初始化脚本

-- =====================================================
-- 用户表 / Users Table
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY COMMENT '用户唯一标识 (UUID)',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT 'bcrypt 密码哈希（第二层加密）',
    client_salt VARCHAR(64) NOT NULL COMMENT '客户端哈希盐值（用于第一层SHA-256加密）',
    client_hash_algorithm VARCHAR(20) DEFAULT 'SHA-256' COMMENT '客户端哈希算法',
    role ENUM('user', 'admin') DEFAULT 'user' COMMENT '用户角色',
    avatar_url VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    is_active BOOLEAN DEFAULT TRUE COMMENT '账号是否激活',
    email VARCHAR(100) DEFAULT NULL COMMENT '邮箱（用于密码重置）',
    email_verified BOOLEAN DEFAULT FALSE COMMENT '邮箱是否验证',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',

    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =====================================================
-- 刷新令牌表 / Refresh Tokens Table
-- =====================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id CHAR(36) PRIMARY KEY COMMENT 'Token ID (UUID)',
    user_id CHAR(36) NOT NULL COMMENT '用户ID',
    token VARCHAR(500) NOT NULL COMMENT '加密的 refresh token',
    device_info VARCHAR(255) DEFAULT NULL COMMENT '设备信息',
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
    expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    revoked_at TIMESTAMP NULL COMMENT '撤销时间',

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token(100)),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='刷新令牌表';

-- =====================================================
-- 密码重置令牌表 / Password Reset Tokens Table
-- =====================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id CHAR(36) PRIMARY KEY COMMENT 'Token ID (UUID)',
    user_id CHAR(36) NOT NULL COMMENT '用户ID',
    token VARCHAR(255) UNIQUE NOT NULL COMMENT '重置令牌',
    expires_at TIMESTAMP NOT NULL COMMENT '过期时间（15分钟）',
    used_at TIMESTAMP NULL COMMENT '使用时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='密码重置令牌表';

-- =====================================================
-- 认证审计日志表 / Authentication Audit Logs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS auth_audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NULL COMMENT '用户ID',
    action ENUM('login', 'logout', 'register', 'password_change', 'password_reset', 'token_refresh') NOT NULL COMMENT '操作类型',
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
    user_agent VARCHAR(500) DEFAULT NULL COMMENT '用户代理',
    success BOOLEAN DEFAULT TRUE COMMENT '是否成功',
    failure_reason VARCHAR(255) DEFAULT NULL COMMENT '失败原因',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='认证审计日志表';

-- =====================================================
-- 清理过期数据的存储过程（可选）
-- Stored Procedure for Cleaning Expired Data (Optional)
-- =====================================================
DELIMITER //

CREATE PROCEDURE CleanExpiredTokens()
BEGIN
    -- 删除过期的刷新令牌
    DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked_at IS NOT NULL;

    -- 删除已使用或过期的密码重置令牌
    DELETE FROM password_reset_tokens WHERE used_at IS NOT NULL OR expires_at < NOW();

    -- 删除30天前的审计日志
    DELETE FROM auth_audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
END //

DELIMITER ;

-- 创建事件调度器（每天凌晨2点执行清理）
-- CREATE EVENT IF NOT EXISTS cleanup_tokens_event
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CONCAT(CURDATE() + INTERVAL 1 DAY, ' 02:00:00')
-- DO CALL CleanExpiredTokens();
