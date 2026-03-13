import type { CookieOptions } from 'express';
import { config } from '../config/index.js';

function baseCookieOptions(): Omit<CookieOptions, 'httpOnly'> {
  return {
    secure: config.security.cookieSecure,
    sameSite: config.security.cookieSameSite,
    path: '/',
    ...(config.security.cookieDomain ? { domain: config.security.cookieDomain } : {}),
  };
}

export function createAuthCookieOptions(extra: CookieOptions = {}): CookieOptions {
  return {
    httpOnly: true,
    ...baseCookieOptions(),
    ...extra,
  };
}

export function createReadableCookieOptions(extra: CookieOptions = {}): CookieOptions {
  return {
    httpOnly: false,
    ...baseCookieOptions(),
    ...extra,
  };
}
