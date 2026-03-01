/**
 * Email Service
 * 邮件服务
 *
 * Handles sending emails using Nodemailer
 * 使用 Nodemailer 处理邮件发送
 */

import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Email Service Class
 * 邮件服务类
 */
export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email transporter
   * 初始化邮件传输器
   */
  private static getTransporter(): nodemailer.Transporter | null {
    if (!config.email.enabled) {
      return null;
    }

    if (this.transporter) {
      return this.transporter;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
      });

      logger.info('Email transporter initialized');
      return this.transporter;
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      return null;
    }
  }

  /**
   * Send an email
   * 发送邮件
   */
  static async sendEmail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<boolean> {
    const transporter = this.getTransporter();

    if (!transporter) {
      logger.warn('Email service is disabled or not configured');
      return false;
    }

    try {
      const info = await transporter.sendMail({
        from: `"${config.email.fromName}" <${config.email.from}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   * 发送密码重置邮件
   */
  static async sendPasswordResetEmail(
    email: string,
    username: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    const subject = 'PolarCraft 密码重置 | Password Reset';
    const text = `
你好 ${username}，

您请求重置 PolarCraft 账户的密码。

请点击以下链接重置您的密码：
${resetUrl}

此链接将在 30 分钟后过期。

如果您没有请求重置密码，请忽略此邮件。

---
Hello ${username},

You have requested to reset your PolarCraft account password.

Please click the following link to reset your password:
${resetUrl}

This link will expire in 30 minutes.

If you did not request a password reset, please ignore this email.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #2c3e50; }
    .button { display: inline-block; padding: 12px 24px; background-color: #3498db; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .button:hover { background-color: #2980b9; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <h1>PolarCraft 密码重置 | Password Reset</h1>

  <p>你好 <strong>${username}</strong>，</p>
  <p>Hello <strong>${username}</strong>,</p>

  <p>您请求重置 PolarCraft 账户的密码。</p>
  <p>You have requested to reset your PolarCraft account password.</p>

  <p>请点击以下按钮重置您的密码：</p>
  <p>Please click the following button to reset your password:</p>

  <a href="${resetUrl}" class="button">重置密码 | Reset Password</a>

  <p>或者复制此链接到浏览器：</p>
  <p>Or copy this link to your browser:</p>
  <p style="word-break: break-all; color: #3498db;">${resetUrl}</p>

  <p><strong>此链接将在 30 分钟后过期。</strong></p>
  <p><strong>This link will expire in 30 minutes.</strong></p>

  <p>如果您没有请求重置密码，请忽略此邮件。</p>
  <p>If you did not request a password reset, please ignore this email.</p>

  <div class="footer">
    <p>© ${new Date().getFullYear()} PolarCraft. 偏振光下新世界 | A New World Through Polarized Light</p>
  </div>
</body>
</html>
    `.trim();

    return await this.sendEmail({
      to: email,
      subject,
      text,
      html,
    });
  }

  /**
   * Test email configuration
   * 测试邮件配置
   */
  static async testConnection(): Promise<boolean> {
    const transporter = this.getTransporter();

    if (!transporter) {
      logger.warn('Email service is disabled or not configured');
      return false;
    }

    try {
      await transporter.verify();
      logger.info('Email server connection verified');
      return true;
    } catch (error) {
      logger.error('Email server connection failed:', error);
      return false;
    }
  }
}
