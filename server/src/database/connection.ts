/**
 * MongoDB Database Connection
 * MongoDB 数据库连接
 */

import { Db, MongoClient, type ClientSession, type IndexDescription } from 'mongodb';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

let client: MongoClient | null = null;
let database: Db | null = null;
let indexesInitialized = false;

const COLLECTION_INDEXES: Array<{
  name: string;
  indexes: IndexDescription[];
}> = [
  {
    name: 'users',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { username: 1 }, unique: true, name: 'unique_username' },
      { key: { email: 1 }, name: 'idx_email' },
      { key: { created_at: -1 }, name: 'idx_created_at' },
    ],
  },
  {
    name: 'refresh_tokens',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { token: 1 }, unique: true, name: 'unique_token' },
      { key: { user_id: 1, created_at: -1 }, name: 'idx_user_created' },
      // TTL：过期令牌由 MongoDB 自动清理，避免集合无限增长
      { key: { expires_at: 1 }, name: 'idx_expires_at', expireAfterSeconds: 0 },
      // TTL：已撤销令牌（轮换/登出产生）对业务不可见——所有查询都过滤
      // revoked_at: null——保留 24 小时供排查后自动清理，避免高频轮换令牌
      // 挤占空间。revoked_at 为 null 的活跃令牌不是日期值，不受 TTL 影响。
      { key: { revoked_at: 1 }, name: 'idx_revoked_ttl', expireAfterSeconds: 86_400 },
    ],
  },
  {
    name: 'password_reset_tokens',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { token: 1 }, unique: true, name: 'unique_token' },
      { key: { user_id: 1 }, name: 'idx_user_id' },
      // TTL：过期令牌由 MongoDB 自动清理，避免集合无限增长
      { key: { expires_at: 1 }, name: 'idx_expires_at', expireAfterSeconds: 0 },
    ],
  },
  {
    name: 'units',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { sort_order: 1, created_at: -1 }, name: 'idx_sort_created' },
    ],
  },
  {
    name: 'unit_main_slides',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { unit_id: 1 }, unique: true, name: 'unique_unit_id' },
    ],
  },
  {
    name: 'courses',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { unit_id: 1, sort_order: 1, created_at: 1 }, name: 'idx_unit_sort_created' },
      { key: { created_at: -1 }, name: 'idx_created_at' },
    ],
  },
  {
    name: 'course_main_slides',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { course_id: 1 }, unique: true, name: 'unique_course_id' },
    ],
  },
  {
    name: 'course_media',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { course_id: 1, sort_order: 1, created_at: 1 }, name: 'idx_course_sort_created' },
    ],
  },
  {
    name: 'course_hyperlinks',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { course_id: 1, page: 1, created_at: 1 }, name: 'idx_course_page_created' },
    ],
  },
  {
    name: 'course_discussion_comments',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { course_id: 1, created_at: -1 }, name: 'idx_course_created' },
    ],
  },
  {
    name: 'user_notifications',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { user_id: 1, created_at: -1 }, name: 'idx_user_created' },
      { key: { user_id: 1, is_read: 1 }, name: 'idx_user_read' },
      // TTL：通知是时效性内容（前端只按时间倒序分页展示），半年后自动清理，
      // 避免集合随成员操作的多路广播（insertMany 给全体成员）无限增长。
      { key: { created_at: 1 }, name: 'idx_created_ttl', expireAfterSeconds: 15_552_000 },
      // 组长转让邀请只有七天有效期；部分 TTL 仅索引带到期时间的转让通知，
      // 已接受/拒绝的结果通知继续走上面的半年保留策略。
      {
        key: { expires_at: 1 },
        name: 'idx_leadership_transfer_ttl',
        expireAfterSeconds: 0,
        partialFilterExpression: {
          type: 'leadership_transfer',
          expires_at: { $type: 'date' },
        },
      },
    ],
  },
  {
    name: 'user_educations',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { user_id: 1, start_date: -1, end_date: -1 }, name: 'idx_user_dates' },
    ],
  },
  {
    name: 'research_projects',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { updated_at: -1 }, name: 'idx_updated_at' },
    ],
  },
  {
    name: 'research_project_members',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1, user_id: 1 }, unique: true, name: 'unique_membership' },
      { key: { user_id: 1, active: 1, project_id: 1 }, name: 'idx_user_active_project' },
      { key: { project_id: 1, active: 1, role: 1 }, name: 'idx_project_active_role' },
    ],
  },
  {
    name: 'research_canvases',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1, updated_at: -1 }, name: 'idx_project_updated' },
    ],
  },
  {
    name: 'research_nodes',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { canvas_id: 1 }, name: 'idx_canvas_id' },
    ],
  },
  {
    name: 'research_edges',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { canvas_id: 1 }, name: 'idx_canvas_id' },
    ],
  },
  {
    name: 'research_node_comments',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { node_id: 1, created_at: 1 }, name: 'idx_node_created' },
    ],
  },
  {
    name: 'research_project_comments',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1, created_at: 1 }, name: 'idx_project_created' },
      { key: { parent_comment_id: 1, created_at: 1 }, name: 'idx_parent_created' },
    ],
  },
  {
    name: 'research_project_evidence',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1, created_at: -1 }, name: 'idx_project_created' },
      { key: { project_id: 1, sort_order: 1, created_at: -1 }, name: 'idx_project_sort_created' },
      { key: { project_id: 1, evidence_type: 1 }, name: 'idx_project_type' },
    ],
  },
  {
    name: 'research_project_cycles',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1, cycle_number: 1 }, unique: true, name: 'unique_project_cycle' },
    ],
  },
  {
    name: 'research_project_charters',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1, cycle_id: 1 }, unique: true, name: 'unique_project_cycle' },
    ],
  },
  {
    name: 'research_project_tasks',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1, cycle_id: 1 }, name: 'idx_project_cycle' },
    ],
  },
  {
    name: 'research_project_reviews',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1, cycle_id: 1 }, name: 'idx_project_cycle' },
      // 每位评审者在一个周期内只保留一份评审，配合 upsert 语义防止重复写入
      {
        key: { project_id: 1, cycle_id: 1, reviewer_id: 1 },
        unique: true,
        name: 'unique_project_cycle_reviewer',
      },
    ],
  },
  {
    name: 'research_project_outcomes',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1, cycle_id: 1 }, name: 'idx_project_cycle' },
    ],
  },
  {
    name: 'research_project_meetings',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1, scheduled_at: -1 }, name: 'idx_project_scheduled' },
    ],
  },
  {
    name: 'research_meeting_member_ratings',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      // 每位实到成员对同一会议的同一成员只保留一条互评，配合 upsert 语义防止重复写入
      {
        key: { meeting_id: 1, rater_id: 1, ratee_id: 1 },
        unique: true,
        name: 'unique_meeting_rater_ratee',
      },
      // 排行榜按课题聚合被评人得分
      { key: { project_id: 1, ratee_id: 1 }, name: 'idx_project_ratee' },
    ],
  },
  {
    name: 'research_activity_log',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1, created_at: -1 }, name: 'idx_project_created' },
      // TTL：活动日志是每次课题操作都会追加的派生数据，前端动态只展示最近
      // 50 条；保留一学年（365 天）后自动清理。
      { key: { created_at: 1 }, name: 'idx_created_ttl', expireAfterSeconds: 31_536_000 },
    ],
  },
  {
    name: 'research_project_settings',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1 }, unique: true, name: 'unique_project_id' },
      // visibility 的权威写入方是 services/project-access.service.ts，
      // 它同时负责同步遗留的 research_projects.is_public 字段。
      { key: { visibility: 1, is_recruiting: 1 }, name: 'idx_visibility_recruiting' },
    ],
  },
  {
    name: 'research_project_creator_profiles',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1, user_id: 1 }, unique: true, name: 'unique_project_user' },
    ],
  },
  {
    name: 'research_project_applications',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1, user_id: 1 }, unique: true, name: 'unique_project_user' },
      { key: { project_id: 1, created_at: -1 }, name: 'idx_project_created' },
      { key: { user_id: 1, created_at: -1 }, name: 'idx_user_created' },
    ],
  },
  {
    name: 'quiz_attempts',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { user_id: 1, status: 1, created_at: -1 }, name: 'idx_user_status_created' },
      { key: { status: 1, completed_at: -1 }, name: 'idx_status_completed' },
      // TTL（部分索引）：弃考的作答（开考后一直停留在 in_progress）在到期
      // 30 天后自动清理。状态一旦变为 completed/expired 即脱离部分索引、
      // 永久保留，用户历史与管理端统计不受影响。
      {
        key: { expires_at: 1 },
        name: 'idx_stale_attempt_ttl',
        expireAfterSeconds: 2_592_000,
        partialFilterExpression: { status: 'in_progress' },
      },
    ],
  },
];

