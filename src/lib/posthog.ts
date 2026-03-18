import posthog from 'posthog-js';

import type { UserProfile } from '@/lib/auth.service';
import { logger } from '@/lib/logger';

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY?.trim() || '';
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com';
const SESSION_RECORDING_ENABLED = import.meta.env.VITE_PUBLIC_POSTHOG_SESSION_RECORDING === 'true';

let isInitialized = false;
let identifiedUserId: string | null = null;
let lastCapturedRoute: string | null = null;

function isPostHogEnabled(): boolean {
  return typeof window !== 'undefined' && POSTHOG_KEY.length > 0;
}

export function initPostHog(): boolean {
  if (!isPostHogEnabled()) {
    return false;
  }

  if (isInitialized) {
    return true;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    disable_session_recording: !SESSION_RECORDING_ENABLED,
    loaded: () => {
      logger.info('[PostHog] Initialized', {
        host: POSTHOG_HOST,
        sessionRecording: SESSION_RECORDING_ENABLED,
      });
    },
  });

  isInitialized = true;
  return true;
}

export function capturePostHogPageview(location: {
  pathname: string;
  search: string;
  hash: string;
}): void {
  if (!initPostHog()) {
    return;
  }

  const route = `${location.pathname}${location.search}${location.hash}`;
  if (lastCapturedRoute === route) {
    return;
  }

  posthog.capture('$pageview', {
    $current_url: window.location.href,
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    page_title: document.title,
    route,
  });
  lastCapturedRoute = route;
}

export function syncPostHogUser(user: UserProfile | null): void {
  if (!initPostHog()) {
    return;
  }

  if (!user) {
    if (identifiedUserId !== null) {
      posthog.reset();
      identifiedUserId = null;
    }
    return;
  }

  if (identifiedUserId === user.id) {
    posthog.setPersonProperties({
      username: user.username,
      email: user.email ?? undefined,
      role: user.role,
      email_verified: user.email_verified,
      created_at: user.created_at,
      last_login_at: user.last_login_at ?? undefined,
    });
    return;
  }

  posthog.identify(user.id, {
    username: user.username,
    email: user.email ?? undefined,
    role: user.role,
    email_verified: user.email_verified,
    created_at: user.created_at,
    last_login_at: user.last_login_at ?? undefined,
  });
  identifiedUserId = user.id;
}
