import { beforeEach, describe, expect, it, vi } from 'vitest';

const { collection } = vi.hoisted(() => ({
  collection: {
    find: vi.fn(),
    updateOne: vi.fn(),
  },
}));

vi.mock('../database/connection.js', () => ({
  getCollection: () => collection,
}));

import { FeedbackModel } from './feedback.model.js';

/** Every field a feedback document can carry, with a recognisable value. */
const fullDocument = {
  _id: 'mongo-object-id',
  id: 'feedback-1',
  category: 'experiment' as const,
  subject: '冰洲石实验的偏振角标注反了',
  content: '讲义第三页写的是 45 度，实际演示是 135 度。',
  course_id: 'course1',
  course_title: '冰洲石实验',
  source_page: 'course-viewer',
  page_path: '/units/u1/courses/course1',
  contact_name: 'zhangsan（张三）',
  contact_email: 'zhangsan@example.com',
  image_url: '/uploads/courses/feedback/image/screenshot.png',
  user_id: 'user-1',
  username: 'zhangsan',
  user_role: 'user' as const,
  recipient_email: null,
  email_status: 'not_configured' as const,
  email_sent_at: null,
  ip_address: '203.0.113.7',
  user_agent: 'Mozilla/5.0',
  is_public: true,
  created_at: new Date('2026-08-27T00:00:00.000Z'),
};

/**
 * Fields that must never reach a logged-in reader of the public wall.
 * Keeping this list in the test — rather than deriving it from the source —
 * is deliberate: it has to fail when someone widens the projection.
 */
const FORBIDDEN_PUBLIC_FIELDS = [
  '_id',
  'course_id',
  'source_page',
  'page_path',
  'contact_name',
  'contact_email',
  'image_url',
  'user_id',
  'user_role',
  'recipient_email',
  'email_status',
  'email_sent_at',
  'ip_address',
  'user_agent',
] as const;

/** Minimal stand-in for MongoDB inclusion projection semantics. */
function applyProjection(
  document: Record<string, unknown>,
  projection: Record<string, number>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(document).filter(([key]) => projection[key] === 1),
  );
}

function mockFindChain(documents: Array<Record<string, unknown>>) {
  const captured: { query?: unknown; projection?: Record<string, number> } = {};

  collection.find.mockImplementation((query: unknown) => {
    captured.query = query;
    return {
      project: (projection: Record<string, number>) => {
        captured.projection = projection;
        return {
          sort: () => ({
            limit: () => ({
              toArray: async () =>
                documents.map((document) => applyProjection(document, projection)),
            }),
          }),
        };
      },
    };
  });

  return captured;
}

describe('FeedbackModel.listPublic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries only documents explicitly marked public', async () => {
    const captured = mockFindChain([fullDocument]);

    await FeedbackModel.listPublic(30);

    // Legacy documents have no is_public field, so this query cannot match
    // them — that is what keeps them private without a backfill.
    expect(captured.query).toEqual({ is_public: true });
  });

  it.each(FORBIDDEN_PUBLIC_FIELDS)('never exposes %s', async (field) => {
    mockFindChain([fullDocument]);

    const [item] = await FeedbackModel.listPublic(30);

    expect(item).not.toHaveProperty(field);
  });

  it('exposes exactly the whitelisted fields', async () => {
    mockFindChain([fullDocument]);

    const [item] = await FeedbackModel.listPublic(30);

    expect(Object.keys(item as object).sort()).toEqual([
      'category',
      'content',
      'course_title',
      'created_at',
      'id',
      'subject',
      'username',
    ]);
  });
});

describe('FeedbackModel.setVisibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('flips the flag without touching any other field', async () => {
    collection.updateOne.mockResolvedValue({ matchedCount: 1 });

    await expect(FeedbackModel.setVisibility('feedback-1', false)).resolves.toBe(true);

    expect(collection.updateOne).toHaveBeenCalledWith(
      { id: 'feedback-1' },
      { $set: { is_public: false } },
    );
  });

  it('reports a miss when the record does not exist', async () => {
    collection.updateOne.mockResolvedValue({ matchedCount: 0 });

    await expect(FeedbackModel.setVisibility('missing', true)).resolves.toBe(false);
  });
});
