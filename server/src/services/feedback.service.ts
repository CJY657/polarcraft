import { config } from '../config/index.js';
import { FeedbackModel } from '../models/feedback.model.js';
import type {
  CreateFeedbackInput,
  FeedbackCategory,
  FeedbackEmailStatus,
  FeedbackSubmission,
  FeedbackSubmissionResult,
} from '../types/feedback.types.js';
import { EmailService } from './email.service.js';
import { logger } from '../utils/logger.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatValue(value: string | null | undefined): string {
  return value?.trim() || '未提供';
}

function resolveRecipient(category: FeedbackCategory): string | null {
  if (category === 'experiment') {
    return config.feedback.experimentRecipient || config.feedback.defaultRecipient || null;
  }

  if (category === 'product') {
    return config.feedback.productRecipient || config.feedback.defaultRecipient || null;
  }

  return config.feedback.defaultRecipient || null;
}

function buildEmailPayload(input: CreateFeedbackInput, recipient: string) {
  const categoryLabel = input.category === 'experiment' ? '实验反馈' : '软件建议';
  const scopedTitle = input.category === 'experiment'
    ? formatValue(input.course_title || input.course_id)
    : 'PolarCraft 平台';
  const subject = `[${categoryLabel}] ${input.subject}`;

  const text = [
    `${categoryLabel}`,
    '',
    `主题: ${input.subject}`,
    `实验: ${scopedTitle}`,
    `来源页面: ${formatValue(input.source_page)}`,
    `页面路径: ${formatValue(input.page_path)}`,
    `提交用户: ${formatValue(input.username)}`,
    `用户ID: ${formatValue(input.user_id)}`,
    `用户角色: ${formatValue(input.user_role)}`,
    `联系人: ${formatValue(input.contact_name)}`,
    `联系邮箱: ${formatValue(input.contact_email)}`,
    `IP: ${formatValue(input.ip_address)}`,
    `User-Agent: ${formatValue(input.user_agent)}`,
    '',
    '反馈内容:',
    input.content,
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.65; color: #1f2937; max-width: 760px; margin: 0 auto; padding: 24px;">
      <h1 style="margin: 0 0 16px; font-size: 24px; color: #0f172a;">${escapeHtml(categoryLabel)}</h1>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tbody>
          ${[
            ['主题', input.subject],
            ['实验', scopedTitle],
            ['来源页面', formatValue(input.source_page)],
            ['页面路径', formatValue(input.page_path)],
            ['提交用户', formatValue(input.username)],
            ['用户ID', formatValue(input.user_id)],
            ['用户角色', formatValue(input.user_role)],
            ['联系人', formatValue(input.contact_name)],
            ['联系邮箱', formatValue(input.contact_email)],
            ['IP', formatValue(input.ip_address)],
            ['User-Agent', formatValue(input.user_agent)],
            ['接收邮箱', recipient],
          ]
            .map(
              ([label, value]) => `
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e5e7eb; width: 120px; background: #f8fafc; font-weight: 600;">${escapeHtml(label)}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(value)}</td>
                </tr>`,
            )
            .join('')}
        </tbody>
      </table>
      <div style="padding: 16px 18px; border-radius: 16px; background: #f8fafc; border: 1px solid #e5e7eb; white-space: pre-wrap;">${escapeHtml(input.content)}</div>
    </div>
  `.trim();

  return {
    subject,
    text,
    html,
    replyTo: input.contact_email?.trim() || undefined,
  };
}

export class FeedbackService {
  static async submitFeedback(input: CreateFeedbackInput): Promise<FeedbackSubmissionResult> {
    const recipient = resolveRecipient(input.category);

    const savedFeedback = await FeedbackModel.create({
      category: input.category,
      subject: input.subject,
      content: input.content,
      course_id: input.course_id || null,
      course_title: input.course_title || null,
      source_page: input.source_page || null,
      page_path: input.page_path || null,
      contact_name: input.contact_name || null,
      contact_email: input.contact_email || null,
      user_id: input.user_id || null,
      username: input.username || null,
      user_role: input.user_role || null,
      recipient_email: recipient,
      email_status: 'not_configured',
      email_sent_at: null,
      ip_address: input.ip_address || null,
      user_agent: input.user_agent || null,
    });

    let emailStatus: FeedbackEmailStatus = 'not_configured';

    if (recipient && EmailService.isEnabled()) {
      const payload = buildEmailPayload(input, recipient);
      const emailSent = await EmailService.sendEmail({
        to: recipient,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        replyTo: payload.replyTo,
      });

      emailStatus = emailSent ? 'sent' : 'failed';
      await FeedbackModel.updateEmailDelivery(
        savedFeedback.id,
        emailStatus,
        recipient,
        emailSent ? new Date() : null,
      );
    }

    logger.info(
      `Feedback submitted: ${savedFeedback.id} (${input.category}) email=${emailStatus} recipient=${recipient || 'none'}`,
    );

    return {
      id: savedFeedback.id,
      emailStatus,
    };
  }
}
