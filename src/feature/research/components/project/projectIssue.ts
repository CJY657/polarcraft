import type { PublicProject } from '@/lib/profile.service';
import type { ResearchProject } from '@/lib/research.service';

export type ProjectIssueDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ProjectIssueSource = Pick<
  PublicProject | ResearchProject,
  | 'issue_number'
  | 'name_zh'
  | 'description_zh'
  | 'research_questions_zh'
  | 'basic_plan_zh'
  | 'status'
  | 'is_dormant'
  | 'challenge_value_zh'
  | 'challenge_objectives_zh'
  | 'challenge_beginner_steps_zh'
  | 'challenge_min_deliverables_zh'
  | 'challenge_review_criteria_zh'
  | 'challenge_timeline_zh'
  | 'challenge_difficulty'
  | 'challenge_roles_zh'
  | 'challenge_missing_roles_zh'
  | 'challenge_progress_zh'
> & {
  research_hypotheses_zh?: string | null;
  extended_plan_zh?: string | null;
  recruitment_requirements?: string | null;
  is_recruiting?: boolean;
};

interface ProjectIssue {
  issueNumberLabel: string;
  state: ProjectIssueStateMeta;
  value: string;
  objectives: string;
  beginnerSteps: string;
  minDeliverables: string;
  reviewCriteria: string;
  timeline: string;
  difficulty: ProjectIssueDifficulty;
  difficultyLabel: string;
  roles: string;
  missingRoles: string;
  progress: string;
  recruitmentState: string;
  roleItems: string[];
  missingRoleItems: string[];
  roleOptions: ProjectIssueRoleOption[];
  missingRoleOptions: ProjectIssueRoleOption[];
  beginnerStepItems: string[];
  objectiveItems: string[];
}

export interface ProjectIssueRoleOption {
  id: string;
  label: string;
  value: string;
  source: 'missing' | 'role' | 'requirements';
}

export interface ProjectIssueStateMeta {
  key: 'draft' | 'open' | 'closed';
  label: '草稿' | '开放中' | '已结束';
}

export const PROJECT_ISSUE_DIFFICULTY_OPTIONS: Array<{
  value: ProjectIssueDifficulty;
  label: string;
}> = [
  { value: 'beginner', label: '入门' },
  { value: 'intermediate', label: '进阶' },
  { value: 'advanced', label: '挑战' },
];

const difficultyLabels: Record<ProjectIssueDifficulty, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '挑战',
};

function cleanText(value?: string | null): string {
  return value?.trim() ?? '';
}

