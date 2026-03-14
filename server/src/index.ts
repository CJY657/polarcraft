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
import fs from 'fs';
import path from 'path';
import { config, validateConfig } from './config/index.js';
import { appPaths } from './config/paths.js';
import { logger } from './utils/logger.js';
import { ensureDirectoryWritable } from './utils/storage-health.util.js';
import { connectDatabase, testConnection, closeDatabase } from './database/connection.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiRateLimiter } from './middleware/rate-limit.middleware.js';
import { uploadConfig } from './config/upload.config.js';

const shouldServeFrontend = config.isProduction && fs.existsSync(appPaths.frontendIndexFile);

const app = express();

try {
  validateConfig();
} catch (error) {
  logger.error('Configuration validation failed:', error);
  process.exit(1);
}

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = new Set(config.cors.origins);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    logger.warn(`Blocked CORS origin: ${origin}`);
    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(config.security.cookieSecret));
app.set('trust proxy', 1);
app.use('/api', apiRateLimiter);

app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    cfRay: req.headers['cf-ray'],
  });
  next();
});

app.use(
  '/uploads',
  express.static(appPaths.uploadRootDir, {
    maxAge: '1d',
    etag: true,
    index: false,
  })
);

app.use('/api', routes);
app.use('/api', notFoundHandler);

if (shouldServeFrontend) {
  app.use(
    express.static(appPaths.frontendDistDir, {
      index: false,
      maxAge: '1h',
      etag: true,
    })
  );

  app.get('*', (req, res, next) => {
    if (
      req.method !== 'GET' ||
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads') ||
      path.extname(req.path) ||
      !req.accepts('html')
    ) {
      next();
      return;
    }

    res.sendFile(appPaths.frontendIndexFile);
  });
} else {
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
}

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    logger.info('Preparing upload storage...', {
      path: uploadConfig.uploadDir,
    });
    await ensureDirectoryWritable(uploadConfig.uploadDir);
    logger.info('Upload storage is writable', {
      path: uploadConfig.uploadDir,
    });

    logger.info('Testing MongoDB connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to MongoDB');
    }
    logger.info('MongoDB connection successful');

    await connectDatabase();

    const server = app.listen(config.port, () => {
      logger.info('='.repeat(50));
      logger.info('🚀 PolarCraft Authentication API Server');
      logger.info(`📝 Environment: ${config.env}`);
      logger.info(`🌐 Server running on: http://localhost:${config.port}`);
      logger.info(`🔒 API Base URL: ${config.apiUrl}`);
      if (shouldServeFrontend) {
        logger.info(`🖥️  Frontend served from: ${appPaths.frontendDistDir}`);
      }
      logger.info(`📁 Uploads served from: ${appPaths.uploadRootDir}`);
      logger.info(`📊 Health check: http://localhost:${config.port}/api/health`);
      logger.info('='.repeat(50));
    });

    server.keepAliveTimeout = config.http.keepAliveTimeoutMs;
    server.headersTimeout = config.http.headersTimeoutMs;
    server.requestTimeout = config.http.requestTimeoutMs;
    server.timeout = config.http.requestTimeoutMs;

    logger.info('HTTP server timeouts configured', {
      keepAliveTimeoutMs: server.keepAliveTimeout,
      headersTimeoutMs: server.headersTimeout,
      requestTimeoutMs: server.requestTimeout,
      socketTimeoutMs: server.timeout,
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await closeDatabase();
          logger.info('Database connections closed');
        } catch (error) {
          logger.error('Error closing database connections:', error);
        }

        logger.info('Server shutdown complete');
        process.exit(0);
      });

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

startServer();
