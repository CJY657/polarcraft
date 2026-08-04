import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  findByIdForAdmin,
  findIdentitiesByIdsForAdmin,
  getUserAnalytics,
  getActivityDashboard,
  getLearnerActivityDetail,
  getUserEducations,
  getUserMemberships,
  getUserApplications,
  findById,
  updateProfile,
  sendEmailVerification,
} = vi.hoisted(() => ({
  findByIdForAdmin: vi.fn(),
  findIdentitiesByIdsForAdmin: vi.fn(),
  getUserAnalytics: vi.fn(),
  getActivityDashboard: vi.fn(),
  getLearnerActivityDetail: vi.fn(),
  getUserEducations: vi.fn(),
  getUserMemberships: vi.fn(),
  getUserApplications: vi.fn(),
  findById: vi.fn(),
  updateProfile: vi.fn(),
  sendEmailVerification: vi.fn(),
}));

vi.mock('../models/user.model.js', () => ({
  UserModel: {
    findByIdForAdmin,
    findIdentitiesByIdsForAdmin,
    findById,
    updateProfile,
  },
}));

vi.mock('./auth.service.js', () => ({
  AuthService: {
    sendEmailVerification,
  },
}));

vi.mock('../models/profile.model.js', () => ({
  ProfileModel: {
    getUserEducations,
    getUserMemberships,
    getUserApplications,
  },
}));

vi.mock('./posthog.service.js', () => ({
  PostHogService: {
    getUserAnalytics,
    getActivityDashboard,
    getLearnerActivityDetail,
  },
}));

import { AuthError } from '../types/auth.types.js';
import { UserService } from './user.service.js';

describe('UserService.getPostHogAnalyticsForAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unknown users before asking PostHog for analytics', async () => {
    findByIdForAdmin.mockResolvedValue(null);

    await expect(UserService.getPostHogAnalyticsForAdmin('missing-user')).rejects.toBeInstanceOf(
      AuthError
    );
    expect(getUserAnalytics).not.toHaveBeenCalled();
  });

  it('allows inactive users to be queried through the admin lookup path', async () => {
    findByIdForAdmin.mockResolvedValue({
      id: 'inactive-user',
      username: 'bob',
      role: 'user',
      user_type: 'student',
      avatar_url: null,
      email: null,
      email_verified: false,
      is_active: false,
      created_at: new Date('2026-05-01T00:00:00.000Z'),
      last_login_at: null,
    });
    getUserAnalytics.mockResolvedValue({
      status: 'not_found',
      person: null,
      summary: null,
    });

    await expect(UserService.getPostHogAnalyticsForAdmin('inactive-user')).resolves.toEqual({
      status: 'not_found',
      person: null,
      summary: null,
    });

    expect(findByIdForAdmin).toHaveBeenCalledWith('inactive-user');
    expect(getUserAnalytics).toHaveBeenCalledWith('inactive-user');
  });
});

