import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { logging } = vi.hoisted(() => ({
  logging: { enabled: true, level: 'debug' },
}));

vi.mock('../config/index.js', () => ({
  config: { logging },
}));

const levels = ['debug', 'info', 'warn', 'error'] as const;
const timestamp = '2026-09-17T03:04:05.000Z';

describe('logger', () => {
  beforeEach(() => {
    vi.resetModules();
    logging.enabled = true;
    logging.level = 'debug';
    vi.useFakeTimers();
    vi.setSystemTime(new Date(timestamp));
    for (const level of levels) {
      vi.spyOn(console, level).mockImplementation(() => {});
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it.each(levels)('filters messages below the %s threshold', async (minimum) => {
    logging.level = minimum;
    const { logger } = await import('./logger.js');

    for (const level of levels) {
      logger[level]('message');
      if (levels.indexOf(level) >= levels.indexOf(minimum)) {
        expect(console[level]).toHaveBeenCalledTimes(1);
        expect(console[level]).toHaveBeenCalledWith(
          `[${timestamp}] [${level.toUpperCase()}] message`,
        );
      } else {
        expect(console[level]).not.toHaveBeenCalled();
      }
    }
  });

  it.each(levels)('suppresses %s when logging is disabled', async (level) => {
    logging.enabled = false;
    const { logger } = await import('./logger.js');

    logger[level]('message');

    expect(console[level]).not.toHaveBeenCalled();
  });

  it.each(levels)('forwards %s arguments and uses the current console method', async (level) => {
    const { logger } = await import('./logger.js');
    vi.mocked(console[level]).mockRestore();
    let receiver: unknown;
    const output = vi.spyOn(console, level).mockImplementation(function (this: unknown) {
      receiver = this;
    });
    const details = { requestId: 'request-1' };
    const error = new Error('failure');
    const log = logger[level];

    log('', details, error, null, undefined, 0);

    expect(output).toHaveBeenCalledTimes(1);
    expect(output).toHaveBeenCalledWith(
      `[${timestamp}] [${level.toUpperCase()}] `,
      details, error, null, undefined, 0,
    );
    expect(output.mock.calls[0][1]).toBe(details);
    expect(output.mock.calls[0][2]).toBe(error);
    expect(receiver).toBe(console);
  });
});