/**
 * Indexes that existed in earlier releases but are provably unused by any
 * query in the codebase. Dropped at startup so every environment (local and
 * production) converges to COLLECTION_INDEXES without a manual migration.
 * Dropping an index never changes query results, only the access path.
 * 早期版本创建、但代码中已无任何查询会用到的索引。启动时自动删除，使本地与
 * 生产环境无需手工迁移即可与 COLLECTION_INDEXES 保持一致。删除索引只影响
 * 访问路径，不会改变查询结果。
 */
const DEPRECATED_INDEXES: Array<{ collection: string; index: string }> = [
  // 公开课题的筛选走 research_project_settings.visibility，不再按 is_public/status 查询
  { collection: 'research_projects', index: 'idx_public_updated' },
  { collection: 'research_projects', index: 'idx_status_activity' },
  // 节点状态只在 canvas_id 前缀下过滤；边删除用 $or（含未索引分支）必然全表扫描
  { collection: 'research_nodes', index: 'idx_status' },
  { collection: 'research_edges', index: 'idx_nodes' },
  // target_type/target_id 只写入、从不查询
  { collection: 'research_activity_log', index: 'idx_target' },
  // status 总是与 project_id/user_id 一起查询，前缀索引已覆盖
  { collection: 'research_project_applications', index: 'idx_status' },
  // 两类评论均无按 user_id 的查询
  { collection: 'research_project_comments', index: 'idx_user_created' },
  { collection: 'course_discussion_comments', index: 'idx_user_created' },
  // 只出现在 $or 删除（另一分支 source_media_id 未索引），索引不可用
  { collection: 'course_hyperlinks', index: 'idx_target_media_id' },
];

