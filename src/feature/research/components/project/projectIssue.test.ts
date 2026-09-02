import { describe, expect, it } from 'vitest';
import {
  buildProjectIssue,
  formatProjectIssueNumber,
  getProjectIssueRoleOptions,
  getProjectIssueStateMeta,
  type ProjectIssueSource,
} from './projectIssue';

function createProject(overrides: Partial<ProjectIssueSource>): ProjectIssueSource {
  return {
    name_zh: '偏振课题',
    description_zh: null,
    status: 'active',
    challenge_value_zh: null,
    challenge_objectives_zh: null,
    challenge_beginner_steps_zh: null,
    challenge_min_deliverables_zh: null,
    challenge_review_criteria_zh: null,
    challenge_timeline_zh: null,
    challenge_difficulty: null,
    challenge_roles_zh: null,
    challenge_missing_roles_zh: null,
    challenge_progress_zh: null,
    ...overrides,
  };
}

describe('getProjectIssueRoleOptions', () => {
  it('parses missing-role lines into display labels and cleaned submit values', () => {
    const options = getProjectIssueRoleOptions(
      createProject({
        challenge_missing_roles_zh: '缺数据整理 1 人\n缺记录表达 1 人\n缺评审 2 人',
      })
    );

    expect(options.map(({ label, value, source }) => ({ label, value, source }))).toEqual([
      { label: '缺数据整理 1 人', value: '数据整理', source: 'missing' },
      { label: '缺记录表达 1 人', value: '记录表达', source: 'missing' },
      { label: '缺评审 2 人', value: '评审', source: 'missing' },
    ]);
  });

  it('prioritizes missing roles, falls back to suitable roles, and deduplicates cleaned names', () => {
    const options = getProjectIssueRoleOptions(
      createProject({
        challenge_missing_roles_zh: '缺数据整理 1 人',
        challenge_roles_zh: '数据整理员\n观察记录员',
        recruitment_requirements: '观察记录员\n实验复核员',
      })
    );

    expect(options.map(({ label, value, source }) => ({ label, value, source }))).toEqual([
      { label: '缺数据整理 1 人', value: '数据整理', source: 'missing' },
      { label: '观察记录员', value: '观察记录员', source: 'role' },
      { label: '实验复核员', value: '实验复核员', source: 'requirements' },
    ]);
  });

  it('keeps legacy recruitment requirements usable when challenge roles are empty', () => {
    const options = getProjectIssueRoleOptions(
      createProject({
        recruitment_requirements: '需要实验复核员、数据整理员',
      })
    );

    expect(options.map(({ label, value, source }) => ({ label, value, source }))).toEqual([
      { label: '需要实验复核员', value: '实验复核员', source: 'requirements' },
      { label: '数据整理员', value: '数据整理员', source: 'requirements' },
    ]);
  });
});

describe('project issue presentation', () => {
  it('maps draft and archived specially while every active lifecycle stage stays open', () => {
    expect(getProjectIssueStateMeta('draft')).toEqual({ key: 'draft', label: '草稿' });
    expect(getProjectIssueStateMeta('showcased')).toEqual({ key: 'open', label: '开放中' });
    expect(getProjectIssueStateMeta('archived')).toEqual({ key: 'closed', label: '已结束' });
  });

  it('formats only valid persisted issue numbers', () => {
    expect(formatProjectIssueNumber(12)).toBe('#12');
    expect(formatProjectIssueNumber(null)).toBe('');
    expect(formatProjectIssueNumber(0)).toBe('');
  });

  it('preserves content fallbacks without deriving progress from lifecycle status', () => {
    const issue = buildProjectIssue(createProject({
      issue_number: 7,
      description_zh: '真实课题简介',
      status: 'active',
      challenge_difficulty: 'advanced',
    }));

    expect(issue).toMatchObject({
      issueNumberLabel: '#7',
      value: '真实课题简介',
      objectives: '真实课题简介',
      progress: '',
      difficultyLabel: '挑战',
    });
  });
});