describe('UserService.getActivityDashboardForAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates the selected range to PostHog aggregates', async () => {
    const dashboard = {
      status: 'ok',
      segment: 'all',
      range: { start: '2026-04-12', end: '2026-07-10', days: 90 },
      generated_at: '2026-07-10T00:00:00.000Z',
      summary: {
        active_users: 1,
        meaningful_events: 2,
        pageviews: 1,
        learning_actions: 1,
      },
      daily: [],
      top_pages: [],
      activity_breakdown: [],
      module_breakdown: [],
      top_users: [],
    };
    getActivityDashboard.mockResolvedValue(dashboard);

    await expect(
      UserService.getActivityDashboardForAdmin('2026-04-12', '2026-07-10', null, 'all')
    ).resolves.toBe(dashboard);
    expect(getActivityDashboard).toHaveBeenCalledWith(
      '2026-04-12',
      '2026-07-10',
      null,
      'all'
    );
    expect(findIdentitiesByIdsForAdmin).not.toHaveBeenCalled();
  });

  it('uses real names in the ranking and falls back to nicknames, then usernames', async () => {
    getActivityDashboard.mockResolvedValue({
      status: 'ok',
      segment: 'student',
      range: { start: '2026-07-01', end: '2026-07-10', days: 10 },
      generated_at: '2026-07-10T00:00:00.000Z',
      summary: {
        active_users: 3,
        meaningful_events: 9,
        pageviews: 6,
        learning_actions: 3,
      },
      daily: [],
      top_pages: [],
      activity_breakdown: [],
      module_breakdown: [],
      top_users: [
        {
          user_id: 'real-name-user',
          username: 'alice',
          display_name: 'alice',
          user_type: 'student',
          events: 4,
          pageviews: 3,
          learning_actions: 1,
          last_activity: null,
        },
        {
          user_id: 'nickname-user',
          username: 'bob',
          display_name: 'bob',
          user_type: 'student',
          events: 3,
          pageviews: 2,
          learning_actions: 1,
          last_activity: null,
        },
        {
          user_id: 'legacy-user',
          username: 'legacy-account',
          display_name: 'legacy-account',
          user_type: null,
          events: 2,
          pageviews: 1,
          learning_actions: 1,
          last_activity: null,
        },
      ],
    });
    findIdentitiesByIdsForAdmin.mockResolvedValue([
      {
        id: 'real-name-user',
        username: 'alice',
        nickname: '小爱',
        real_name: ' Alice Wang ',
        user_type: 'student',
      },
      {
        id: 'nickname-user',
        username: 'bob',
        nickname: ' 小波 ',
        real_name: '   ',
        user_type: 'student',
      },
      {
        id: 'legacy-user',
        username: 'legacy-account',
        nickname: null,
        real_name: null,
        user_type: null,
      },
    ]);

    const result = await UserService.getActivityDashboardForAdmin(
      '2026-07-01',
      '2026-07-10',
      10,
      'student'
    );

    expect(findIdentitiesByIdsForAdmin).toHaveBeenCalledWith([
      'real-name-user',
      'nickname-user',
      'legacy-user',
    ]);
    expect(result.top_users.map((user) => user.display_name)).toEqual([
      'Alice Wang',
      '小波',
      'legacy-account',
    ]);
    expect(result.top_users.map((user) => user.user_type)).toEqual([
      'student',
      'student',
      null,
    ]);
  });

  it('reuses one bounded PostHog aggregate across numeric ranking limits', async () => {
    const dashboard = {
      status: 'ok',
      segment: 'student',
      range: { start: '2026-05-01', end: '2026-05-07', days: 7 },
      generated_at: '2026-05-07T00:00:00.000Z',
      summary: { active_users: 1, meaningful_events: 1, pageviews: 1, learning_actions: 0 },
      daily: [],
      top_pages: [],
      activity_breakdown: [],
      module_breakdown: [],
      top_users: [],
    };
    getActivityDashboard.mockResolvedValue(dashboard);

    await UserService.getActivityDashboardForAdmin('2026-05-01', '2026-05-07', 10, 'student');
    await UserService.getActivityDashboardForAdmin('2026-05-01', '2026-05-07', 10, 'student');
    expect(getActivityDashboard).toHaveBeenCalledTimes(1);
    expect(getActivityDashboard).toHaveBeenLastCalledWith(
      '2026-05-01',
      '2026-05-07',
      100,
      'student'
    );

    // Numeric ranking limits share the same top-100 snapshot. Segment, range,
    // and the unbounded "all" result remain independent cache keys.
    await UserService.getActivityDashboardForAdmin('2026-05-01', '2026-05-07', 10, 'teacher');
    await UserService.getActivityDashboardForAdmin('2026-05-01', '2026-05-07', 50, 'student');
    await UserService.getActivityDashboardForAdmin('2026-05-01', '2026-05-08', 10, 'student');
    await UserService.getActivityDashboardForAdmin('2026-05-01', '2026-05-07', null, 'student');
    expect(getActivityDashboard).toHaveBeenCalledTimes(4);
  });

  it('reads display names from the database on every request, cached aggregate or not', async () => {
    getActivityDashboard.mockResolvedValue({
      status: 'ok',
      segment: 'student',
      range: { start: '2026-05-11', end: '2026-05-17', days: 7 },
      generated_at: '2026-05-17T00:00:00.000Z',
      summary: { active_users: 1, meaningful_events: 1, pageviews: 1, learning_actions: 0 },
      daily: [],
      top_pages: [],
      activity_breakdown: [],
      module_breakdown: [],
      top_users: [
        {
          user_id: 'renamed-user',
          username: 'alice',
          display_name: 'alice',
          user_type: 'student',
          events: 1,
          pageviews: 1,
          learning_actions: 0,
          last_activity: null,
        },
      ],
    });
    findIdentitiesByIdsForAdmin.mockResolvedValueOnce([
      { id: 'renamed-user', username: 'alice', nickname: null, real_name: 'Alice', user_type: 'student' },
    ]);
    findIdentitiesByIdsForAdmin.mockResolvedValueOnce([
      { id: 'renamed-user', username: 'alice', nickname: null, real_name: 'Alice Wang', user_type: 'teacher' },
    ]);

    const first = await UserService.getActivityDashboardForAdmin(
      '2026-05-11',
      '2026-05-17',
      10,
      'student'
    );
    const second = await UserService.getActivityDashboardForAdmin(
      '2026-05-11',
      '2026-05-17',
      10,
      'student'
    );

    expect(getActivityDashboard).toHaveBeenCalledTimes(1);
    expect(first.top_users[0].display_name).toBe('Alice');
    expect(second.top_users[0].display_name).toBe('Alice Wang');
    expect(second.top_users[0].user_type).toBe('teacher');
  });
});

