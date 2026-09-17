/**
 * Logger Utility
 * 日志工具
 *
 * Simple logger inspired by the frontend logger pattern
 * 参考 frontend logger 模式的简单日志记录器
 */

import { config } from '../config/index.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const loggerConfig = {
  enabled: config.logging.enabled,
  minLevel: config.logging.level,
};

function shouldLog(level: LogLevel): boolean {
  return (
    loggerConfig.enabled &&
    LOG_LEVELS[level] >= LOG_LEVELS[loggerConfig.minLevel]
  );
}

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return `${prefix} ${message}`;
}

function log(level: LogLevel, message: string, ...args: unknown[]): void {
  if (shouldLog(level)) {
    console[level](formatMessage(level, message), ...args);
  }
}

export const logger = {
  debug: (message: string, ...args: unknown[]) => log('debug', message, ...args),
  info: (message: string, ...args: unknown[]) => log('info', message, ...args),
  warn: (message: string, ...args: unknown[]) => log('warn', message, ...args),
  error: (message: string, ...args: unknown[]) => log('error', message, ...args),
};
