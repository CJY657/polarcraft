import { describe, expect, it, vi } from 'vitest';
import type { Collection } from 'mongodb';

import {
  allocateProjectIssueNumber,
  ensureProjectIssueCounterAtLeast,
  reserveProjectIssueNumbers,
} from './research-project-issue-number.util.js';

describe('research project issue number allocation', () => {
  it('raises the counter floor and reserves one contiguous range atomically', async () => {
    const findOneAndUpdate = vi.fn()
      .mockResolvedValueOnce({ value: 7 })
      .mockResolvedValueOnce({ value: 10 });
    const counters = { findOneAndUpdate } as unknown as Collection;

    await expect(ensureProjectIssueCounterAtLeast(counters, 7)).resolves.toBe(7);
    await expect(reserveProjectIssueNumbers(counters, 3)).resolves.toEqual({ start: 8, end: 10 });

    expect(findOneAndUpdate).toHaveBeenNthCalledWith(
      1,
      { _id: 'research_project_issue_number' },
      { $max: { value: 7 } },
      { upsert: true, returnDocument: 'after' }
    );
    expect(findOneAndUpdate).toHaveBeenNthCalledWith(
      2,
      { _id: 'research_project_issue_number' },
      { $inc: { value: 3 } },
      { upsert: true, returnDocument: 'after' }
    );
  });

  it('allocates one number through the shared reservation path', async () => {
    const counters = {
      findOneAndUpdate: vi.fn().mockResolvedValue({ value: 12 }),
    } as unknown as Collection;

    await expect(allocateProjectIssueNumber(counters)).resolves.toBe(12);
  });

  it('rejects invalid reservations and invalid stored counter values', async () => {
    const counters = {
      findOneAndUpdate: vi.fn().mockResolvedValue({ value: 'broken' }),
    } as unknown as Collection;

    await expect(reserveProjectIssueNumbers(counters, 0)).rejects.toThrow('positive integer');
    await expect(reserveProjectIssueNumbers(counters, 1)).rejects.toThrow('Invalid research project');
  });
});
