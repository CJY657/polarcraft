import { beforeEach, describe, expect, it, vi } from 'vitest';

const find = vi.fn();
const countDocuments = vi.fn();
const insertOne = vi.fn();

vi.mock('../database/connection.js', () => ({
  getCollection: () => ({
    find: (...args: unknown[]) => find(...args),
    countDocuments: (...args: unknown[]) => countDocuments(...args),
    insertOne: (...args: unknown[]) => insertOne(...args),
  }),
}));

vi.mock('../utils/crypto.util.js', () => ({
  generateId: () => 'notification-1',
}));

vi.mock('../utils/logger.js', () => ({
  logger: { info: vi.fn() },
}));

import { NotificationModel } from './notification.model.js';

describe('NotificationModel expiring invitations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertOne.mockResolvedValue({});
    countDocuments.mockResolvedValue(0);
    find.mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: () => ({ toArray: async () => [] }),
        }),
      }),
    });
  });

  it('stores expires_at only when an expiring notification is created', async () => {
    const expiresAt = new Date('2026-08-12T00:00:00.000Z');

    await NotificationModel.createNotification({
      user_id: 'member-1',
      type: 'leadership_transfer',
      title: '组长转让邀请',
      expires_at: expiresAt,
    });

    expect(insertOne).toHaveBeenCalledWith(expect.objectContaining({
      id: 'notification-1',
      user_id: 'member-1',
      type: 'leadership_transfer',
      expires_at: expiresAt,
    }));
  });

  it('logically hides expired notifications before the TTL monitor removes them', async () => {
    await NotificationModel.getUserNotifications('member-1');

    expect(find).toHaveBeenCalledWith({
      user_id: 'member-1',
      $or: [
        { expires_at: { $exists: false } },
        { expires_at: { $gt: expect.any(Date) } },
      ],
    });
    expect(countDocuments).toHaveBeenCalledWith({
      user_id: 'member-1',
      $or: [
        { expires_at: { $exists: false } },
        { expires_at: { $gt: expect.any(Date) } },
      ],
    });
  });
});
