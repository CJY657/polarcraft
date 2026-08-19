/**
 * CAPTCHA Service
 * 验证码服务
 *
 * Generates and validates SVG-based CAPTCHAs
 * 生成和验证基于 SVG 的验证码
 */

import svgCaptcha from 'svg-captcha';
import { config } from '../config/index.js';
import { CaptchaResponse } from '../types/auth.types.js';
import { logger } from '../utils/logger.js';

/**
 * Store for CAPTCHA codes (in production, use Redis)
 * 验证码存储（生产环境应使用 Redis）
 */
const captchaStore = new Map<string, { code: string; expires: number }>();

/**
 * Clean up expired CAPTCHAs periodically
 * 定期清理过期的验证码
 */
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of captchaStore.entries()) {
    if (data.expires < now) {
      captchaStore.delete(id);
    }
  }
}, 60 * 1000); // Clean up every minute / 每分钟清理一次

/**
 * CAPTCHA Service Class
 * 验证码服务类
 */
export class CaptchaService {
  /**
   * Generate a new CAPTCHA
 * 生成新的验证码
   */
  static generate(): CaptchaResponse {
    const captcha = svgCaptcha.create({
      size: config.captcha.length,
      width: config.captcha.width,
      height: config.captcha.height,
      ignoreChars: '0o1ilI', // Characters that are easily confused / 容易混淆的字符
      noise: 2, // Number of interference lines / 干扰线数量
      color: true,
      background: '#f0f0f0',
    });

    const id = Math.random().toString(36).substring(2, 15);
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes / 5 分钟

    captchaStore.set(id, {
      code: captcha.text.toLowerCase(),
      expires,
    });

    logger.debug(`CAPTCHA generated: ${id}`);

    return {
      id,
      dataUrl: `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`,
    };
  }

  /**
   * Verify a CAPTCHA
 * 验证验证码
   */
  static verify(id: string, code: string): boolean {
    const stored = captchaStore.get(id);

    if (!stored) {
      logger.debug(`CAPTCHA not found: ${id}`);
      return false;
    }

    if (stored.expires < Date.now()) {
      captchaStore.delete(id);
      logger.debug(`CAPTCHA expired: ${id}`);
      return false;
    }

    const isValid = stored.code === code.toLowerCase();
    if (isValid) {
      // Remove the CAPTCHA after successful verification
      // 验证成功后删除验证码
      captchaStore.delete(id);
      logger.debug(`CAPTCHA verified: ${id}`);
    } else {
      logger.debug(`CAPTCHA verification failed: ${id}`);
    }

    return isValid;
  }

}
