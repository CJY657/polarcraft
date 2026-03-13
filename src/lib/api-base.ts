const LOCALHOST_API_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function stripApiSuffix(value: string): string {
  return value.replace(/\/api$/i, '');
}

export function resolveApiBaseUrl(rawValue: string | undefined): string {
  const configuredValue = stripTrailingSlash((rawValue || '').trim());

  if (!configuredValue || configuredValue === '/') {
    return '';
  }

  const normalizedValue = stripApiSuffix(configuredValue);

  if (!normalizedValue) {
    return '';
  }

  if (import.meta.env.PROD && LOCALHOST_API_RE.test(normalizedValue)) {
    return '';
  }

  if (typeof window !== 'undefined') {
    try {
      const resolvedUrl = new URL(normalizedValue, window.location.origin);
      if (resolvedUrl.origin === window.location.origin && resolvedUrl.pathname === '/') {
        return '';
      }
    } catch {
      // Keep the original value if the configured API base is not a valid URL.
    }
  }

  return normalizedValue;
}

export function describeApiBaseUrl(baseUrl: string): string {
  return baseUrl || 'same-origin';
}
