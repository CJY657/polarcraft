/**
 * MongoDB Database Connection
 * MongoDB 数据库连接
 */

import { Db, MongoClient, type IndexDescription } from 'mongodb';
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
      { key: { expires_at: 1 }, name: 'idx_expires_at' },
    ],
  },
  {
    name: 'password_reset_tokens',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { token: 1 }, unique: true, name: 'unique_token' },
      { key: { user_id: 1 }, name: 'idx_user_id' },
      { key: { expires_at: 1 }, name: 'idx_expires_at' },
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
      { key: { target_media_id: 1 }, name: 'idx_target_media_id' },
    ],
  },
  {
    name: 'user_notifications',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { user_id: 1, created_at: -1 }, name: 'idx_user_created' },
      { key: { user_id: 1, is_read: 1 }, name: 'idx_user_read' },
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
      { key: { is_public: 1, updated_at: -1 }, name: 'idx_public_updated' },
      { key: { updated_at: -1 }, name: 'idx_updated_at' },
    ],
  },
  {
    name: 'research_project_members',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1, user_id: 1 }, unique: true, name: 'unique_membership' },
      { key: { user_id: 1, project_id: 1 }, name: 'idx_user_project' },
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
      { key: { status: 1 }, name: 'idx_status' },
    ],
  },
  {
    name: 'research_edges',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { canvas_id: 1 }, name: 'idx_canvas_id' },
      { key: { source_node_id: 1, target_node_id: 1 }, name: 'idx_nodes' },
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
      { key: { user_id: 1, created_at: -1 }, name: 'idx_user_created' },
    ],
  },
  {
    name: 'research_activity_log',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1, created_at: -1 }, name: 'idx_project_created' },
      { key: { target_type: 1, target_id: 1 }, name: 'idx_target' },
    ],
  },
  {
    name: 'research_project_settings',
    indexes: [
      { key: { id: 1 }, unique: true, name: 'unique_id' },
      { key: { project_id: 1 }, unique: true, name: 'unique_project_id' },
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
      { key: { status: 1 }, name: 'idx_status' },
    ],
  },
];

async function ensureIndexes(db: Db): Promise<void> {
  if (indexesInitialized) {
    return;
  }

  for (const collection of COLLECTION_INDEXES) {
    if (collection.indexes.length === 0) {
      continue;
    }

    await db.collection(collection.name).createIndexes(
      collection.indexes
    );
  }

  indexesInitialized = true;
  logger.info('MongoDB indexes ensured');
}

export async function connectDatabase(): Promise<Db> {
  if (database) {
    return database;
  }

  client = new MongoClient(config.database.uri, {
    maxPoolSize: config.database.maxPoolSize,
  });

  await client.connect();
  database = client.db(config.database.name);

  await ensureIndexes(database);
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
