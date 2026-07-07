export interface IdentityLike {
  username?: string | null;
  nickname?: string | null;
  real_name?: string | null;
  realName?: string | null;
}

function clean(value?: string | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function formatUserIdentity(identity: IdentityLike | null | undefined, fallback = '用户'): string {
  const realName = clean(identity?.real_name ?? identity?.realName);
  const username = clean(identity?.username);
  const nickname = clean(identity?.nickname);
  const publicName = username || nickname;

  if (publicName && realName && publicName !== realName) {
    return `${publicName}（${realName}）`;
  }

  return publicName || fallback;
}

export function getUserIdentityInitial(identity: IdentityLike | null | undefined, fallback = 'U'): string {
  const displayName = formatUserIdentity(identity, fallback);
  return displayName.charAt(0).toUpperCase() || fallback;
}
