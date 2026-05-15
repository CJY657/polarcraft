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
      recent_events: [],
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns not_found when PostHog has no person for the requested distinct id', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ results: [] }));

    await expect(PostHogService.getUserAnalytics('user-1')).resolves.toEqual({
      status: 'not_found',
      person: null,
      summary: null,
      recent_events: [],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps person, 30-day summary, and recent meaningful events from PostHog responses', async () => {
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
          results: [[42, 11]],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            ['project_opened', '2026-05-14T12:00:00.000Z', '/projects/1', 'https://example.com/projects/1'],
            ['$pageview', '2026-05-14T11:00:00.000Z', '/courses', 'https://example.com/courses'],
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
        window_days: 30,
        event_count_30d: 42,
        pageview_count_30d: 11,
      },
      recent_events: [
        {
          event: 'project_opened',
          timestamp: '2026-05-14T12:00:00.000Z',
          route: '/projects/1',
          url: 'https://example.com/projects/1',
        },
        {
          event: '$pageview',
          timestamp: '2026-05-14T11:00:00.000Z',
          route: '/courses',
          url: 'https://example.com/courses',
        },
      ],
    });

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
    expect(summaryBody.query.query).toContain("event NOT IN ('$autocapture', '$pageleave')");

    const recentEventsBody = JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body)) as {
      query: { query: string };
      name: string;
    };
    expect(recentEventsBody.name).toBe('admin user analytics recent events');
    expect(recentEventsBody.query.query).toContain('ORDER BY timestamp DESC');
    expect(recentEventsBody.query.query).toContain('LIMIT 10');
    expect(recentEventsBody.query.query).toContain("event NOT IN ('$autocapture', '$pageleave')");
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
        message: 'PostHog 查询失败，请稍后重试',
      })
    );

    try {
      await PostHogService.getUserAnalytics('user-1');
    } catch (error) {
      expect(error).toBeInstanceOf(PostHogAnalyticsError);
      expect(String(error)).not.toContain('phx_secret');
    }
  });
});
