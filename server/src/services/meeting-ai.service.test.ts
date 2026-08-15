import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockResearchAgentService } = vi.hoisted(() => ({
  mockResearchAgentService: {
    isEnabled: vi.fn(),
    createChatCompletion: vi.fn(),
  },
}));

vi.mock('./research-agent.service.js', async () => {
  const actual = await vi.importActual<typeof import('./research-agent.service.js')>('./research-agent.service.js');
  return {
    ...actual,
    ResearchAgentService: mockResearchAgentService,
  };
});

import { ResearchAgentUpstreamError } from './research-agent.service.js';
import {
  MEETING_AI_PARSE_ERROR_MESSAGE,
  buildMeetingMinutesMessages,
  generateMeetingMinutes,
  parseMeetingAiResponse,
} from './meeting-ai.service.js';

const attendees = [
  { id: 'user-1', name: '张三' },
  { id: 'user-2', name: '李四' },
];
const attendeeIds = attendees.map((attendee) => attendee.id);

describe('buildMeetingMinutesMessages', () => {
  it('builds a [system, user] pair with the attendee id/name table and JSON-only contract', () => {
    const messages = buildMeetingMinutesMessages('今天讨论了偏振实验分工。', attendees);

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');

    // 实到成员名单以 [{id, name}] JSON 注入 system 指令
    expect(messages[0].content).toContain('实到成员名单');
    expect(messages[0].content).toContain('[{"id":"user-1","name":"张三"},{"id":"user-2","name":"李四"}]');

    // 结构化输出契约：只输出 JSON，含 minutes 与 scores 形状
    expect(messages[0].content).toContain('只输出一个 JSON 对象');
    expect(messages[0].content).toContain('"minutes"');
    expect(messages[0].content).toContain('"scores"');
    expect(messages[0].content).toContain('仅对记录中能辨识出发言或贡献的成员打分');

    expect(messages[1].content).toContain('今天讨论了偏振实验分工。');
  });
});

describe('parseMeetingAiResponse', () => {
  it('parses bare JSON output', () => {
    const result = parseMeetingAiResponse(
      '{"minutes":"# 会议纪要\\n\\n## 议题\\n偏振实验分工","scores":[{"id":"user-1","score":85,"comment":"发言积极，提出了对照组方案"}]}',
      attendeeIds
    );

    expect(result).toEqual({
      minutes: '# 会议纪要\n\n## 议题\n偏振实验分工',
      scores: [{ user_id: 'user-1', score: 85, comment: '发言积极，提出了对照组方案' }],
    });
  });

  it('strips ```json fences before parsing', () => {
    const result = parseMeetingAiResponse(
      '```json\n{"minutes":"## 结论\\n确定下周复测","scores":[{"id":"user-2","score":70,"comment":"补充了数据问题"}]}\n```',
      attendeeIds
    );

    expect(result.minutes).toBe('## 结论\n确定下周复测');
    expect(result.scores).toEqual([{ user_id: 'user-2', score: 70, comment: '补充了数据问题' }]);
  });

  it('throws an upstream error with the manual-minutes hint on garbage output', () => {
    expect(() => parseMeetingAiResponse('抱歉，我无法处理这段记录。', attendeeIds)).toThrowError(
      ResearchAgentUpstreamError
    );

    try {
      parseMeetingAiResponse('抱歉，我无法处理这段记录。', attendeeIds);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ResearchAgentUpstreamError);
      expect((error as ResearchAgentUpstreamError).message).toBe(MEETING_AI_PARSE_ERROR_MESSAGE);
      expect((error as ResearchAgentUpstreamError).statusCode).toBe(502);
      expect((error as ResearchAgentUpstreamError).code).toBe('AI_PROVIDER_ERROR');
    }
  });

  it('throws when JSON parses but minutes is missing or empty', () => {
    expect(() => parseMeetingAiResponse('{"scores":[]}', attendeeIds)).toThrowError(MEETING_AI_PARSE_ERROR_MESSAGE);
    expect(() => parseMeetingAiResponse('{"minutes":"   ","scores":[]}', attendeeIds)).toThrowError(
      MEETING_AI_PARSE_ERROR_MESSAGE
    );
  });

  it('clamps out-of-range scores to integers within 0-100 and truncates long comments', () => {
    const longComment = '很'.repeat(260);
    const result = parseMeetingAiResponse(
      JSON.stringify({
        minutes: '纪要',
        scores: [
          { id: 'user-1', score: 150, comment: longComment },
          { id: 'user-2', score: -12.4, comment: '几乎没有发言' },
        ],
      }),
      attendeeIds
    );

    expect(result.scores).toEqual([
      { user_id: 'user-1', score: 100, comment: '很'.repeat(200) },
      { user_id: 'user-2', score: 0, comment: '几乎没有发言' },
    ]);
  });

  it('drops score entries whose id is not an attendee, is duplicated, or has a non-numeric score', () => {
    const result = parseMeetingAiResponse(
      JSON.stringify({
        minutes: '纪要',
        scores: [
          { id: 'ghost-user', score: 90, comment: '编造的成员' },
          { id: 'user-1', score: 88.4, comment: '主持讨论' },
          { id: 'user-1', score: 10, comment: '重复条目' },
          { id: 'user-2', score: '不错', comment: '分数不是数字' },
        ],
      }),
      attendeeIds
    );

    expect(result.scores).toEqual([{ user_id: 'user-1', score: 88, comment: '主持讨论' }]);
  });

  it('tolerates a missing scores field as an empty list', () => {
    const result = parseMeetingAiResponse('{"minutes":"纪要"}', attendeeIds);

    expect(result).toEqual({ minutes: '纪要', scores: [] });
  });
});

describe('generateMeetingMinutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends the built messages, parses the completion, and returns the provider model', async () => {
    mockResearchAgentService.createChatCompletion.mockResolvedValue({
      content:
        '```json\n{"minutes":"## 议题\\n分工","scores":[{"id":"user-1","score":92,"comment":"贡献最大"},{"id":"ghost-user","score":50,"comment":"不存在"}]}\n```',
      model: 'provider-model',
      usage: { total_tokens: 42 },
    });

    const result = await generateMeetingMinutes('讨论记录原文', attendees);

    expect(mockResearchAgentService.createChatCompletion).toHaveBeenCalledTimes(1);
    const sentMessages = mockResearchAgentService.createChatCompletion.mock.calls[0][0];
    expect(sentMessages).toHaveLength(2);
    expect(sentMessages[0].role).toBe('system');
    expect(sentMessages[0].content).toContain('"id":"user-1"');
    expect(sentMessages[1].content).toContain('讨论记录原文');

    expect(result).toEqual({
      minutes: '## 议题\n分工',
      scores: [{ user_id: 'user-1', score: 92, comment: '贡献最大' }],
      model: 'provider-model',
    });
  });

  it('propagates upstream errors from the agent service', async () => {
    mockResearchAgentService.createChatCompletion.mockRejectedValue(new ResearchAgentUpstreamError());

    await expect(generateMeetingMinutes('讨论记录原文', attendees)).rejects.toBeInstanceOf(ResearchAgentUpstreamError);
  });

  it('surfaces the parse error when the completion content is not valid JSON', async () => {
    mockResearchAgentService.createChatCompletion.mockResolvedValue({
      content: '这不是 JSON',
      model: 'provider-model',
    });

    await expect(generateMeetingMinutes('讨论记录原文', attendees)).rejects.toThrowError(
      MEETING_AI_PARSE_ERROR_MESSAGE
    );
  });
});
