import { config } from '../config/index.js';
import {
  AdminUserActivityDashboardResponse,
  AdminUserActivityDateRange,
  AdminUserActivityDetailResponse,
  AdminUserActivityModuleBreakdown,
  AdminUserActivitySegment,
  AdminUserPostHogAnalyticsResponse,
  AdminUserPostHogPerson,
  AdminUserPostHogSummary,
} from '../types/user.types.js';
import { PublicActivitySnapshot } from '../types/stats.types.js';
import { logger } from '../utils/logger.js';

/** 六大核心模块的路由前缀映射（与 src/App.tsx 保持一致） */
const MODULE_ROUTE_PREFIXES: Array<{ module: string; label: string; prefixes: string[] }> = [
  {
    module: 'module1',
    label: '实验内容',
    prefixes: ['/experiments', '/applications', '/units', '/courses', '/timeline', '/chronicles'],
  },
  { module: 'module2', label: '偏振挑战', prefixes: ['/devices', '/quiz'] },
  { module: 'module3', label: '理论模拟', prefixes: ['/demos'] },
  { module: 'module4', label: '游戏挑战', prefixes: ['/games'] },
  { module: 'module5', label: '成果展示', prefixes: ['/gallery'] },
  { module: 'module6', label: '虚拟课题', prefixes: ['/lab'] },
];

const OTHER_MODULE = { module: 'other', label: '其他页面' };

/**
 * 学习行为 = 进入实验 + 虚拟课题组的主动参与（创建课题、提交申请、讨论发言、
 * 提交研究证据、完成任务）。浏览类动作不计入，它们已经算在页面访问里。
 */
const LEARNING_EVENTS = [
  'experiment_opened',
  'project_application_submitted',
  'research_project_created',
  'research_discussion_posted',
  'research_evidence_submitted',
  'research_task_completed',
];

const LEARNING_EVENT_PREDICATE = `event IN (${LEARNING_EVENTS.map((event) => `'${event}'`).join(', ')})`;