async function ensureIndexes(db: Db): Promise<void> {
  if (indexesInitialized) {
    return;
  }

  await dropDeprecatedIndexes(db);

  for (const collection of COLLECTION_INDEXES) {
    if (collection.indexes.length === 0) {
      continue;
    }

    await createCollectionIndexes(db, collection.name, collection.indexes);
  }

  indexesInitialized = true;
  logger.info('MongoDB indexes ensured');
}

/**
 * Drop deprecated indexes if present. Codes 26/27 = NamespaceNotFound /
 * IndexNotFound — both mean "already gone" and are safely ignored.
 */
async function dropDeprecatedIndexes(db: Db): Promise<void> {
  for (const { collection, index } of DEPRECATED_INDEXES) {
    try {
      await db.collection(collection).dropIndex(index);
      logger.info(`Dropped deprecated MongoDB index ${collection}.${index}`);
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (code !== 26 && code !== 27) {
        throw error;
      }
    }
  }
}

/**
 * Create indexes, replacing a same-named index whose definition changed
 * (e.g. a TTL option was added). Codes 85/86 = IndexOptionsConflict /
 * IndexKeySpecsConflict.
 */
async function createCollectionIndexes(
  db: Db,
  name: string,
  indexes: IndexDescription[]
): Promise<void> {
  const collection = db.collection(name);
  try {
    await collection.createIndexes(indexes);
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code !== 85 && code !== 86) {
      throw error;
    }

    const existing = (await collection.listIndexes().toArray()) as Array<{
      name: string;
      key: Record<string, unknown>;
      unique?: boolean;
      expireAfterSeconds?: number;
      partialFilterExpression?: Record<string, unknown>;
    }>;
    for (const desired of indexes) {
      const current = existing.find((index) => index.name === desired.name);
      if (!current) {
        continue;
      }
      const changed =
        JSON.stringify(current.key) !== JSON.stringify(desired.key) ||
        Boolean(current.unique) !== Boolean(desired.unique) ||
        current.expireAfterSeconds !== desired.expireAfterSeconds ||
        JSON.stringify(current.partialFilterExpression ?? null) !==
          JSON.stringify(desired.partialFilterExpression ?? null);
      if (changed) {
        logger.info(`Rebuilding MongoDB index ${name}.${String(desired.name)}`);
        await collection.dropIndex(String(desired.name));
      }
    }
    await collection.createIndexes(indexes);
  }
}

export interface ConnectDatabaseOptions {
  ensureIndexes?: boolean;
}

export async function connectDatabase(
  options: ConnectDatabaseOptions = {}
): Promise<Db> {
  const shouldEnsureIndexes = options.ensureIndexes !== false;

  if (database) {
    if (shouldEnsureIndexes) {
      await ensureIndexes(database);
    }
    return database;
  }

  client = new MongoClient(config.database.uri, {
    maxPoolSize: config.database.maxPoolSize,
  });

  await client.connect();
  database = client.db(config.database.name);

  if (shouldEnsureIndexes) {
    await ensureIndexes(database);
  }
  logger.info('MongoDB connection established');

  return database;
}

export function getDb(): Db {
  if (!database) {
    throw new Error('MongoDB connection has not been initialized');
  }

  return database;
}

export function getCollection(name: string) {
  return getDb().collection(name);
}

export async function withDatabaseTransaction<T>(
  operation: (session: ClientSession) => Promise<T>
): Promise<T> {
  if (!client) {
    throw new Error('MongoDB connection has not been initialized');
  }

  return client.withSession((session) => session.withTransaction(() => operation(session)));
}

export async function closeDatabase(): Promise<void> {
  if (!client) {
    return;
  }

  await client.close();
  client = null;
  database = null;
  indexesInitialized = false;
  logger.info('MongoDB connection closed');
}

export async function testConnection(): Promise<boolean> {
  try {
    const db = await connectDatabase();
    await db.command({ ping: 1 });
    logger.info('MongoDB connection test successful');
    return true;
  } catch (error) {
    logger.error('MongoDB connection test failed:', error);
    return false;
  }
}
