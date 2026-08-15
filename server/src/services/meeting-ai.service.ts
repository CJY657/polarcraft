import {
  ResearchAgentService,
  ResearchAgentUpstreamError,
  type ResearchAgentChatMessage,
} from './research-agent.service.js';

/**
 * Meeting AI service
 * 会议纪要 AI 服务：构建提示词、解析结构化返回、编排调用 ResearchAgentService
 */

export const MEETING_AI_PARSE_ERROR_MESSAGE = 'AI 返回内容无法解析，请重试或改用手动纪要';

const MEETING_AI_MIN_SCORE = 0;
const MEETING_AI_MAX_SCORE = 100;
const MAX_MEETING_AI_COMMENT_LENGTH = 200;

export interface MeetingAttendee {
  id: string;
  name: string;
}

export interface MeetingAiScore {
  user_id: string;
  score: number;
  comment: string;
}

export interface MeetingMinutesParseResult {
  minutes: string;
  scores: MeetingAiScore[];
}

export interface GeneratedMeetingMinutes extends MeetingMinutesParseResult {
  model: string;
}

const MEETING_MINUTES_SYSTEM_PROMPT_HEADER = [
  '你是零一学院虚拟课题组的会议纪要助理。用户会提供一次线下讨论会的文字记录，请你完成两项任务：',
  '1. 生成结构化会议纪要（Markdown 文本），依次包含以下小节：议题、讨论要点、结论与决议、行动项（注明负责人）、参会情况。',
  '2. 依据记录中各成员的发言参与度与贡献质量，对实到成员给出本次会议表现评分（0-100 的整数）和一句话评语。',
].join('\n');

const MEETING_MINUTES_SYSTEM_PROMPT_RULES = [
  '评分规则：',
  '- scores 中每项的 id 必须严格取自上方名单中的成员 id，不得使用姓名或编造 id。',
  '- 仅对记录中能辨识出发言或贡献的成员打分；无法辨识发言的成员不要输出评分条目。',
  '- comment 为一句话评语，说明评分依据，不超过 200 字。',
  '输出要求：只输出一个 JSON 对象，不要输出任何解释、前后缀或代码围栏，格式为：',
  '{"minutes": "<Markdown 纪要>", "scores": [{"id": "<成员id>", "score": <0-100 整数>, "comment": "<一句话依据>"}]}',
].join('\n');

/**
 * Build the [system, user] message pair for minutes generation
 * 构建纪要生成的 [system 指令, user 内容] 消息对
 */
export function buildMeetingMinutesMessages(
  rawNotes: string,
  attendees: MeetingAttendee[]
): ResearchAgentChatMessage[] {
  const attendeeList = JSON.stringify(attendees.map((attendee) => ({ id: attendee.id, name: attendee.name })));

  const systemContent = [
    MEETING_MINUTES_SYSTEM_PROMPT_HEADER,
    `实到成员名单（JSON 数组，id 为成员唯一标识）：\n${attendeeList}`,
    MEETING_MINUTES_SYSTEM_PROMPT_RULES,
  ].join('\n\n');

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: `会议文字记录如下：\n\n${rawNotes}` },
  ];
}

function createParseError(): ResearchAgentUpstreamError {
  const error = new ResearchAgentUpstreamError();
  error.message = MEETING_AI_PARSE_ERROR_MESSAGE;
  return error;
}

function stripJsonFences(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1] ?? trimmed;
}

function normalizeAiScores(rawScores: unknown, attendeeIds: string[]): MeetingAiScore[] {
  if (!Array.isArray(rawScores)) {
    return [];
  }

  const allowedIds = new Set(attendeeIds);
  const seenIds = new Set<string>();
  const scores: MeetingAiScore[] = [];

  for (const entry of rawScores) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const { id, score, comment } = entry as { id?: unknown; score?: unknown; comment?: unknown };

    if (typeof id !== 'string' || !allowedIds.has(id) || seenIds.has(id)) {
      continue;
    }

    if (typeof score !== 'number' || !Number.isFinite(score)) {
      continue;
    }

    seenIds.add(id);
    scores.push({
      user_id: id,
      score: Math.min(MEETING_AI_MAX_SCORE, Math.max(MEETING_AI_MIN_SCORE, Math.round(score))),
      comment: typeof comment === 'string' ? comment.trim().slice(0, MAX_MEETING_AI_COMMENT_LENGTH) : '',
    });
  }

  return scores;
}

/**
 * Parse the model output into minutes + per-attendee scores
 * 解析模型输出：剥离 ```json 围栏 → JSON.parse → 形状校验（分数夹取、评语截断、剔除非实到成员）
 */
export function parseMeetingAiResponse(content: string, attendeeIds: string[]): MeetingMinutesParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(stripJsonFences(content));
  } catch {
    throw createParseError();
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw createParseError();
  }

  const { minutes, scores } = parsed as { minutes?: unknown; scores?: unknown };

  if (typeof minutes !== 'string' || !minutes.trim()) {
    throw createParseError();
  }

  return {
    minutes: minutes.trim(),
    scores: normalizeAiScores(scores, attendeeIds),
  };
}

/**
 * Generate structured meeting minutes + AI performance scores from raw notes
 * 由原始文字记录生成结构化纪要与实到成员表现评分（AI 未配置/失败时由调用方按错误类处理）
 */
export async function generateMeetingMinutes(
  rawNotes: string,
  attendees: MeetingAttendee[]
): Promise<GeneratedMeetingMinutes> {
  const messages = buildMeetingMinutesMessages(rawNotes, attendees);
  const completion = await ResearchAgentService.createChatCompletion(messages);
  const parsed = parseMeetingAiResponse(
    completion.content,
    attendees.map((attendee) => attendee.id)
  );

  return {
    minutes: parsed.minutes,
    scores: parsed.scores,
    model: completion.model,
  };
}
