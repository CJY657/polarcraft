import { describe, expect, it } from 'vitest';
import { getChallengeRoleOptions, type ProjectChallengeSource } from './projectChallengeCard';

function createProject(overrides: Partial<ProjectChallengeSource>): ProjectChallengeSource {
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

describe('getChallengeRoleOptions', () => {
  it('parses missing-role lines into display labels and cleaned submit values', () => {
    const options = getChallengeRoleOptions(
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
    const options = getChallengeRoleOptions(
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
    const options = getChallengeRoleOptions(
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
