export interface IdentityLike {
  username?: string | null;
  nickname?: string | null;
  real_name?: string | null;
  realName?: string | null;
  show_real_name_publicly?: boolean | null;
  showRealNamePublicly?: boolean | null;
}

interface FormatUserIdentityOptions {
  includePrivateRealName?: boolean;
}

function clean(value?: string | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function formatUserIdentity(
  identity: IdentityLike | null | undefined,
  fallback = '用户',
  options: FormatUserIdentityOptions = {}
): string {
  const realName = clean(identity?.real_name ?? identity?.realName);
  const username = clean(identity?.username);
  const publicName = username;
  const canShowRealName =
    options.includePrivateRealName ||
    identity?.show_real_name_publicly === true ||
    identity?.showRealNamePublicly === true;

  if (publicName && realName && publicName !== realName && canShowRealName) {
    return `${publicName}（${realName}）`;
  }

  return publicName || (canShowRealName ? realName : '') || fallback;
}

export function getUserIdentityInitial(identity: IdentityLike | null | undefined, fallback = 'U'): string {
  const displayName = formatUserIdentity(identity, fallback);
  return displayName.charAt(0).toUpperCase() || fallback;
}
