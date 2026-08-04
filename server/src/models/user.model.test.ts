import { beforeEach, describe, expect, it, vi } from 'vitest';

const usersFind = vi.fn();
const usersCountDocuments = vi.fn();
const usersFindOne = vi.fn();
const usersInsertOne = vi.fn();
const usersUpdateOne = vi.fn();

vi.mock('../database/connection.js', () => ({
  getCollection: (name: string) => {
    if (name === 'users') {
      return {
        find: (...args: unknown[]) => usersFind(...args),
        findOne: (...args: unknown[]) => usersFindOne(...args),
        insertOne: (...args: unknown[]) => usersInsertOne(...args),
        updateOne: (...args: unknown[]) => usersUpdateOne(...args),
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

vi.mock('../utils/password.util.js', () => ({
  hashPassword: vi.fn(async (password: string) => `hashed-${password}`),
  comparePassword: vi.fn(),
}));

vi.mock('../utils/crypto.util.js', () => ({
  generateId: vi.fn(() => 'generated-user-id'),
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
    usersCountDocuments
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);

    await expect(UserModel.getAdminStats()).resolves.toEqual({
      total_registered: 7,
      active_users: 5,
      new_users_7d: 3,
      recent_logins_7d: 2,
      unverified_emails: 1,
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
        nickname: 'Alice Nick',
        real_name: 'Alice Wang',
        show_real_name_publicly: false,
        email: 'alice@example.com',
        role: 'admin',
        user_type: 'teacher',
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
      search: 'alice',
      role: 'admin',
      userType: 'teacher',
      status: 'inactive',
      limit: 20,
      offset: 40,
    });

    const filter = usersFind.mock.calls[0]?.[0] as {
      role: string;
      user_type: string;
      is_active: boolean;
      $or: Array<Record<string, RegExp>>;
    };

    expect(filter.role).toBe('admin');
    expect(filter.user_type).toBe('teacher');
    expect(filter.is_active).toBe(false);
    expect(filter.$or[0]?.username).toBeInstanceOf(RegExp);
    expect(filter.$or[0]?.username.test('ALICE')).toBe(true);
    expect(filter.$or[1]?.nickname.test('Alice Nick')).toBe(true);
    expect(filter.$or[2]?.real_name.test('Alice Wang')).toBe(true);
    expect(filter.$or[3]?.email.test('alice@example.com')).toBe(true);
    expect(cursor.project).toHaveBeenCalledWith({
      _id: 0,
      id: 1,
      username: 1,
      nickname: 1,
      real_name: 1,
      show_real_name_publicly: 1,
      email: 1,
      role: 1,
      user_type: 1,
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
          nickname: 'Alice Nick',
          real_name: 'Alice Wang',
          show_real_name_publicly: false,
          email: 'alice@example.com',
          role: 'admin',
          user_type: 'teacher',
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

  it('filters unclassified legacy users by null, which also matches a missing field', async () => {
    const cursor = createCursor([]);
    usersFind.mockReturnValue(cursor);
    usersCountDocuments.mockResolvedValueOnce(0);

    await UserModel.listForAdmin({
      userType: 'unclassified',
      limit: 20,
      offset: 0,
    });

    expect(usersFind).toHaveBeenCalledWith({ user_type: null });
    expect(usersCountDocuments).toHaveBeenCalledWith({ user_type: null });
  });

  it('finds inactive users for admin detail lookups without applying the active-user filter', async () => {
    usersFindOne.mockResolvedValueOnce({
      id: 'inactive-user',
      username: 'bob',
      nickname: undefined,
      real_name: undefined,
      show_real_name_publicly: undefined,
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
      nickname: null,
      real_name: null,
      show_real_name_publicly: false,
      email: 'bob@example.com',
      role: 'user',
      user_type: null,
      avatar_url: null,
      email_verified: false,
      is_active: false,
      created_at: new Date('2026-05-01T00:00:00.000Z'),
      last_login_at: null,
    });

    expect(usersFindOne).toHaveBeenCalledWith({ id: 'inactive-user' });
  });

  it('batch-loads private identity fields for an administrator ranking', async () => {
    const cursor = createCursor([
      {
        id: 'user-1',
        username: 'alice',
        nickname: '小爱',
        real_name: 'Alice Wang',
        user_type: 'student',
      },
      {
        id: 'user-2',
        username: 'bob',
        nickname: '小波',
        real_name: null,
        user_type: 'teacher',
      },
    ]);
    usersFind.mockReturnValue(cursor);

    await expect(
      UserModel.findIdentitiesByIdsForAdmin(['user-1', 'user-2', 'user-1'])
    ).resolves.toEqual([
      {
        id: 'user-1',
        username: 'alice',
        nickname: '小爱',
        real_name: 'Alice Wang',
        user_type: 'student',
      },
      {
        id: 'user-2',
        username: 'bob',
        nickname: '小波',
        real_name: null,
        user_type: 'teacher',
      },
    ]);

    expect(usersFind).toHaveBeenCalledWith({
      id: { $in: ['user-1', 'user-2'] },
    });
    expect(cursor.project).toHaveBeenCalledWith({
      _id: 0,
      id: 1,
      username: 1,
      nickname: 1,
      real_name: 1,
      user_type: 1,
    });
  });

  it('creates users with legacy nickname unset and registration recorded as the first login', async () => {
    usersFindOne.mockResolvedValueOnce(null);
    usersInsertOne.mockResolvedValueOnce({ acknowledged: true });

    const result = await UserModel.create({
      username: 'new-user',
      real_name: 'New User',
      password: 'client-hash',
      clientSalt: 'client-salt',
      email: 'new@example.com',
      user_type: 'teacher',
    });

    expect(result).toMatchObject({
      id: 'generated-user-id',
      username: 'new-user',
      nickname: null,
      real_name: 'New User',
      show_real_name_publicly: false,
      email: 'new@example.com',
      user_type: 'teacher',
    });
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.last_login_at).toBe(result.created_at);
    expect(usersInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'new-user',
        nickname: null,
        real_name: 'New User',
        show_real_name_publicly: false,
        user_type: 'teacher',
        password_hash: 'hashed-client-hash',
        created_at: result.created_at,
        last_login_at: result.created_at,
      })
    );
  });

  it('updates profile identity without touching legacy nickname or authorization role', async () => {
    usersUpdateOne.mockResolvedValueOnce({ matchedCount: 1 });
    const savedUser = {
      id: 'user-1',
      username: 'alice',
      nickname: '旧昵称',
      real_name: 'Alice Wang',
      show_real_name_publicly: true,
      email: null,
      role: 'user',
      user_type: 'student',
      avatar_url: null,
      email_verified: false,
      is_active: true,
      created_at: new Date('2026-05-01T00:00:00.000Z'),
      updated_at: new Date('2026-05-02T00:00:00.000Z'),
      last_login_at: null,
      password_hash: 'secret',
      client_salt: 'salt',
      client_hash_algorithm: 'SHA-256',
    };
    usersFindOne
      .mockResolvedValueOnce(savedUser)
      .mockResolvedValueOnce({ ...savedUser, user_type: 'teacher' });

    await expect(
      UserModel.updateProfile('user-1', {
        username: 'alice',
        real_name: 'Alice Wang',
        show_real_name_publicly: true,
        user_type: 'teacher',
      })
    ).resolves.toMatchObject({
      username: 'alice',
      nickname: '旧昵称',
      real_name: 'Alice Wang',
      show_real_name_publicly: true,
      user_type: 'teacher',
    });

    expect(usersUpdateOne).toHaveBeenCalledWith(
      { id: 'user-1' },
      {
        $set: expect.objectContaining({
          username: 'alice',
          real_name: 'Alice Wang',
          show_real_name_publicly: true,
          user_type: 'teacher',
        }),
      }
    );
    expect(usersUpdateOne.mock.calls[0]?.[1]?.$set).not.toHaveProperty('nickname');
    expect(usersUpdateOne.mock.calls[0]?.[1]?.$set).not.toHaveProperty('role');
  });
});

describe('UserModel email verification state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function storedUser(email: string | null) {
    return {
      id: 'user-1',
      username: 'alice',
      nickname: null,
      real_name: 'Alice',
      show_real_name_publicly: false,
      email,
      role: 'user',
      user_type: 'student',
      avatar_url: null,
      email_verified: true,
      is_active: true,
      created_at: new Date('2026-05-01T00:00:00.000Z'),
      updated_at: new Date('2026-05-01T00:00:00.000Z'),
      last_login_at: null,
      password_hash: 'secret',
      client_salt: 'salt',
      client_hash_algorithm: 'SHA-256',
    };
  }

  it('clears email_verified when the address changes', async () => {
    usersFindOne.mockResolvedValue(storedUser('old@example.com'));
    usersUpdateOne.mockResolvedValue({ matchedCount: 1 });

    await UserModel.updateProfile('user-1', { email: 'new@example.com' });

    expect(usersUpdateOne).toHaveBeenCalledWith(
      { id: 'user-1' },
      { $set: expect.objectContaining({ email: 'new@example.com', email_verified: false }) }
    );
  });

  it('keeps email_verified when the address is resubmitted unchanged', async () => {
    usersFindOne.mockResolvedValue(storedUser('same@example.com'));
    usersUpdateOne.mockResolvedValue({ matchedCount: 1 });

    await UserModel.updateProfile('user-1', {
      email: 'same@example.com',
      real_name: 'Alice Wang',
    });

    const [, update] = usersUpdateOne.mock.calls[0] as [unknown, { $set: Record<string, unknown> }];
    expect(update.$set).not.toHaveProperty('email_verified');
  });

  it('only marks an email verified while it is still the current address', async () => {
    usersUpdateOne.mockResolvedValue({ matchedCount: 0 });

    await expect(UserModel.markEmailVerified('user-1', 'stale@example.com')).resolves.toBe(false);
    expect(usersUpdateOne).toHaveBeenCalledWith(
      { id: 'user-1', email: 'stale@example.com' },
      { $set: expect.objectContaining({ email_verified: true }) }
    );
  });
});
