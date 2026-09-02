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
    || '适合对这个方向感兴趣、愿意持续记录的同学';
  const missingRoles = cleanText(project.challenge_missing_roles_zh)
    || cleanText(project.recruitment_requirements)
    || (project.is_recruiting === false ? '当前暂不补充新成员' : '正在寻找合适的协作者');
  const beginnerSteps = cleanText(project.challenge_beginner_steps_zh)
    || cleanText(project.basic_plan_zh)
    || '先阅读课题说明，选择一个可观察变量，完成第一轮记录。';
  const objectives = cleanText(project.challenge_objectives_zh)
    || cleanText(project.research_questions_zh)
    || cleanText(project.description_zh)
    || '围绕课题现象提出问题，并把观察过程转化为可讨论的证据。';
  const roleOptions = getProjectIssueRoleOptions(project);

  return {
    issueNumberLabel: formatProjectIssueNumber(project.issue_number),
    state: getProjectIssueStateMeta(project.status),
    value: cleanText(project.challenge_value_zh)
      || cleanText(project.description_zh)
      || '这个议题还没有补充完整说明，可以先查看课题资料和团队状态。',
    objectives,
    beginnerSteps,
    minDeliverables: cleanText(project.challenge_min_deliverables_zh)
      || '一次完整观察记录、一份阶段小结，以及可以被复核的图片或数据。',
    reviewCriteria: cleanText(project.challenge_review_criteria_zh)
      || '记录是否清晰、变量是否明确、结论是否能由证据支持。',
    timeline: cleanText(project.challenge_timeline_zh)
      || '建议先用 1 周完成入门观察，再和组内确认下一轮任务。',
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
    || '从第一轮观察记录开始';
}