describe('UserService.getLearnerActivityForAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds the selected account type from the database to the activity detail', async () => {
    findByIdForAdmin.mockResolvedValue({
      id: 'teacher-1',
      user_type: 'teacher',
    });
    getLearnerActivityDetail.mockResolvedValue({
      status: 'ok',
      range: { start: '2026-07-01', end: '2026-07-07', days: 7 },
      previous_range: { start: '2026-06-24', end: '2026-06-30', days: 7 },
      generated_at: '2026-07-07T00:00:00.000Z',
      last_activity: null,
      summary: null,
      previous_summary: null,
      daily: [],
      top_pages: [],
      module_breakdown: [],
      hourly: [],
    });

    await expect(
      UserService.getLearnerActivityForAdmin('teacher-1', '2026-07-01', '2026-07-07')
    ).resolves.toMatchObject({ user_type: 'teacher' });
    expect(getLearnerActivityDetail).toHaveBeenCalledWith(
      'teacher-1',
      '2026-07-01',
      '2026-07-07'
    );
  });

  it('caches activity per learner and range, after checking the account exists', async () => {
    findByIdForAdmin.mockResolvedValue({ id: 'learner-1', user_type: 'student' });
    getLearnerActivityDetail.mockResolvedValue({
      status: 'ok',
      range: { start: '2026-06-01', end: '2026-06-07', days: 7 },
      previous_range: { start: '2026-05-25', end: '2026-05-31', days: 7 },
      generated_at: '2026-06-07T00:00:00.000Z',
      last_activity: null,
      summary: null,
      previous_summary: null,
      daily: [],
      top_pages: [],
      module_breakdown: [],
      hourly: [],
    });

    await UserService.getLearnerActivityForAdmin('learner-1', '2026-06-01', '2026-06-07');
    await UserService.getLearnerActivityForAdmin('learner-1', '2026-06-01', '2026-06-07');
    expect(getLearnerActivityDetail).toHaveBeenCalledTimes(1);
    // Existence is still verified on the cached path.
    expect(findByIdForAdmin).toHaveBeenCalledTimes(2);

    findByIdForAdmin.mockResolvedValue({ id: 'learner-2', user_type: 'student' });
    await UserService.getLearnerActivityForAdmin('learner-2', '2026-06-01', '2026-06-07');
    expect(getLearnerActivityDetail).toHaveBeenCalledTimes(2);

    findByIdForAdmin.mockResolvedValue(null);
    await expect(
      UserService.getLearnerActivityForAdmin('learner-1', '2026-06-01', '2026-06-07')
    ).rejects.toBeInstanceOf(AuthError);
    expect(getLearnerActivityDetail).toHaveBeenCalledTimes(2);
  });
});

