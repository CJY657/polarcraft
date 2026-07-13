/**
 * User Identity Utilities
 * 用户身份工具
 *
 * Shared batch loader for the public-facing user identity fields consumed by
 * the research-group models. Extracted from the byte-identical copies that
 * previously lived in research.model.ts and profile.model.ts.
 */

import { getCollection } from '../database/connection.js';
import { normalizeDocuments } from '../database/mongo.util.js';

const usersCollection = () => getCollection('users');

export type UserIdentity = {
  username: string;
  nickname: string | null;
  real_name: string | null;
  show_real_name_publicly: boolean;
  avatar_url: string | null;
};

/**
 * Batch-load public identity fields for the given user ids.
 * Real names are only surfaced when the user opted into public display.
 */
export async function getUserIdentityMap(userIds: string[]): Promise<Map<string, UserIdentity>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const users = normalizeDocuments<UserIdentity & { id: string }>(
    await usersCollection()
      .find({ id: { $in: [...new Set(userIds)] } })
      .project({ _id: 0, id: 1, username: 1, nickname: 1, real_name: 1, show_real_name_publicly: 1, avatar_url: 1 })
      .toArray()
  );

  return new Map(
    users.map((user) => [
      user.id,
      {
        username: user.username,
        nickname: user.nickname ?? null,
        real_name: user.show_real_name_publicly === true ? user.real_name ?? null : null,
        show_real_name_publicly: user.show_real_name_publicly === true,
        avatar_url: user.avatar_url ?? null,
      },
    ])
  );
}