function splitIssueLines(value?: string | null): string[] {
  return cleanText(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitRoleFragments(value?: string | null): string[] {
  return splitIssueLines(value)
    .flatMap((line) => line.split(/[；;、，,/]/))
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanIssueRoleName(value?: string | null): string {
  return cleanText(value)
    .replace(/^(?:当前|目前)?(?:急需|需要|需|缺少|缺|招募|寻找|补充|希望|适合|角色)\s*/u, '')
    .replace(/^[：:\-—\s]+/u, '')
    .replace(/[（(]\s*(?:缺|还差|需要|招募)?\s*\d+\s*(?:人|位|名)?\s*[）)]/gu, '')
    .replace(/[：:]\s*(?:缺|还差|需要|招募)?\s*\d+\s*(?:人|位|名)?\s*$/u, '')
    .replace(/\s*(?:缺|还差|需要|招募)?\s*\d+\s*(?:人|位|名)\s*$/u, '')
    .replace(/[。；;，,、\s]+$/u, '')
    .trim();
}

function getRoleDedupeKey(value: string): string {
  return value
    .replace(/\s+/gu, '')
    .replace(/[。；;，,、:：()（）]/gu, '')
    .replace(/(?:成员|同学|员)$/u, '')
    .toLowerCase();
}

function appendRoleOptions(
  options: ProjectIssueRoleOption[],
  seen: Set<string>,
  value: string | null | undefined,
  source: ProjectIssueRoleOption['source']
) {
  for (const label of splitRoleFragments(value)) {
    const roleName = cleanIssueRoleName(label);
    if (!roleName) {
      continue;
    }

    const key = getRoleDedupeKey(roleName);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    options.push({
      id: `${source}-${key}`,
      label,
      value: roleName,
      source,
    });
  }
}

export function getProjectIssueRoleOptions(project: ProjectIssueSource): ProjectIssueRoleOption[] {
  const options: ProjectIssueRoleOption[] = [];
  const seen = new Set<string>();

  appendRoleOptions(options, seen, project.challenge_missing_roles_zh, 'missing');
  appendRoleOptions(options, seen, project.challenge_roles_zh, 'role');
  appendRoleOptions(options, seen, project.recruitment_requirements, 'requirements');

  return options;
}

function firstFallbackLine(value?: string | null): string {
  return splitIssueLines(value)[0] ?? '';
}

function normalizeDifficulty(value?: string | null): ProjectIssueDifficulty {
  return PROJECT_ISSUE_DIFFICULTY_OPTIONS.some((option) => option.value === value)
    ? value as ProjectIssueDifficulty
    : 'beginner';
}

export function formatProjectIssueNumber(value?: number | null): string {
  return Number.isSafeInteger(value) && Number(value) > 0 ? `#${value}` : '';
}

export function getProjectIssueStateMeta(status: string): ProjectIssueStateMeta {
  if (status === 'draft') {
    return { key: 'draft', label: '草稿' };
  }
  if (status === 'archived') {
    return { key: 'closed', label: '已结束' };
  }
  return { key: 'open', label: '开放中' };
}

export function buildProjectIssue(project: ProjectIssueSource): ProjectIssue {
  const difficulty = normalizeDifficulty(project.challenge_difficulty);
  const roles = cleanText(project.challenge_roles_zh)
    || cleanText(project.recruitment_requirements)
    || '对这个现象感到好奇、愿意动手做实验或记录数据的同学都很欢迎';
  const missingRoles = cleanText(project.challenge_missing_roles_zh)
    || cleanText(project.recruitment_requirements)
    || (project.is_recruiting === false ? '目前小组成员已满，暂不招募新伙伴' : '欢迎愿意一起动手做实验、整理数据或查资料的同学加入');
  const beginnerSteps = cleanText(project.challenge_beginner_steps_zh)
    || cleanText(project.basic_plan_zh)
    || '先看懂课题背景，亲手复现一次基础现象，拍下你的第一组观察照片或数据';
  const objectives = cleanText(project.challenge_objectives_zh)
    || cleanText(project.research_questions_zh)
    || cleanText(project.description_zh)
    || '观察并记录核心现象，提出自己的猜想，用实验照片或数据来验证它';
  const roleOptions = getProjectIssueRoleOptions(project);

  return {
    issueNumberLabel: formatProjectIssueNumber(project.issue_number),
    state: getProjectIssueStateMeta(project.status),
    value: cleanText(project.challenge_value_zh)
      || cleanText(project.description_zh)
      || '组长还没有补充详细的课题背景，你可以先看看上方的课题简介和已有的实验记录',
    objectives,
    beginnerSteps,
    minDeliverables: cleanText(project.challenge_min_deliverables_zh)
      || '一份清晰的实验观察记录（附上实拍图或数据表），以及简短的阶段小结',
    reviewCriteria: cleanText(project.challenge_review_criteria_zh)
      || '实验步骤清楚、方便同学复现，得出的结论有真实的照片或数据支撑',
    timeline: cleanText(project.challenge_timeline_zh)
      || '建议第 1 周先完成上手观察，之后每周和小组同步一次进展',
    difficulty,
    difficultyLabel: difficultyLabels[difficulty],
    roles,
    missingRoles,
    progress: cleanText(project.challenge_progress_zh),
    recruitmentState: project.is_recruiting === false ? '招募已停止' : '开放申请',
    roleItems: splitIssueLines(roles),
    missingRoleItems: splitIssueLines(missingRoles),
    roleOptions,
    missingRoleOptions: roleOptions.filter((option) => option.source === 'missing'),
    beginnerStepItems: splitIssueLines(beginnerSteps),
    objectiveItems: splitIssueLines(objectives),
  };
}

export function getProjectFirstStep(project: ProjectIssueSource): string {
  return firstFallbackLine(project.challenge_beginner_steps_zh)
    || firstFallbackLine(project.basic_plan_zh)
    || '先动手做一次基础观察并记录下来';
}
