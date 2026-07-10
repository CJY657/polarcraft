import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  findByIdForAdmin,
  getUserAnalytics,
  getActivityDashboard,
  getUserEducations,
  getUserMemberships,
  getUserApplications,
} = vi.hoisted(() => ({
  findByIdForAdmin: vi.fn(),
  getUserAnalytics: vi.fn(),
  getActivityDashboard: vi.fn(),
  getUserEducations: vi.fn(),
  getUserMemberships: vi.fn(),
  getUserApplications: vi.fn(),
}));

vi.mock('../models/user.model.js', () => ({
  UserModel: {
    findByIdForAdmin,
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
      recent_events: [],
    });

    await expect(UserService.getPostHogAnalyticsForAdmin('inactive-user')).resolves.toEqual({
      status: 'not_found',
      person: null,
      summary: null,
      recent_events: [],
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
      days: 90,
      generated_at: '2026-07-10T00:00:00.000Z',
      summary: {
        active_learners: 1,
        meaningful_events: 2,
        pageviews: 1,
        learning_actions: 1,
      },
      daily: [],
      top_pages: [],
      activity_breakdown: [],
      top_learners: [],
    };
    getActivityDashboard.mockResolvedValue(dashboard);

    await expect(UserService.getActivityDashboardForAdmin(90)).resolves.toBe(dashboard);
    expect(getActivityDashboard).toHaveBeenCalledWith(90);
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
