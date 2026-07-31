/**
 * Safe localStorage wrapper with error handling 安全的 localStorage 包装器，带有错误处理
 * Handles cases where localStorage is disabled, quota exceeded, or private browsing modes 处理 localStorage 被禁用、配额超出或私人浏览模式的情况
 *
 * Provides get, set, remove functions with JSON support 提供带有 JSON 支持的获取、设置、删除功能
 */

import { logger } from "../lib/logger";

// In-memory fallback when localStorage is unavailable
const memoryStorage: Map<string, string> = new Map();

let localStorageAvailable: boolean | null = null;

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  if (localStorageAvailable !== null) return localStorageAvailable;

  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    localStorageAvailable = true;
  } catch {
    localStorageAvailable = false;
  }

  return localStorageAvailable;
}

/**
 * Safely get an item from storage
 */
export function getStorageItem(key: string): string | null {
  try {
    if (isLocalStorageAvailable()) {
      return localStorage.getItem(key);
    }
    return memoryStorage.get(key) ?? null;
  } catch (error) {
    logger.warn(`Failed to get storage item "${key}":`, error);
    return memoryStorage.get(key) ?? null;
  }
}

/**
 * Safely set an item in storage
 */
export function setStorageItem(key: string, value: string): boolean {
  try {
    if (isLocalStorageAvailable()) {
      localStorage.setItem(key, value);
    }
    memoryStorage.set(key, value);
    return true;
  } catch (error) {
    logger.warn(`Failed to set storage item "${key}":`, error);
    // Fallback to memory storage
    memoryStorage.set(key, value);
    return false;
  }
}