function classifyModule(path: string): { module: string; label: string } {
  for (const entry of MODULE_ROUTE_PREFIXES) {
    if (
      entry.prefixes.some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`)
      )
    ) {
      return { module: entry.module, label: entry.label };
    }
  }
  return OTHER_MODULE;
}

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
  private static readonly SUMMARY_WINDOW_DAYS = 10;

  private static readonly LEARNING_EVENT_PREDICATE = LEARNING_EVENT_PREDICATE;

  /** Prefer the SPA-reported path, fall back to the raw URL. */
  private static readonly PATH_EXPRESSION = `
      coalesce(
        nullIf(toString(properties.pathname), ''),
        nullIf(toString(properties.route), ''),
        toString(properties.$current_url)
      )
    `;

  private static readonly TIMEZONE = 'Asia/Shanghai';

  static async getUserAnalytics(
    userId: string
  ): Promise<AdminUserPostHogAnalyticsResponse> {
    if (!this.isEnabled()) {
      return {
        status: 'disabled',
        person: null,
        summary: null,
      };
    }

    const person = await this.getPerson(userId);
    if (!person) {
      return {
        status: 'not_found',
        person: null,
        summary: null,
      };
    }

    const summary = await this.getSummary(userId);

    return {
      status: 'ok',
      person,
      summary,
    };
  }

  static async getActivityDashboard(
    start: string,
    end: string,
    userLimit: number | null,
    segment: AdminUserActivitySegment = 'student'
  ): Promise<AdminUserActivityDashboardResponse> {
    const generatedAt = new Date().toISOString();
    const range = this.computeRange(start, end);
    const rangeDays = range.days;
    if (!this.isEnabled()) {
      return {
        status: 'disabled',
        segment,
        range,
        generated_at: generatedAt,
        summary: null,
        previous_summary: null,
        daily: [],
        top_pages: [],
        activity_breakdown: [],
        module_breakdown: [],
        top_users: [],
      };
    }

    const learningEventPredicate = this.LEARNING_EVENT_PREDICATE;
    const filter = this.activityFilter(start, end, segment);
    const pathExpression = this.PATH_EXPRESSION;
    const summaryQuery = (windowFilter: string) => `
            SELECT
              count(DISTINCT person_id),
              count(),
              countIf(event = '$pageview'),
              countIf(${learningEventPredicate})
            FROM events
            WHERE ${windowFilter}
        `;
    const [summaryResponse, dailyResponse, pagesResponse] = await Promise.all([
      this.runQuery(summaryQuery(filter), 'admin user activity summary'),
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
            ORDER BY day
            LIMIT ${rangeDays}
        `,
        'admin user activity daily'
      ),
      this.runQuery(
        `
            SELECT
              ${pathExpression},
              count(),
              count(DISTINCT person_id)
            FROM events
            WHERE ${filter}
              AND event = '$pageview'
            GROUP BY 1
            ORDER BY count() DESC
            LIMIT 10
        `,
        'admin user activity top pages'
      ),
    ]);
    const [breakdownResponse, usersResponse, moduleResponse] = await Promise.all([
      this.runQuery(
        `
            SELECT event, count(), count(DISTINCT person_id)
            FROM events
            WHERE ${filter}
            GROUP BY event
            ORDER BY count() DESC
            LIMIT 10
        `,
        'admin user activity breakdown'
      ),
      this.runQuery(
        `
            SELECT
              argMax(distinct_id, timestamp),
              any(person.properties.username),
              any(person.properties.user_type),
              count(),
              countIf(event = '$pageview'),
              countIf(${learningEventPredicate}),
              toString(max(timestamp))
            FROM events
            WHERE ${filter}
            GROUP BY person_id
            ORDER BY count() DESC
            ${userLimit === null ? '' : `LIMIT ${userLimit}`}
        `,
        'admin user activity top users'
      ),
      this.runQuery(
        `
            SELECT
              ${pathExpression},
              argMax(distinct_id, timestamp),
              any(person.properties.username),
              count()
            FROM events
            WHERE ${filter}
              AND event = '$pageview'
            GROUP BY 1, person_id
        `,
        'admin user activity module usage'
      ),
    ]);

    const summaryRow = this.extractRows(summaryResponse)[0] ?? [];

    // Run last and alone: PostHog throttles bursts, and the batches above
    // already saturate the concurrency the upstream tolerates.
    const previousRange = this.previousRange(range);
    const previousRow =
      this.extractRows(
        await this.runQuery(
          summaryQuery(
            this.activityFilter(previousRange.start, previousRange.end, segment)
          ),
          'admin user activity previous summary'
        )
      )[0] ?? [];

    return {
      status: 'ok',
      segment,
      range,
      generated_at: generatedAt,
      summary: {
        active_users: this.numberOrZero(summaryRow[0]),
        meaningful_events: this.numberOrZero(summaryRow[1]),
        pageviews: this.numberOrZero(summaryRow[2]),
        learning_actions: this.numberOrZero(summaryRow[3]),
      },
      previous_summary: {
        range: previousRange,
        active_users: this.numberOrZero(previousRow[0]),
        meaningful_events: this.numberOrZero(previousRow[1]),
        pageviews: this.numberOrZero(previousRow[2]),
        learning_actions: this.numberOrZero(previousRow[3]),
      },
      daily: this.buildDailySeries(start, end, this.extractRows(dailyResponse)),
      top_pages: this.extractRows(pagesResponse)
        .filter((row) => typeof row[0] === 'string' && row[0].length > 0)
        .map((row) => ({
          path: this.pathFrom(row[0] as string),
          pageviews: this.numberOrZero(row[1]),
          unique_users: this.numberOrZero(row[2]),
        })),
      activity_breakdown: this.extractRows(breakdownResponse)
        .filter((row) => typeof row[0] === 'string')
        .map((row) => ({
          event: row[0] as string,
          count: this.numberOrZero(row[1]),
          unique_users: this.numberOrZero(row[2]),
        })),
      module_breakdown: this.buildModuleBreakdown(this.extractRows(moduleResponse)),
      top_users: this.extractRows(usersResponse)
        .filter(
          (row) =>
            typeof row[0] === 'string' &&
            (row[2] === 'student' || row[2] === 'teacher')
        )
        .map((row) => ({
          user_id: row[0] as string,
          username: typeof row[1] === 'string' && row[1] ? row[1] : (row[0] as string),
          display_name: typeof row[1] === 'string' && row[1] ? row[1] : (row[0] as string),
          user_type: row[2] as 'student' | 'teacher',
          events: this.numberOrZero(row[3]),
          pageviews: this.numberOrZero(row[4]),
          learning_actions: this.numberOrZero(row[5]),
          last_activity: this.stringOrNull(row[6]),
        })),
    };
  }

  /**
   * Snapshot behind the public 学习热度 page. Uses the same learner-only,
   * meaningful-event filter as the admin dashboard, and returns the *full*
   * learner list keyed by user id — the caller anonymizes before responding.
   */
  static async getPublicActivitySnapshot(
    start: string,
    end: string
  ): Promise<PublicActivitySnapshot> {
    const generatedAt = new Date().toISOString();
    const range = this.computeRange(start, end);
    if (!this.isEnabled()) {
      return {
        status: 'disabled',
        range,
        generated_at: generatedAt,
        summary: null,
        daily: [],
        top_pages: [],
        learners: [],
      };
    }

    const filter = this.activityFilter(start, end, 'student');
    const [dailyResponse, pagesResponse, learnersResponse] = await Promise.all([
      this.runQuery(
        `
            SELECT
              toDate(timestamp) AS day,
              count(DISTINCT person_id),
              countIf(event = '$pageview'),
              countIf(${this.LEARNING_EVENT_PREDICATE})
            FROM events
            WHERE ${filter}
            GROUP BY day
            ORDER BY day
            LIMIT ${range.days}
        `,
        'public activity daily'
      ),
      this.runQuery(
        `
            SELECT
              ${this.PATH_EXPRESSION},
              count()
            FROM events
            WHERE ${filter}
              AND event = '$pageview'
            GROUP BY 1
            ORDER BY count() DESC
            LIMIT 10
        `,
        'public activity top pages'
      ),
      this.runQuery(
        `
            SELECT
              argMax(distinct_id, timestamp),
              count(),
              countIf(event = '$pageview'),
              countIf(${this.LEARNING_EVENT_PREDICATE})
            FROM events
            WHERE ${filter}
            GROUP BY person_id
            ORDER BY count() DESC
        `,
        'public activity learners'
      ),
    ]);

    const learners = this.extractRows(learnersResponse)
      .filter((row) => typeof row[0] === 'string' && row[0].length > 0)
      .map((row) => ({
        user_id: row[0] as string,
        events: this.numberOrZero(row[1]),
        pageviews: this.numberOrZero(row[2]),
        learning_actions: this.numberOrZero(row[3]),
      }));

    return {
      status: 'ok',
      range,
      generated_at: generatedAt,
      // Derived from the learner rows so the window needs no extra query:
      // one row per distinct learner already means one count per learner.
      summary: {
        active_learners: learners.length,
        pageviews: learners.reduce((total, learner) => total + learner.pageviews, 0),
        learning_actions: learners.reduce(
          (total, learner) => total + learner.learning_actions,
          0
        ),
      },
      daily: this.buildPublicDailySeries(start, end, this.extractRows(dailyResponse)),
      top_pages: this.extractRows(pagesResponse)
        .filter((row) => typeof row[0] === 'string' && row[0].length > 0)
        .map((row) => ({
          path: this.pathFrom(row[0] as string),
          pageviews: this.numberOrZero(row[1]),
        })),
      learners,
    };
  }

  /**
   * One learner's activity over a range, plus the preceding equal-length
   * window for deltas. Scoped by distinct_id, so — like the 10-day drawer
   * summary — it deliberately skips the `role = 'user'` filter.
   */
  static async getLearnerActivityDetail(
    userId: string,
    start: string,
    end: string
  ): Promise<Omit<AdminUserActivityDetailResponse, 'user_type'>> {
    const generatedAt = new Date().toISOString();
    const range = this.computeRange(start, end);
    const previousRange = this.previousRange(range);
    if (!this.isEnabled()) {
      return {
        status: 'disabled',
        range,
        previous_range: previousRange,
        generated_at: generatedAt,
        last_activity: null,
        summary: null,
        previous_summary: null,
        daily: [],
        top_pages: [],
        module_breakdown: [],
        hourly: [],
      };
    }

    const filter = this.learnerFilter(userId, start, end);
    const [dailyResponse, pagesResponse, hourlyResponse] = await Promise.all([
      this.runQuery(
        `
            SELECT
              toDate(timestamp) AS day,
              toString(max(timestamp)),
              count(),
              countIf(event = '$pageview'),
              countIf(${this.LEARNING_EVENT_PREDICATE})
            FROM events
            WHERE ${filter}
            GROUP BY day
            ORDER BY day
            LIMIT ${range.days}
        `,
        'admin learner detail daily'
      ),
      this.runQuery(
        `
            SELECT
              ${this.PATH_EXPRESSION},
              count()
            FROM events
            WHERE ${filter}
              AND event = '$pageview'
            GROUP BY 1
            ORDER BY count() DESC
            LIMIT 200
        `,
        'admin learner detail pages'
      ),
      this.runQuery(
        `
            SELECT
              toDayOfWeek(toTimeZone(timestamp, '${this.TIMEZONE}')),
              toHour(toTimeZone(timestamp, '${this.TIMEZONE}')),
              count()
            FROM events
            WHERE ${filter}
            GROUP BY 1, 2
        `,
        'admin learner detail hourly'
      ),
    ]);

    const previousRow =
      this.extractRows(
        await this.runQuery(
          `
            SELECT
              count(),
              countIf(event = '$pageview'),
              countIf(${this.LEARNING_EVENT_PREDICATE})
            FROM events
            WHERE ${this.learnerFilter(userId, previousRange.start, previousRange.end)}
        `,
          'admin learner detail previous summary'
        )
      )[0] ?? [];

    const dailyRows = this.extractRows(dailyResponse).filter(
      (row) => typeof row[0] === 'string'
    );
    const byDate = new Map(
      dailyRows.map((row) => [
        row[0] as string,
        {
          date: row[0] as string,
          events: this.numberOrZero(row[2]),
          pageviews: this.numberOrZero(row[3]),
          learning_actions: this.numberOrZero(row[4]),
        },
      ])
    );
    const daily = this.denseDates(start, end).map(
      (date) =>
        byDate.get(date) ?? { date, events: 0, pageviews: 0, learning_actions: 0 }
    );
    const summary = daily.reduce(
      (totals, day) => ({
        meaningful_events: totals.meaningful_events + day.events,
        pageviews: totals.pageviews + day.pageviews,
        learning_actions: totals.learning_actions + day.learning_actions,
      }),
      { meaningful_events: 0, pageviews: 0, learning_actions: 0 }
    );
    // rows are ordered by day, so the last one carries the newest timestamp
    const lastActivity =
      summary.meaningful_events === 0
        ? null
        : this.stringOrNull(dailyRows[dailyRows.length - 1]?.[1]);

    const pageRows = this.extractRows(pagesResponse)
      .filter((row) => typeof row[0] === 'string' && row[0].length > 0)
      .map((row) => ({
        path: this.pathFrom(row[0] as string),
        pageviews: this.numberOrZero(row[1]),
      }));

    return {
      status: 'ok',
      range,
      previous_range: previousRange,
      generated_at: generatedAt,
      last_activity: lastActivity,
      summary,
      previous_summary: {
        meaningful_events: this.numberOrZero(previousRow[0]),
        pageviews: this.numberOrZero(previousRow[1]),
        learning_actions: this.numberOrZero(previousRow[2]),
      },
      daily,
      top_pages: pageRows.slice(0, 10),
      module_breakdown: this.buildLearnerModules(pageRows),
      hourly: this.extractRows(hourlyResponse)
        .map((row) => ({
          weekday: this.numberOrZero(row[0]),
          hour: this.numberOrZero(row[1]),
          count: this.numberOrZero(row[2]),
        }))
        .filter((cell) => cell.weekday >= 1 && cell.weekday <= 7 && cell.count > 0),
    };
  }

  /** Roll one learner's per-path pageviews up into the six core modules. */
  private static buildLearnerModules(
    pages: Array<{ path: string; pageviews: number }>
  ): AdminUserActivityDetailResponse['module_breakdown'] {
    const totals = new Map<string, { module: string; label: string; pageviews: number }>();
    for (const page of pages) {
      const { module, label } = classifyModule(page.path);
      const entry = totals.get(module);
      if (entry) {
        entry.pageviews += page.pageviews;
      } else {
        totals.set(module, { module, label, pageviews: page.pageviews });
      }
    }

    return [...MODULE_ROUTE_PREFIXES.map((entry) => entry.module), OTHER_MODULE.module]
      .map((moduleKey) => totals.get(moduleKey))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }

  /**
   * Aggregate per-(path, user) pageview rows into per-module totals with
   * the users who visited each module.
   */
  private static buildModuleBreakdown(
    rows: unknown[][]
  ): AdminUserActivityModuleBreakdown[] {
    const modules = new Map<
      string,
      {
        module: string;
        label: string;
        pageviews: number;
        users: Map<string, { user_id: string; username: string; pageviews: number }>;
      }
    >();

    for (const row of rows) {
      if (typeof row[0] !== 'string' || typeof row[1] !== 'string') continue;
      const path = this.pathFrom(row[0]);
      const userId = row[1];
      const username = typeof row[2] === 'string' && row[2] ? row[2] : userId;
      const pageviews = this.numberOrZero(row[3]);
      const { module, label } = classifyModule(path);

      let entry = modules.get(module);
      if (!entry) {
        entry = { module, label, pageviews: 0, users: new Map() };
        modules.set(module, entry);
      }
      entry.pageviews += pageviews;
      const user = entry.users.get(userId);
      if (user) {
        user.pageviews += pageviews;
      } else {
        entry.users.set(userId, { user_id: userId, username, pageviews });
      }
    }

    const ordered = [
      ...MODULE_ROUTE_PREFIXES.map((entry) => entry.module),
      OTHER_MODULE.module,
    ];

    return ordered
      .map((moduleKey) => modules.get(moduleKey))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .map((entry) => ({
        module: entry.module,
        label: entry.label,
        pageviews: entry.pageviews,
        unique_users: entry.users.size,
        users: [...entry.users.values()].sort(
          (a, b) => b.pageviews - a.pageviews
        ),
      }));
  }

  private static buildDailySeries(
    start: string,
    end: string,
    rows: unknown[][]
  ): AdminUserActivityDashboardResponse['daily'] {
    const valuesByDate = new Map<string, AdminUserActivityDashboardResponse['daily'][number]>();

    for (const row of rows) {
      if (typeof row[0] !== 'string') continue;
      valuesByDate.set(row[0], {
        date: row[0],
        active_users: this.numberOrZero(row[1]),
        pageviews: this.numberOrZero(row[2]),
        learning_actions: this.numberOrZero(row[3]),
      });
    }

    const daily: AdminUserActivityDashboardResponse['daily'] = [];
    for (const date of this.denseDates(start, end)) {
      daily.push(
        valuesByDate.get(date) ?? {
          date,
          active_users: 0,
          pageviews: 0,
          learning_actions: 0,
        }
      );
    }

    return daily;
  }

  private static buildPublicDailySeries(
    start: string,
    end: string,
    rows: unknown[][]
  ): PublicActivitySnapshot['daily'] {
    const valuesByDate = new Map<string, PublicActivitySnapshot['daily'][number]>();

    for (const row of rows) {
      if (typeof row[0] !== 'string') continue;
      valuesByDate.set(row[0], {
        date: row[0],
        active_learners: this.numberOrZero(row[1]),
        pageviews: this.numberOrZero(row[2]),
        learning_actions: this.numberOrZero(row[3]),
      });
    }

    return this.denseDates(start, end).map(
      (date) =>
        valuesByDate.get(date) ?? {
          date,
          active_learners: 0,
          pageviews: 0,
          learning_actions: 0,
        }
    );
  }

  /** Every YYYY-MM-DD from start to end, inclusive. */
  private static denseDates(start: string, end: string): string[] {
    const dates: string[] = [];
    const endTimestamp = Date.parse(`${end}T00:00:00Z`);
    for (
      let timestamp = Date.parse(`${start}T00:00:00Z`);
      timestamp <= endTimestamp;
      timestamp += 86_400_000
    ) {
      dates.push(new Date(timestamp).toISOString().slice(0, 10));
    }
    return dates;
  }

  private static computeRange(start: string, end: string): AdminUserActivityDateRange {
    const days =
      Math.round(
        (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000
      ) + 1;
    return { start, end, days };
  }

  /** The equal-length window immediately before `range`. */
  private static previousRange(range: AdminUserActivityDateRange): AdminUserActivityDateRange {
    const startTimestamp = Date.parse(`${range.start}T00:00:00Z`);
    return {
      start: new Date(startTimestamp - range.days * 86_400_000).toISOString().slice(0, 10),
      end: new Date(startTimestamp - 86_400_000).toISOString().slice(0, 10),
      days: range.days,
    };
  }

  /** Aggregate filter: identified, classified users in the selected segment. */
  private static activityFilter(
    start: string,
    end: string,
    segment: AdminUserActivitySegment
  ): string {
    const userTypePredicate =
      segment === 'all'
        ? "person.properties.user_type IN ('student', 'teacher')"
        : `person.properties.user_type = ${this.quoteLiteral(segment)}`;

    return `
      timestamp >= toDate('${start}')
      AND timestamp < toDate('${end}') + INTERVAL 1 DAY
      AND person_id IS NOT NULL
      AND ${userTypePredicate}
      AND properties.$is_identified = true
      AND event NOT IN ('$autocapture', '$pageleave', '$identify', '$set')
    `;
  }

  /** Single-learner filter. No role check: admins inspect any account here. */
  private static learnerFilter(userId: string, start: string, end: string): string {
    return `
      timestamp >= toDate('${start}')
      AND timestamp < toDate('${end}') + INTERVAL 1 DAY
      AND distinct_id = ${this.quoteLiteral(userId)}
      AND properties.$is_identified = true
      AND event NOT IN ('$autocapture', '$pageleave', '$identify', '$set')
    `;
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
        toDate(timestamp) AS day,
        toString(max(timestamp)) AS last_activity,
        count() AS meaningful_events,
        countIf(event = '$pageview') AS pageviews,
        countIf(${LEARNING_EVENT_PREDICATE}) AS learning_actions
      FROM events
      WHERE distinct_id = ${this.quoteLiteral(userId)}
        AND timestamp >= toStartOfDay(now()) - INTERVAL ${this.SUMMARY_WINDOW_DAYS - 1} DAY
        AND timestamp < toStartOfDay(now()) + INTERVAL 1 DAY
        AND properties.$is_identified = true
        AND event NOT IN ('$autocapture', '$pageleave', '$identify', '$set')
      GROUP BY day
      ORDER BY day
    `;
    const response = await this.runQuery(query, 'admin user analytics summary');
    const rows = this.extractRows(response).filter(
      (row): row is unknown[] => typeof row[0] === 'string'
    );

    const eventsByDate = new Map<string, number>();
    let lastActivity: string | null = null;
    let meaningfulEvents = 0;
    let pageviews = 0;
    let learningActions = 0;
    for (const row of rows) {
      eventsByDate.set(row[0] as string, this.numberOrZero(row[2]));
      // rows are ordered by day, so the last row carries the newest timestamp
      lastActivity = this.stringOrNull(row[1]) ?? lastActivity;
      meaningfulEvents += this.numberOrZero(row[2]);
      pageviews += this.numberOrZero(row[3]);
      learningActions += this.numberOrZero(row[4]);
    }

    // Fill every day of the window so the trend chart gets a dense series.
    // Day boundaries follow the PostHog project timezone; if that runs ahead of
    // the server's UTC date, extend the window so returned days stay visible.
    const lastRowDate = rows.length > 0 ? (rows[rows.length - 1][0] as string) : null;
    const todayUtc = new Date().toISOString().slice(0, 10);
    const endDate = lastRowDate && lastRowDate > todayUtc ? lastRowDate : todayUtc;
    const endTimestamp = Date.parse(`${endDate}T00:00:00Z`);
    const daily: AdminUserPostHogSummary['daily'] = [];
    for (let offset = this.SUMMARY_WINDOW_DAYS - 1; offset >= 0; offset -= 1) {
      const date = new Date(endTimestamp - offset * 86_400_000).toISOString().slice(0, 10);
      daily.push({ date, events: eventsByDate.get(date) ?? 0 });
    }

    return {
      window_days: this.SUMMARY_WINDOW_DAYS,
      last_activity: meaningfulEvents === 0 ? null : lastActivity,
      meaningful_events: meaningfulEvents,
      pageviews,
      learning_actions: learningActions,
      daily,
    };
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
