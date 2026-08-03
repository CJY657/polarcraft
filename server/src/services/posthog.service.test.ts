import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockedConfig = vi.hoisted(() => ({
  posthog: {
    appHost: 'https://us.posthog.com',
    environmentId: 'env-123',
    personalApiKey: 'phx_secret',
  },
}));

vi.mock('../config/index.js', () => ({
  config: mockedConfig,
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
  },
}));

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
}));

vi.stubGlobal('fetch', fetchMock);

import { PostHogAnalyticsError, PostHogService } from './posthog.service.js';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: vi.fn(async () => body),
  } as unknown as Response;
}

/** 学习行为 = 进入实验 + 虚拟课题组的主动参与 */
const LEARNING_ACTIONS_COUNT =
  "countIf(event IN ('experiment_opened', 'project_application_submitted', " +
  "'research_project_created', 'research_discussion_posted', " +
  "'research_evidence_submitted', 'research_task_completed'))";

describe('PostHogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    mockedConfig.posthog.appHost = 'https://us.posthog.com';
    mockedConfig.posthog.environmentId = 'env-123';
    mockedConfig.posthog.personalApiKey = 'phx_secret';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns disabled when the backend PostHog configuration is incomplete', async () => {
    mockedConfig.posthog.personalApiKey = '';

    await expect(PostHogService.getUserAnalytics('user-1')).resolves.toEqual({
      status: 'disabled',
      person: null,
      summary: null,
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns not_found when PostHog has no person for the requested distinct id', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ results: [] }));

    await expect(PostHogService.getUserAnalytics('user-1')).resolves.toEqual({
      status: 'not_found',
      person: null,
      summary: null,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps person and the current 10-calendar-day summary from PostHog responses', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-14T15:00:00Z'));
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              id: 0,
              uuid: 'person-uuid',
              created_at: '2026-04-01T00:00:00.000Z',
              last_seen_at: '2026-05-14T12:00:00.000Z',
            },
          ],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            ['2026-05-13', '2026-05-13T09:00:00.000Z', 12, 3, 2],
            ['2026-05-14', '2026-05-14T12:00:00.000Z', 30, 8, 5],
          ],
        })
      );

    await expect(PostHogService.getUserAnalytics('user-1')).resolves.toEqual({
      status: 'ok',
      person: {
        id: '0',
        uuid: 'person-uuid',
        created_at: '2026-04-01T00:00:00.000Z',
        last_seen_at: '2026-05-14T12:00:00.000Z',
      },
      summary: {
        window_days: 10,
        last_activity: '2026-05-14T12:00:00.000Z',
        meaningful_events: 42,
        pageviews: 11,
        learning_actions: 7,
        daily: [
          { date: '2026-05-05', events: 0 },
          { date: '2026-05-06', events: 0 },
          { date: '2026-05-07', events: 0 },
          { date: '2026-05-08', events: 0 },
          { date: '2026-05-09', events: 0 },
          { date: '2026-05-10', events: 0 },
          { date: '2026-05-11', events: 0 },
          { date: '2026-05-12', events: 0 },
          { date: '2026-05-13', events: 12 },
          { date: '2026-05-14', events: 30 },
        ],
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://us.posthog.com/api/environments/env-123/persons/?distinct_id=user-1&limit=1',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer phx_secret',
        }),
      })
    );

    const summaryBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)) as {
      query: { kind: string; query: string };
      name: string;
    };
    expect(summaryBody.name).toBe('admin user analytics summary');
    expect(summaryBody.query.kind).toBe('HogQLQuery');
    expect(summaryBody.query.query).toContain("distinct_id = 'user-1'");
    expect(summaryBody.query.query).toContain(
      'timestamp >= toStartOfDay(now()) - INTERVAL 9 DAY'
    );
    expect(summaryBody.query.query).toContain(
      'timestamp < toStartOfDay(now()) + INTERVAL 1 DAY'
    );
    expect(summaryBody.query.query).toContain('GROUP BY day');
    expect(summaryBody.query.query).toContain('properties.$is_identified = true');
    expect(summaryBody.query.query).toContain(
      "event NOT IN ('$autocapture', '$pageleave', '$identify', '$set')"
    );
    expect(summaryBody.query.query).toContain(
      LEARNING_ACTIONS_COUNT
    );
    expect(summaryBody.query.query).not.toContain('person.properties.role');
    expect(summaryBody.query.query).not.toContain('INTERVAL 10 DAY');
  });

  it('returns a null last activity and a zero-filled daily series when no filtered events exist', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-14T15:00:00Z'));
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ results: [{ id: 'person-1' }] }))
      .mockResolvedValueOnce(jsonResponse({ results: [] }));

    await expect(PostHogService.getUserAnalytics('user-1')).resolves.toEqual({
      status: 'ok',
      person: {
        id: 'person-1',
        uuid: null,
        created_at: null,
        last_seen_at: null,
      },
      summary: {
        window_days: 10,
        last_activity: null,
        meaningful_events: 0,
        pageviews: 0,
        learning_actions: 0,
        daily: Array.from({ length: 10 }, (_, index) => ({
          date: new Date(Date.UTC(2026, 4, 5 + index)).toISOString().slice(0, 10),
          events: 0,
        })),
      },
    });
  });

  it('extends the daily window when PostHog reports a day ahead of the server clock', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-14T20:00:00Z'));
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ results: [{ id: 'person-1' }] }))
      .mockResolvedValueOnce(
        jsonResponse({
          results: [['2026-05-15', '2026-05-15T02:00:00.000Z', 4, 1, 0]],
        })
      );

    const result = await PostHogService.getUserAnalytics('user-1');
    expect(result.summary?.daily).toHaveLength(10);
    expect(result.summary?.daily.at(-1)).toEqual({ date: '2026-05-15', events: 4 });
    expect(result.summary?.daily.at(0)).toEqual({ date: '2026-05-06', events: 0 });
    expect(result.summary?.meaningful_events).toBe(4);
  });

  it('raises a sanitized upstream error without exposing the personal API key', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          detail: 'bad request',
        },
        false,
        500
      )
    );

    await expect(PostHogService.getUserAnalytics('user-1')).rejects.toEqual(
      expect.objectContaining({
        name: 'PostHogAnalyticsError',
        message: '行为数据查询失败，请稍后重试',
      })
    );

    try {
      await PostHogService.getUserAnalytics('user-1');
    } catch (error) {
      expect(error).toBeInstanceOf(PostHogAnalyticsError);
      expect(String(error)).not.toContain('phx_secret');
    }
  });

  it('returns a disabled activity dashboard without querying when configuration is incomplete', async () => {
    mockedConfig.posthog.environmentId = '';

    await expect(
      PostHogService.getActivityDashboard('2026-06-10', '2026-07-09', 10)
    ).resolves.toEqual({
      status: 'disabled',
      segment: 'student',
      range: { start: '2026-06-10', end: '2026-07-09', days: 30 },
      generated_at: expect.any(String),
      summary: null,
      previous_summary: null,
      daily: [],
      top_pages: [],
      activity_breakdown: [],
      module_breakdown: [],
      top_users: [],
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps bounded learner-only aggregate queries into the activity dashboard', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ results: [[3, 18, 8, 10]] }))
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            ['2026-07-08', 2, 5, 4],
            ['2026-07-09', 3, 3, 6],
          ],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            ['/courses', 5, 2],
            ['/projects/1', 3, 2],
          ],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            ['experiment_opened', 6, 3],
            ['project_application_submitted', 4, 2],
          ],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            ['user-1', 'alice', 'student', 9, 4, 5, '2026-07-09T12:00:00.000Z'],
            ['user-2', null, 'student', 6, 3, 3, null],
          ],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            ['/courses', 'user-1', 'alice', 5],
            ['/projects/1', 'user-2', null, 3],
          ],
        })
      )
      .mockResolvedValueOnce(jsonResponse({ results: [[2, 11, 6, 5]] }));

    await expect(
      PostHogService.getActivityDashboard('2026-07-07', '2026-07-09', 10)
    ).resolves.toEqual({
      status: 'ok',
      segment: 'student',
      range: { start: '2026-07-07', end: '2026-07-09', days: 3 },
      generated_at: expect.any(String),
      summary: {
        active_users: 3,
        meaningful_events: 18,
        pageviews: 8,
        learning_actions: 10,
      },
      previous_summary: {
        range: { start: '2026-07-04', end: '2026-07-06', days: 3 },
        active_users: 2,
        meaningful_events: 11,
        pageviews: 6,
        learning_actions: 5,
      },
      daily: [
        { date: '2026-07-07', active_users: 0, pageviews: 0, learning_actions: 0 },
        { date: '2026-07-08', active_users: 2, pageviews: 5, learning_actions: 4 },
        { date: '2026-07-09', active_users: 3, pageviews: 3, learning_actions: 6 },
      ],
      top_pages: [
        { path: '/courses', pageviews: 5, unique_users: 2 },
        { path: '/projects/1', pageviews: 3, unique_users: 2 },
      ],
      activity_breakdown: [
        { event: 'experiment_opened', count: 6, unique_users: 3 },
        { event: 'project_application_submitted', count: 4, unique_users: 2 },
      ],
      module_breakdown: [
        {
          module: 'module1',
          label: '实验内容',
          pageviews: 5,
          unique_users: 1,
          users: [{ user_id: 'user-1', username: 'alice', pageviews: 5 }],
        },
        {
          module: 'other',
          label: '其他页面',
          pageviews: 3,
          unique_users: 1,
          users: [{ user_id: 'user-2', username: 'user-2', pageviews: 3 }],
        },
      ],
      top_users: [
        {
          user_id: 'user-1',
          username: 'alice',
          display_name: 'alice',
          user_type: 'student',
          events: 9,
          pageviews: 4,
          learning_actions: 5,
          last_activity: '2026-07-09T12:00:00.000Z',
        },
        {
          user_id: 'user-2',
          username: 'user-2',
          display_name: 'user-2',
          user_type: 'student',
          events: 6,
          pageviews: 3,
          learning_actions: 3,
          last_activity: null,
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(7);
    const queryBodies = fetchMock.mock.calls.map((call) =>
      JSON.parse(String(call[1]?.body)) as { query: { query: string }; name: string }
    );
    for (const body of queryBodies.slice(0, 6)) {
      expect(body.query.query).toContain(
        "timestamp >= toDate('2026-07-07')"
      );
      expect(body.query.query).toContain(
        "timestamp < toDate('2026-07-09') + INTERVAL 1 DAY"
      );
      expect(body.query.query).toContain("person.properties.user_type = 'student'");
      expect(body.query.query).not.toContain('person.properties.role');
      expect(body.query.query).toContain('person_id IS NOT NULL');
      expect(body.query.query).toContain('properties.$is_identified = true');
      expect(body.query.query).toContain(
        "event NOT IN ('$autocapture', '$pageleave', '$identify', '$set')"
      );
    }
    expect(queryBodies[0]?.query.query).toContain('count(DISTINCT person_id)');
    expect(queryBodies[1]?.query.query).toContain('ORDER BY day');
    expect(queryBodies[1]?.query.query).not.toContain('WITH FILL');
    expect(queryBodies[1]?.query.query).toContain('LIMIT 3');
    expect(queryBodies[2]?.query.query).toContain('LIMIT 10');
    expect(queryBodies[3]?.query.query).toContain('LIMIT 10');
    for (const index of [0, 1, 4]) {
      expect(queryBodies[index]?.query.query).toContain(
        LEARNING_ACTIONS_COUNT
      );
    }
    expect(queryBodies[4]?.query.query).toContain('LIMIT 10');
    expect(queryBodies[4]?.query.query).toContain('argMax(distinct_id, timestamp)');
    expect(queryBodies[4]?.query.query).toContain('GROUP BY person_id');
    expect(queryBodies[5]?.query.query).toContain('GROUP BY 1, person_id');
    expect(queryBodies[5]?.query.query).not.toContain('LIMIT');
    expect(queryBodies[6]?.name).toBe('admin user activity previous summary');
    expect(queryBodies[6]?.query.query).toContain("timestamp >= toDate('2026-07-04')");
    expect(queryBodies[6]?.query.query).toContain(
      "timestamp < toDate('2026-07-06') + INTERVAL 1 DAY"
    );
  });

  it('omits the user limit and excludes unclassified users from the all segment', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ results: [[]] }));

    await PostHogService.getActivityDashboard('2026-07-08', '2026-07-09', null, 'all');

    const queryBodies = fetchMock.mock.calls.map((call) =>
      JSON.parse(String(call[1]?.body)) as { query: { query: string }; name: string }
    );
    const usersQuery = queryBodies.find(
      (body) => body.name === 'admin user activity top users'
    );
    expect(usersQuery).toBeDefined();
    expect(usersQuery?.query.query).toContain('GROUP BY person_id');
    expect(usersQuery?.query.query).not.toContain('LIMIT');
    for (const body of queryBodies) {
      expect(body.query.query).toContain(
        "person.properties.user_type IN ('student', 'teacher')"
      );
    }
  });

  it('sanitizes activity dashboard upstream failures', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false, 500));

    await expect(
      PostHogService.getActivityDashboard('2026-07-07', '2026-07-13', 10)
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'PostHogAnalyticsError',
        message: '行为数据查询失败，请稍后重试',
      })
    );
  });

  it('keeps activity query concurrency within the upstream limit', async () => {
    let activeRequests = 0;
    let maximumConcurrency = 0;
    fetchMock.mockImplementation(async () => {
      activeRequests += 1;
      maximumConcurrency = Math.max(maximumConcurrency, activeRequests);
      await new Promise((resolve) => setTimeout(resolve, 0));
      activeRequests -= 1;
      return jsonResponse({ results: [[]] });
    });

    await PostHogService.getActivityDashboard('2026-07-07', '2026-07-13', 10);

    expect(maximumConcurrency).toBeLessThanOrEqual(3);
  });

  it('returns a disabled public snapshot without querying when configuration is incomplete', async () => {
    mockedConfig.posthog.personalApiKey = '';

    await expect(
      PostHogService.getPublicActivitySnapshot('2026-07-03', '2026-07-09')
    ).resolves.toEqual({
      status: 'disabled',
      range: { start: '2026-07-03', end: '2026-07-09', days: 7 },
      generated_at: expect.any(String),
      summary: null,
      daily: [],
      top_pages: [],
      learners: [],
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('derives the public snapshot summary from the full learner list', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          results: [['2026-07-09', 2, 6, 3]],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            ['https://polariscope.app/experiments', 7],
            ['/demos', 4],
          ],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            ['user-1', 12, 7, 4],
            ['user-2', 5, 3, 1],
          ],
        })
      );

    await expect(
      PostHogService.getPublicActivitySnapshot('2026-07-08', '2026-07-09')
    ).resolves.toEqual({
      status: 'ok',
      range: { start: '2026-07-08', end: '2026-07-09', days: 2 },
      generated_at: expect.any(String),
      summary: { active_learners: 2, pageviews: 10, learning_actions: 5 },
      daily: [
        { date: '2026-07-08', active_learners: 0, pageviews: 0, learning_actions: 0 },
        { date: '2026-07-09', active_learners: 2, pageviews: 6, learning_actions: 3 },
      ],
      top_pages: [
        { path: '/experiments', pageviews: 7 },
        { path: '/demos', pageviews: 4 },
      ],
      learners: [
        { user_id: 'user-1', events: 12, pageviews: 7, learning_actions: 4 },
        { user_id: 'user-2', events: 5, pageviews: 3, learning_actions: 1 },
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const queryBodies = fetchMock.mock.calls.map(
      (call) => JSON.parse(String(call[1]?.body)) as { query: { query: string }; name: string }
    );
    for (const body of queryBodies) {
      expect(body.query.query).toContain("person.properties.user_type = 'student'");
      expect(body.query.query).not.toContain('person.properties.role');
      expect(body.query.query).toContain('properties.$is_identified = true');
      expect(body.query.query).toContain(
        "event NOT IN ('$autocapture', '$pageleave', '$identify', '$set')"
      );
    }
    // No usernames leave PostHog for the public page.
    expect(queryBodies.some((body) => body.query.query.includes('username'))).toBe(false);
  });

  it('returns a disabled learner detail without querying when configuration is incomplete', async () => {
    mockedConfig.posthog.appHost = '';

    await expect(
      PostHogService.getLearnerActivityDetail('user-1', '2026-07-08', '2026-07-09')
    ).resolves.toEqual({
      status: 'disabled',
      range: { start: '2026-07-08', end: '2026-07-09', days: 2 },
      previous_range: { start: '2026-07-06', end: '2026-07-07', days: 2 },
      generated_at: expect.any(String),
      last_activity: null,
      summary: null,
      previous_summary: null,
      daily: [],
      top_pages: [],
      module_breakdown: [],
      hourly: [],
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps a single learner detail with deltas, modules and a China-local heatmap', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          results: [['2026-07-09', '2026-07-09T11:30:00.000Z', 9, 5, 2]],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            ['/experiments/calcite', 3],
            ['/lab/explore', 2],
          ],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            [4, 20, 6],
            [5, 9, 3],
            [0, 1, 4],
          ],
        })
      )
      .mockResolvedValueOnce(jsonResponse({ results: [[4, 2, 1]] }));

    await expect(
      PostHogService.getLearnerActivityDetail('user-1', '2026-07-08', '2026-07-09')
    ).resolves.toEqual({
      status: 'ok',
      range: { start: '2026-07-08', end: '2026-07-09', days: 2 },
      previous_range: { start: '2026-07-06', end: '2026-07-07', days: 2 },
      generated_at: expect.any(String),
      last_activity: '2026-07-09T11:30:00.000Z',
      summary: { meaningful_events: 9, pageviews: 5, learning_actions: 2 },
      previous_summary: { meaningful_events: 4, pageviews: 2, learning_actions: 1 },
      daily: [
        { date: '2026-07-08', events: 0, pageviews: 0, learning_actions: 0 },
        { date: '2026-07-09', events: 9, pageviews: 5, learning_actions: 2 },
      ],
      top_pages: [
        { path: '/experiments/calcite', pageviews: 3 },
        { path: '/lab/explore', pageviews: 2 },
      ],
      module_breakdown: [
        { module: 'module1', label: '实验内容', pageviews: 3 },
        { module: 'module6', label: '虚拟课题', pageviews: 2 },
      ],
      // weekday 0 is out of the 1-7 range PostHog reports, so it is dropped
      hourly: [
        { weekday: 4, hour: 20, count: 6 },
        { weekday: 5, hour: 9, count: 3 },
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    const queryBodies = fetchMock.mock.calls.map(
      (call) => JSON.parse(String(call[1]?.body)) as { query: { query: string }; name: string }
    );
    for (const body of queryBodies) {
      expect(body.query.query).toContain("distinct_id = 'user-1'");
      expect(body.query.query).toContain('properties.$is_identified = true');
      // Admins inspect any account here, so no role filter.
      expect(body.query.query).not.toContain('person.properties.role');
    }
    expect(queryBodies[2]?.query.query).toContain(
      "toDayOfWeek(toTimeZone(timestamp, 'Asia/Shanghai'))"
    );
    expect(queryBodies[2]?.query.query).toContain(
      "toHour(toTimeZone(timestamp, 'Asia/Shanghai'))"
    );
    expect(queryBodies[3]?.query.query).toContain("timestamp >= toDate('2026-07-06')");
    expect(queryBodies[3]?.query.query).toContain(
      "timestamp < toDate('2026-07-07') + INTERVAL 1 DAY"
    );
  });

  it('reports no last activity for a learner without events in the range', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ results: [] }));

    const detail = await PostHogService.getLearnerActivityDetail(
      'user-1',
      '2026-07-08',
      '2026-07-09'
    );

    expect(detail.last_activity).toBeNull();
    expect(detail.summary).toEqual({
      meaningful_events: 0,
      pageviews: 0,
      learning_actions: 0,
    });
    expect(detail.daily).toHaveLength(2);
  });

  it('escapes quotes in the learner id instead of interpolating them raw', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ results: [] }));

    await PostHogService.getLearnerActivityDetail("o'brien", '2026-07-08', '2026-07-09');

    const queryBodies = fetchMock.mock.calls.map(
      (call) => JSON.parse(String(call[1]?.body)) as { query: { query: string } }
    );
    for (const body of queryBodies) {
      expect(body.query.query).toContain("distinct_id = 'o''brien'");
    }
  });
});
