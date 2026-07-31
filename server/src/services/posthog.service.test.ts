import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('PostHogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    mockedConfig.posthog.appHost = 'https://us.posthog.com';
    mockedConfig.posthog.environmentId = 'env-123';
    mockedConfig.posthog.personalApiKey = 'phx_secret';
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
          results: [['2026-05-14T12:00:00.000Z', 42, 11, 7]],
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
    expect(summaryBody.query.query).toContain('properties.$is_identified = true');
    expect(summaryBody.query.query).toContain(
      "event NOT IN ('$autocapture', '$pageleave', '$identify', '$set')"
    );
    expect(summaryBody.query.query).toContain(
      "countIf(event IN ('experiment_opened', 'project_application_submitted'))"
    );
    expect(summaryBody.query.query).not.toContain('person.properties.role');
    expect(summaryBody.query.query).not.toContain('INTERVAL 10 DAY');
  });

  it('returns a null last activity when no filtered events exist in the window', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ results: [{ id: 'person-1' }] }))
      .mockResolvedValueOnce(
        jsonResponse({
          results: [['1970-01-01T00:00:00.000Z', 0, 0, 0]],
        })
      );

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
      },
    });
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
      range: { start: '2026-06-10', end: '2026-07-09', days: 30 },
      generated_at: expect.any(String),
      summary: null,
      daily: [],
      top_pages: [],
      activity_breakdown: [],
      module_breakdown: [],
      top_learners: [],
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
            ['user-1', 'alice', 9, 4, 5, '2026-07-09T12:00:00.000Z'],
            ['user-2', null, 6, 3, 3, null],
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
      );

    await expect(
      PostHogService.getActivityDashboard('2026-07-07', '2026-07-09', 10)
    ).resolves.toEqual({
      status: 'ok',
      range: { start: '2026-07-07', end: '2026-07-09', days: 3 },
      generated_at: expect.any(String),
      summary: {
        active_learners: 3,
        meaningful_events: 18,
        pageviews: 8,
        learning_actions: 10,
      },
      daily: [
        { date: '2026-07-07', active_learners: 0, pageviews: 0, learning_actions: 0 },
        { date: '2026-07-08', active_learners: 2, pageviews: 5, learning_actions: 4 },
        { date: '2026-07-09', active_learners: 3, pageviews: 3, learning_actions: 6 },
      ],
      top_pages: [
        { path: '/courses', pageviews: 5, unique_learners: 2 },
        { path: '/projects/1', pageviews: 3, unique_learners: 2 },
      ],
      activity_breakdown: [
        { event: 'experiment_opened', count: 6, unique_learners: 3 },
        { event: 'project_application_submitted', count: 4, unique_learners: 2 },
      ],
      module_breakdown: [
        {
          module: 'module1',
          label: '实验内容',
          pageviews: 5,
          unique_learners: 1,
          learners: [{ user_id: 'user-1', username: 'alice', pageviews: 5 }],
        },
        {
          module: 'other',
          label: '其他页面',
          pageviews: 3,
          unique_learners: 1,
          learners: [{ user_id: 'user-2', username: 'user-2', pageviews: 3 }],
        },
      ],
      top_learners: [
        {
          user_id: 'user-1',
          username: 'alice',
          display_name: 'alice',
          events: 9,
          pageviews: 4,
          learning_actions: 5,
          last_activity: '2026-07-09T12:00:00.000Z',
        },
        {
          user_id: 'user-2',
          username: 'user-2',
          display_name: 'user-2',
          events: 6,
          pageviews: 3,
          learning_actions: 3,
          last_activity: null,
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(6);
    const queryBodies = fetchMock.mock.calls.map((call) =>
      JSON.parse(String(call[1]?.body)) as { query: { query: string }; name: string }
    );
    for (const body of queryBodies) {
      expect(body.query.query).toContain(
        "timestamp >= toDate('2026-07-07')"
      );
      expect(body.query.query).toContain(
        "timestamp < toDate('2026-07-09') + INTERVAL 1 DAY"
      );
      expect(body.query.query).toContain("person.properties.role = 'user'");
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
        "countIf(event IN ('experiment_opened', 'project_application_submitted'))"
      );
    }
    expect(queryBodies[4]?.query.query).toContain('LIMIT 10');
    expect(queryBodies[4]?.query.query).toContain('argMax(distinct_id, timestamp)');
    expect(queryBodies[4]?.query.query).toContain('GROUP BY person_id');
    expect(queryBodies[5]?.query.query).toContain('GROUP BY 1, person_id');
    expect(queryBodies[5]?.query.query).not.toContain('LIMIT');
  });

  it('omits the learner limit when all learners are requested', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ results: [[]] }));

    await PostHogService.getActivityDashboard('2026-07-08', '2026-07-09', null);

    const queryBodies = fetchMock.mock.calls.map((call) =>
      JSON.parse(String(call[1]?.body)) as { query: { query: string }; name: string }
    );
    const learnersQuery = queryBodies.find(
      (body) => body.name === 'admin learner activity top learners'
    );
    expect(learnersQuery).toBeDefined();
    expect(learnersQuery?.query.query).toContain('GROUP BY person_id');
    expect(learnersQuery?.query.query).not.toContain('LIMIT');
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
});
