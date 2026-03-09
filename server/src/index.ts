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
import { connectDatabase, testConnection, closeDatabase } from './database/connection.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiRateLimiter } from './middleware/rate-limit.middleware.js';
import { csrfProtection } from './middleware/csrf.middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

app.use(cors({
  origin: config.cors.origin,
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
  });
  next();
});

app.use(
  '/uploads',
  express.static(path.join(__dirname, '../public/uploads'), {
    maxAge: '1d',
    etag: true,
    index: false,
  })
);

app.use('/api', routes);

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

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
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
      logger.info(`📊 Health check: http://localhost:${config.port}/api/health`);
      logger.info('='.repeat(50));
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
