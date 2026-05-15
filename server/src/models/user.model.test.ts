import { beforeEach, describe, expect, it, vi } from 'vitest';

const usersFind = vi.fn();
const usersCountDocuments = vi.fn();
const usersFindOne = vi.fn();

vi.mock('../database/connection.js', () => ({
  getCollection: (name: string) => {
    if (name === 'users') {
      return {
        find: (...args: unknown[]) => usersFind(...args),
        findOne: (...args: unknown[]) => usersFindOne(...args),
        countDocuments: (...args: unknown[]) => usersCountDocuments(...args),
      };
    }

    return {};
  },
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
  },
}));

import { UserModel } from './user.model.js';

function createCursor(documents: Array<Record<string, unknown>>) {
  const cursor = {
    project: vi.fn(),
    sort: vi.fn(),
    skip: vi.fn(),
    limit: vi.fn(),
    toArray: vi.fn(async () => documents),
  };

  cursor.project.mockReturnValue(cursor);
  cursor.sort.mockReturnValue(cursor);
  cursor.skip.mockReturnValue(cursor);
  cursor.limit.mockReturnValue(cursor);

  return cursor;
}

describe('UserModel admin queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('counts all registered users separately from active users', async () => {
    usersCountDocuments.mockResolvedValueOnce(7).mockResolvedValueOnce(5);

    await expect(UserModel.getAdminStats()).resolves.toEqual({
      total_registered: 7,
      active_users: 5,
    });

    expect(usersCountDocuments).toHaveBeenNthCalledWith(1, {});
    expect(usersCountDocuments).toHaveBeenNthCalledWith(2, { is_active: true });
  });

  it('filters, paginates, and returns only safe admin list fields', async () => {
    const cursor = createCursor([
      {
        _id: 'mongo-id',
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        role: 'admin',
        avatar_url: null,
        email_verified: true,
        is_active: false,
        created_at: new Date('2026-05-01T00:00:00.000Z'),
        updated_at: new Date('2026-05-02T00:00:00.000Z'),
        last_login_at: new Date('2026-05-03T00:00:00.000Z'),
        password_hash: 'secret',
        client_salt: 'salt',
        client_hash_algorithm: 'SHA-256',
      },
    ]);
    usersFind.mockReturnValue(cursor);
    usersCountDocuments.mockResolvedValueOnce(1);

    const result = await UserModel.listForAdmin({
      search: 'alice@example.com',
      role: 'admin',
      status: 'inactive',
      limit: 20,
      offset: 40,
    });

    const filter = usersFind.mock.calls[0]?.[0] as {
      role: string;
      is_active: boolean;
      $or: Array<Record<string, RegExp>>;
    };

    expect(filter.role).toBe('admin');
    expect(filter.is_active).toBe(false);
    expect(filter.$or[0]?.username).toBeInstanceOf(RegExp);
    expect(filter.$or[0]?.username.test('ALICE@EXAMPLE.COM')).toBe(true);
    expect(filter.$or[1]?.email.test('alice@example.com')).toBe(true);
    expect(cursor.project).toHaveBeenCalledWith({
      _id: 0,
      id: 1,
      username: 1,
      email: 1,
      role: 1,
      avatar_url: 1,
      email_verified: 1,
      is_active: 1,
      created_at: 1,
      last_login_at: 1,
    });
    expect(cursor.sort).toHaveBeenCalledWith({ created_at: -1 });
    expect(cursor.skip).toHaveBeenCalledWith(40);
    expect(cursor.limit).toHaveBeenCalledWith(20);
    expect(usersCountDocuments).toHaveBeenCalledWith(filter);
    expect(result).toEqual({
      items: [
        {
          id: 'user-1',
          username: 'alice',
          email: 'alice@example.com',
          role: 'admin',
          avatar_url: null,
          email_verified: true,
          is_active: false,
          created_at: new Date('2026-05-01T00:00:00.000Z'),
          last_login_at: new Date('2026-05-03T00:00:00.000Z'),
        },
      ],
      total: 1,
    });
    expect(result.items[0]).not.toHaveProperty('password_hash');
    expect(result.items[0]).not.toHaveProperty('client_salt');
  });

  it('finds inactive users for admin detail lookups without applying the active-user filter', async () => {
    usersFindOne.mockResolvedValueOnce({
      id: 'inactive-user',
      username: 'bob',
      email: 'bob@example.com',
      role: 'user',
      avatar_url: null,
      email_verified: false,
      is_active: false,
      created_at: new Date('2026-05-01T00:00:00.000Z'),
      updated_at: new Date('2026-05-02T00:00:00.000Z'),
      last_login_at: null,
      password_hash: 'secret',
      client_salt: 'salt',
      client_hash_algorithm: 'SHA-256',
    });

    await expect(UserModel.findByIdForAdmin('inactive-user')).resolves.toEqual({
      id: 'inactive-user',
      username: 'bob',
      email: 'bob@example.com',
      role: 'user',
      avatar_url: null,
      email_verified: false,
      is_active: false,
      created_at: new Date('2026-05-01T00:00:00.000Z'),
      last_login_at: null,
    });

    expect(usersFindOne).toHaveBeenCalledWith({ id: 'inactive-user' });
  });
});