describe('UserService.getUserDetailForAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unknown users before loading detail sections', async () => {
    findByIdForAdmin.mockResolvedValue(null);

    await expect(UserService.getUserDetailForAdmin('missing-user')).rejects.toBeInstanceOf(
      AuthError
    );
    expect(getUserEducations).not.toHaveBeenCalled();
    expect(getUserMemberships).not.toHaveBeenCalled();
    expect(getUserApplications).not.toHaveBeenCalled();
  });

  it('aggregates profile, educations, and research involvement into a safe payload', async () => {
    const user = {
      id: 'user-1',
      username: 'alice',
      role: 'user',
      user_type: 'student',
      avatar_url: null,
      email: 'alice@example.com',
      email_verified: true,
      is_active: true,
      created_at: new Date('2026-05-01T00:00:00.000Z'),
      last_login_at: new Date('2026-06-01T00:00:00.000Z'),
    };
    findByIdForAdmin.mockResolvedValue(user);
    getUserEducations.mockResolvedValue([
      {
        id: 'edu-1',
        user_id: 'user-1',
        organization: '某某大学',
        major: '物理学',
        degree_level: '本科',
        start_date: '2024-09-01',
        end_date: null,
        is_current: true,
        created_at: new Date('2026-05-01T00:00:00.000Z'),
        updated_at: new Date('2026-05-01T00:00:00.000Z'),
      },
    ]);
    getUserMemberships.mockResolvedValue([
      {
        project_id: 'project-1',
        project_name: '偏振光课题',
        role: 'member',
        joined_at: new Date('2026-05-10T00:00:00.000Z'),
      },
    ]);
    getUserApplications.mockResolvedValue([
      {
        id: 'app-1',
        project_id: 'project-2',
        user_id: 'user-1',
        display_name: 'Alice',
        organization: '某某大学',
        education_id: 'edu-1',
        major: '物理学',
        grade: '大二',
        desired_role: '观察记录员',
        proposed_contribution: '整理观察记录',
        weekly_time_commitment: '每周 2 小时',
        research_experience: '有实验经历',
        expertise: '光学',
        motivation: '想加入',
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        review_notes: null,
        created_at: new Date('2026-06-01T00:00:00.000Z'),
        updated_at: new Date('2026-06-01T00:00:00.000Z'),
        project_name: '另一个课题',
      },
    ]);

    const result = await UserService.getUserDetailForAdmin('user-1');

    expect(result.user).toEqual(user);
    expect(result.educations).toEqual([
      {
        id: 'edu-1',
        organization: '某某大学',
        major: '物理学',
        degree_level: '本科',
        start_date: '2024-09-01',
        end_date: null,
        is_current: true,
      },
    ]);
    expect(result.research.memberships).toEqual([
      {
        project_id: 'project-1',
        project_name: '偏振光课题',
        role: 'member',
        joined_at: new Date('2026-05-10T00:00:00.000Z'),
      },
    ]);
    expect(result.research.applications).toEqual([
      {
        id: 'app-1',
        project_id: 'project-2',
        project_name: '另一个课题',
        display_name: 'Alice',
        organization: '某某大学',
        major: '物理学',
        grade: '大二',
        status: 'pending',
        created_at: new Date('2026-06-01T00:00:00.000Z'),
        reviewed_at: null,
      },
    ]);
    // Sensitive review/application internals must not leak into the admin list payload
    expect(JSON.stringify(result)).not.toContain('motivation');
  });
});

describe('UserService.updateProfile email verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const profile = (email: string | null, verified = false) => ({
    id: 'user-1',
    username: 'alice',
    nickname: null,
    real_name: 'Alice',
    show_real_name_publicly: false,
    role: 'user' as const,
    user_type: 'student' as const,
    avatar_url: null,
    email,
    email_verified: verified,
    created_at: new Date('2026-05-01T00:00:00.000Z'),
    updated_at: new Date('2026-05-01T00:00:00.000Z'),
    last_login_at: null,
  });

  it('sends a verification link when the address changes', async () => {
    findById.mockResolvedValue(profile('old@example.com', true));
    updateProfile.mockResolvedValue(profile('new@example.com'));

    await UserService.updateProfile('user-1', { email: 'new@example.com' });

    expect(sendEmailVerification).toHaveBeenCalledWith('user-1', 'alice', 'new@example.com');
  });

  it('does not resend when an unchanged address is resubmitted', async () => {
    findById.mockResolvedValue(profile('same@example.com'));
    updateProfile.mockResolvedValue(profile('same@example.com'));

    await UserService.updateProfile('user-1', {
      email: 'same@example.com',
      real_name: 'Alice Wang',
    });

    expect(sendEmailVerification).not.toHaveBeenCalled();
  });
});
