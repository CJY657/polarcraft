/**
 * PolarCraft Backend API Server
 * PolarCraft 后端 API 服务器
 *
 * Entry point for the authentication API
 * 认证 API 的入口点
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { config, validateConfig } from './config/index.js';
import { logger } from './utils/logger.js';
import { createPool, testConnection, closePool } from './database/connection.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiRateLimiter } from './middleware/rate-limit.middleware.js';
import { csrfProtection } from './middleware/csrf.middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// =====================================================
// Initialize Express App
// 初始化 Express 应用
// =====================================================

const app = express();

// =====================================================
// Configuration Validation
// 配置验证
// =====================================================

try {
  validateConfig();
} catch (error) {
  logger.error('Configuration validation failed:', error);
  process.exit(1);
}

// =====================================================
// Security Middleware
// 安全中间件
// =====================================================

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API / 为 API 禁用 CSP
  crossOriginEmbedderPolicy: false, // Allow embedding / 允许嵌入
}));

// CORS - Cross-Origin Resource Sharing
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser(config.security.cookieSecret));

// Trust proxy for rate limiting (behind nginx/cloudflare)
app.set('trust proxy', 1);

// Rate limiting
app.use('/api', apiRateLimiter);

// =====================================================
// Request Logging
// 请求日志记录
// =====================================================

app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  next();
});

// =====================================================
// Static File Serving
// 静态文件服务
// =====================================================

// Serve uploaded files statically
// 静态服务上传的文件
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../public/uploads'), {
    maxAge: '1d', // Cache for 1 day / 缓存 1 天
    etag: true,
    index: false, // Disable directory listing / 禁用目录列表
  })
);

// =====================================================
// API Routes
// API 路由
// =====================================================

app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'PolarCraft Authentication API',
      version: '1.0.0',
      status: 'running',
    },
  });
});

// =====================================================
// Error Handling
// 错误处理
// =====================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// =====================================================
// Server Startup
// 服务器启动
// =====================================================

async function startServer() {
  try {
    // Test database connection
    // 测试数据库连接
    logger.info('Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }
    logger.info('Database connection successful');

    // Create database connection pool
    // 创建数据库连接池
    createPool();

    // Start HTTP server
    // 启动 HTTP 服务器
    const server = app.listen(config.port, () => {
      logger.info('='.repeat(50));
      logger.info(`🚀 PolarCraft Authentication API Server`);
      logger.info(`📝 Environment: ${config.env}`);
      logger.info(`🌐 Server running on: http://localhost:${config.port}`);
      logger.info(`🔒 API Base URL: ${config.apiUrl}`);
      logger.info(`📊 Health check: http://localhost:${config.port}/api/health`);
      logger.info('='.repeat(50));
    });

    // Graceful shutdown
    // 优雅关闭
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close database connections
          // 关闭数据库连接
          await closePool();
          logger.info('Database connections closed');
        } catch (error) {
          logger.error('Error closing database connections:', error);
        }

        logger.info('Server shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      // 10 秒后强制关闭
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
// 启动服务器
startServer();
