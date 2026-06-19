import { config } from '../config/index.js';

export const RESEARCH_AGENT_SYSTEM_PROMPT =
  'You are PolarCraft’s virtual research-group advisor. Help students clarify research questions, design next experiments, summarize uncertainty, and suggest next steps. Only answer questions related to the current research project, polarization/optics learning, lab work, or course-appropriate research planning. If asked for unrelated tasks, politely refuse and redirect the user back to research-project help. Do not claim experiments were performed. Do not modify project data. Be concise and course/lab appropriate.';

export type ResearchAgentRole = 'system' | 'user' | 'assistant';

export interface ResearchAgentChatMessage {
  role: ResearchAgentRole;
  content: string;
}

export interface ResearchAgentCompletion {
  content: string;
  model: string;
  usage?: Record<string, unknown>;
}

export class ResearchAgentDisabledError extends Error {
  statusCode = 503;
  code = 'AI_ADVISOR_DISABLED';

  constructor() {
    super('AI 顾问尚未配置');
    this.name = 'ResearchAgentDisabledError';
  }
}

export class ResearchAgentUpstreamError extends Error {
  statusCode = 502;
  code = 'AI_PROVIDER_ERROR';

  constructor() {
    super('AI 顾问暂时不可用，请稍后重试');
    this.name = 'ResearchAgentUpstreamError';
  }
}

type ChatCompletionResponse = {
  model?: unknown;
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  usage?: Record<string, unknown>;
};

export class ResearchAgentService {
  static isEnabled(): boolean {
    return Boolean(config.ai.apiBaseUrl && config.ai.apiKey && config.ai.model);
  }

  static async createChatCompletion(messages: ResearchAgentChatMessage[]): Promise<ResearchAgentCompletion> {
    if (!this.isEnabled()) {
      throw new ResearchAgentDisabledError();
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.ai.requestTimeoutMs);

    try {
      const body: Record<string, unknown> = {
        model: config.ai.model,
        messages,
        temperature: config.ai.temperature ?? 0.4,
      };

      if (config.ai.maxTokens) {
        body.max_tokens = config.ai.maxTokens;
      }

      const response = await fetch(`${config.ai.apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.ai.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ResearchAgentUpstreamError();
      }

      const data = (await response.json()) as ChatCompletionResponse;
      const content = data.choices?.[0]?.message?.content;

      if (typeof content !== 'string' || !content.trim()) {
        throw new ResearchAgentUpstreamError();
      }

      return {
        content: content.trim(),
        model: typeof data.model === 'string' && data.model.trim() ? data.model : config.ai.model,
        usage: data.usage,
      };
    } catch (error) {
      if (error instanceof ResearchAgentDisabledError || error instanceof ResearchAgentUpstreamError) {
        throw error;
      }

      throw new ResearchAgentUpstreamError();
    } finally {
      clearTimeout(timeout);
    }
  }
}
