import { config } from '../config/index.js';
import {
  AdminUserActivityDashboardResponse,
  AdminUserActivityRange,
  AdminUserPostHogAnalyticsResponse,
  AdminUserPostHogPerson,
  AdminUserPostHogRecentEvent,
  AdminUserPostHogSummary,
} from '../types/user.types.js';
import { logger } from '../utils/logger.js';

type PostHogPersonResponse = {
  results?: Array<{
    id?: string | number;
    uuid?: string | null;
    created_at?: string | null;
    last_seen_at?: string | null;
  }>;
};

type PostHogQueryResponse = {
  results?: unknown[][];
  query_status?: {
    results?: unknown[][];
  };
};

export class PostHogAnalyticsError extends Error {
  readonly code = 'POSTHOG_QUERY_FAILED';
  readonly statusCode = 502;

  constructor() {
    super('行为数据查询失败，请稍后重试');
    this.name = 'PostHogAnalyticsError';
  }
}

export class PostHogService {
  private static readonly SUMMARY_WINDOW_DAYS = 30;

  static async getUserAnalytics(
    userId: string
  ): Promise<AdminUserPostHogAnalyticsResponse> {
    if (!this.isEnabled()) {
      return {
        status: 'disabled',
        person: null,
        summary: null,
        recent_events: [],
      };
    }

    const person = await this.getPerson(userId);
    if (!person) {
      return {
        status: 'not_found',
        person: null,
        summary: null,
        recent_events: [],
      };
    }

    const [summary, recentEvents] = await Promise.all([
      this.getSummary(userId),
      this.getRecentEvents(userId),
    ]);

    return {
      status: 'ok',
      person,
      summary,
      recent_events: recentEvents,
    };
  }

  static async getActivityDashboard(
    days: AdminUserActivityRange
  ): Promise<AdminUserActivityDashboardResponse> {
    const generatedAt = new Date().toISOString();
    if (!this.isEnabled()) {
      return {
        status: 'disabled',
        days,
        generated_at: generatedAt,
        summary: null,
        daily: [],
        top_pages: [],
        activity_breakdown: [],
        top_learners: [],
      };
    }

    const startOffsetDays = days - 1;
    const learningEventPredicate =
      "event IN ('experiment_opened', 'project_application_submitted')";
    const filter = `
      timestamp >= today() - INTERVAL ${startOffsetDays} DAY
      AND timestamp < today() + INTERVAL 1 DAY
      AND person_id IS NOT NULL
      AND person.properties.role = 'user'
      AND properties.$is_identified = true
      AND event NOT IN ('$autocapture', '$pageleave', '$identify', '$set')
    `;
    const [summaryResponse, dailyResponse, pagesResponse] = await Promise.all([
      this.runQuery(
        `
            SELECT
              count(DISTINCT person_id),
              count(),
              countIf(event = '$pageview'),
              countIf(${learningEventPredicate})
            FROM events
            WHERE ${filter}
        `,
        'admin learner activity summary'
      ),
      this.runQuery(
        `
            SELECT
              toDate(timestamp) AS day,
              count(DISTINCT person_id),
              countIf(event = '$pageview'),
              countIf(${learningEventPredicate})
            FROM events
            WHERE ${filter}
            GROUP BY day
            ORDER BY day WITH FILL
              FROM today() - INTERVAL ${startOffsetDays} DAY
              TO today() + INTERVAL 1 DAY
              STEP INTERVAL 1 DAY
            LIMIT ${days}
        `,
        'admin learner activity daily'
      ),
      this.runQuery(
        `
            SELECT
              coalesce(
                nullIf(toString(properties.pathname), ''),
                nullIf(toString(properties.route), ''),
                toString(properties.$current_url)
              ),
              count(),
              count(DISTINCT person_id)
            FROM events
            WHERE ${filter}
              AND event = '$pageview'
            GROUP BY 1
            ORDER BY count() DESC
            LIMIT 10
        `,
        'admin learner activity top pages'
      ),
    ]);
    const [breakdownResponse, learnersResponse] = await Promise.all([
      this.runQuery(
        `
            SELECT event, count(), count(DISTINCT person_id)
            FROM events
            WHERE ${filter}
            GROUP BY event
            ORDER BY count() DESC
            LIMIT 10
        `,
        'admin learner activity breakdown'
      ),
      this.runQuery(
        `
            SELECT
              argMax(distinct_id, timestamp),
              any(person.properties.username),
              count(),
              countIf(event = '$pageview'),
              countIf(${learningEventPredicate}),
              toString(max(timestamp))
            FROM events
            WHERE ${filter}
            GROUP BY person_id
            ORDER BY count() DESC
            LIMIT 10
        `,
        'admin learner activity top learners'
      ),
    ]);

    const summaryRow = this.extractRows(summaryResponse)[0] ?? [];

    return {
      status: 'ok',
      days,
      generated_at: generatedAt,
      summary: {
        active_learners: this.numberOrZero(summaryRow[0]),
        meaningful_events: this.numberOrZero(summaryRow[1]),
        pageviews: this.numberOrZero(summaryRow[2]),
        learning_actions: this.numberOrZero(summaryRow[3]),
      },
      daily: this.extractRows(dailyResponse)
        .filter((row) => typeof row[0] === 'string')
        .map((row) => ({
          date: row[0] as string,
          active_learners: this.numberOrZero(row[1]),
          pageviews: this.numberOrZero(row[2]),
          learning_actions: this.numberOrZero(row[3]),
        })),
      top_pages: this.extractRows(pagesResponse)
        .filter((row) => typeof row[0] === 'string' && row[0].length > 0)
        .map((row) => ({
          path: this.pathFrom(row[0] as string),
          pageviews: this.numberOrZero(row[1]),
          unique_learners: this.numberOrZero(row[2]),
        })),
      activity_breakdown: this.extractRows(breakdownResponse)
        .filter((row) => typeof row[0] === 'string')
        .map((row) => ({
          event: row[0] as string,
          count: this.numberOrZero(row[1]),
          unique_learners: this.numberOrZero(row[2]),
        })),
      top_learners: this.extractRows(learnersResponse)
        .filter((row) => typeof row[0] === 'string')
        .map((row) => ({
          user_id: row[0] as string,
          username: typeof row[1] === 'string' && row[1] ? row[1] : (row[0] as string),
          events: this.numberOrZero(row[2]),
          pageviews: this.numberOrZero(row[3]),
          learning_actions: this.numberOrZero(row[4]),
          last_activity: this.stringOrNull(row[5]),
        })),
    };
  }

