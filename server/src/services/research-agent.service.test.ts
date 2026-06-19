import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedConfig = vi.hoisted(() => ({
  ai: {
    apiBaseUrl: 'https://provider.example.com/v1',
    apiKey: 'ai_secret_key',
    model: 'advisor-model',
    maxTokens: 512 as number | undefined,
    temperature: 0.2 as number | undefined,
    requestTimeoutMs: 30000,
  },
}));

vi.mock('../config/index.js', () => ({
  config: mockedConfig,
}));

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
}));

vi.stubGlobal('fetch', fetchMock);

import {
  RESEARCH_AGENT_SYSTEM_PROMPT,
  ResearchAgentDisabledError,
  ResearchAgentService,
  ResearchAgentUpstreamError,
} from './research-agent.service.js';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: vi.fn(async () => body),
  } as unknown as Response;
}

describe('ResearchAgentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    mockedConfig.ai.apiBaseUrl = 'https://provider.example.com/v1';
    mockedConfig.ai.apiKey = 'ai_secret_key';
    mockedConfig.ai.model = 'advisor-model';
    mockedConfig.ai.maxTokens = 512;
    mockedConfig.ai.temperature = 0.2;
    mockedConfig.ai.requestTimeoutMs = 30000;
  });

  it('reports disabled without calling upstream when required config is missing', async () => {
    mockedConfig.ai.apiKey = '';

    expect(ResearchAgentService.isEnabled()).toBe(false);
    await expect(ResearchAgentService.createChatCompletion([{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(
      ResearchAgentDisabledError
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps the advisor scoped to research-project help', () => {
    expect(RESEARCH_AGENT_SYSTEM_PROMPT).toContain('Only answer questions related to the current research project');
    expect(RESEARCH_AGENT_SYSTEM_PROMPT).toContain('politely refuse');
  });

  it('sends an OpenAI-compatible chat completion request and parses content plus usage', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        model: 'provider-model',
        choices: [{ message: { content: '  建议先收敛变量。  ' } }],
        usage: { prompt_tokens: 12, completion_tokens: 6, total_tokens: 18 },
      })
    );

    const completion = await ResearchAgentService.createChatCompletion([
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'question' },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://provider.example.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer ai_secret_key',
          'Content-Type': 'application/json',
        }),
      })
    );

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({
      model: 'advisor-model',
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'question' },
      ],
      temperature: 0.2,
      max_tokens: 512,
    });
    expect(completion).toEqual({
      content: '建议先收敛变量。',
      model: 'provider-model',
      usage: { prompt_tokens: 12, completion_tokens: 6, total_tokens: 18 },
    });
  });

  it('raises a sanitized upstream error without exposing the API key', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: { message: 'bad ai_secret_key' } }, false, 500));

    await expect(ResearchAgentService.createChatCompletion([{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(
      ResearchAgentUpstreamError
    );

    try {
      await ResearchAgentService.createChatCompletion([{ role: 'user', content: 'hi' }]);
    } catch (error) {
      expect(String(error)).not.toContain('ai_secret_key');
    }
  });
});
