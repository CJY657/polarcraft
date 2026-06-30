import type { PublicProject } from '@/lib/profile.service';
import type { ResearchProject } from '@/lib/research.service';

export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ProjectChallengeSource = Pick<
  PublicProject | ResearchProject,
  | 'name_zh'
  | 'description_zh'
  | 'research_questions_zh'
  | 'basic_plan_zh'
  | 'status'
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

export interface ProjectChallengeCard {
  value: string;
  objectives: string;
  beginnerSteps: string;
  minDeliverables: string;
  reviewCriteria: string;
  timeline: string;
  difficulty: ChallengeDifficulty;
  difficultyLabel: string;
  roles: string;
  missingRoles: string;
  progress: string;
  recruitmentState: string;
  roleItems: string[];
  missingRoleItems: string[];
  beginnerStepItems: string[];
  objectiveItems: string[];
}

export const CHALLENGE_DIFFICULTY_OPTIONS: Array<{ value: ChallengeDifficulty; label: string }> = [
  { value: 'beginner', label: '入门' },
  { value: 'intermediate', label: '进阶' },
  { value: 'advanced', label: '挑战' },
];

const difficultyLabels: Record<ChallengeDifficulty, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '挑战',
};

const statusProgressLabels: Record<string, string> = {
  draft: '挑战准备中',
  active: '挑战推进中',
  completed: '挑战已完成',
  archived: '挑战已归档',
};

function cleanText(value?: string | null): string {
  return value?.trim() ?? '';
}

export function splitChallengeLines(value?: string | null): string[] {
  return cleanText(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function firstFallbackLine(value?: string | null): string {
  return splitChallengeLines(value)[0] ?? '';
}

function normalizeDifficulty(value?: string | null): ChallengeDifficulty {
  return CHALLENGE_DIFFICULTY_OPTIONS.some((option) => option.value === value)
    ? value as ChallengeDifficulty
    : 'beginner';
}

export function getChallengeDifficultyLabel(value?: string | null): string {
  return difficultyLabels[normalizeDifficulty(value)];
}

export function buildProjectChallengeCard(project: ProjectChallengeSource): ProjectChallengeCard {
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

  return {
    value: cleanText(project.challenge_value_zh)
      || cleanText(project.description_zh)
      || '这个挑战还没有补充完整说明，可以先查看课题资料和团队状态。',
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
    progress: cleanText(project.challenge_progress_zh)
      || statusProgressLabels[project.status]
      || '挑战状态待更新',
    recruitmentState: project.is_recruiting === false ? '招募已停止' : '开放申请',
    roleItems: splitChallengeLines(roles),
    missingRoleItems: splitChallengeLines(missingRoles),
    beginnerStepItems: splitChallengeLines(beginnerSteps),
    objectiveItems: splitChallengeLines(objectives),
  };
}

export function getProjectFirstStep(project: ProjectChallengeSource): string {
  return firstFallbackLine(project.challenge_beginner_steps_zh)
    || firstFallbackLine(project.basic_plan_zh)
    || '从第一轮观察记录开始';
}