  private static isEnabled(): boolean {
    return Boolean(
      config.posthog.appHost &&
        config.posthog.environmentId &&
        config.posthog.personalApiKey
    );
  }

  private static async getPerson(userId: string): Promise<AdminUserPostHogPerson | null> {
    const search = new URLSearchParams({
      distinct_id: userId,
      limit: '1',
    });
    const response = await this.request<PostHogPersonResponse>(
      `/api/environments/${config.posthog.environmentId}/persons/?${search.toString()}`
    );
    const person = response.results?.[0];

    if (person?.id === undefined || person.id === null) {
      return null;
    }

    return {
      id: String(person.id),
      uuid: this.stringOrNull(person.uuid),
      created_at: this.stringOrNull(person.created_at),
      last_seen_at: this.stringOrNull(person.last_seen_at),
    };
  }

  private static async getSummary(userId: string): Promise<AdminUserPostHogSummary> {
    const query = `
      SELECT
        count() AS event_count_30d,
        countIf(event = '$pageview') AS pageview_count_30d
      FROM events
      WHERE distinct_id = ${this.quoteLiteral(userId)}
        AND timestamp >= now() - INTERVAL ${this.SUMMARY_WINDOW_DAYS} DAY
        AND event NOT IN ('$autocapture', '$pageleave')
    `;
    const response = await this.runQuery(query, 'admin user analytics summary');
    const row = this.extractRows(response)[0] ?? [];

    return {
      window_days: this.SUMMARY_WINDOW_DAYS,
      event_count_30d: this.numberOrZero(row[0]),
      pageview_count_30d: this.numberOrZero(row[1]),
    };
  }

  private static async getRecentEvents(
    userId: string
  ): Promise<AdminUserPostHogRecentEvent[]> {
    const query = `
      SELECT
        event,
        toString(timestamp),
        properties.route,
        properties.$current_url
      FROM events
      WHERE distinct_id = ${this.quoteLiteral(userId)}
        AND event NOT IN ('$autocapture', '$pageleave')
      ORDER BY timestamp DESC
      LIMIT 10
    `;
    const response = await this.runQuery(query, 'admin user analytics recent events');

    return this.extractRows(response)
      .filter((row): row is [string, string, unknown, unknown] => {
        return typeof row[0] === 'string' && typeof row[1] === 'string';
      })
      .map((row) => ({
        event: row[0],
        timestamp: row[1],
        route: this.stringOrNull(row[2]),
        url: this.stringOrNull(row[3]),
      }));
  }

  private static async runQuery(
    query: string,
    name: string
  ): Promise<PostHogQueryResponse> {
    return this.request<PostHogQueryResponse>(
      `/api/environments/${config.posthog.environmentId}/query/`,
      {
        method: 'POST',
        body: JSON.stringify({
          query: {
            kind: 'HogQLQuery',
            query: query.trim(),
          },
          name,
        }),
      }
    );
  }

  private static async request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${config.posthog.appHost}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.posthog.personalApiKey}`,
          ...(init.headers ?? {}),
        },
      });

      if (!response.ok) {
        throw new Error(`PostHog upstream returned status ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      logger.error('PostHog analytics request failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new PostHogAnalyticsError();
    }
  }

  private static extractRows(response: PostHogQueryResponse): unknown[][] {
    return response.results ?? response.query_status?.results ?? [];
  }

  private static quoteLiteral(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
  }

  private static stringOrNull(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  private static numberOrZero(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private static pathFrom(value: string): string {
    try {
      return new URL(value).pathname;
    } catch {
      return value;
    }
  }
}
