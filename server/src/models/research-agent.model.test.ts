import { beforeEach, describe, expect, it, vi } from 'vitest';

const aiDeleteMany = vi.fn();
const projectsDeleteOne = vi.fn();
const canvasesFind = vi.fn();
const genericDeleteMany = vi.fn();

type TestCursor = {
  project: () => TestCursor;
  sort: (value: unknown) => TestCursor;
  limit: (value: number) => TestCursor;
  toArray: () => Promise<unknown[]>;
};

function cursor(docs: unknown[], onLimit?: (value: number) => void): TestCursor {
  const chain: TestCursor = {
    project: () => chain,
    sort: () => chain,
    limit: (value: number) => {
      onLimit?.(value);
      return chain;
    },
    toArray: async () => docs,
  };

  return chain;
}

vi.mock('../database/connection.js', () => ({
  getCollection: (name: string) => {
    switch (name) {
      case 'research_ai_messages':
        return {
          deleteMany: (...args: unknown[]) => aiDeleteMany(...args),
        };
      case 'research_projects':
        return {
          findOne: async () => null,
          find: () => cursor([]),
          deleteOne: (...args: unknown[]) => projectsDeleteOne(...args),
        };
      case 'research_canvases':
        return {
          find: (...args: unknown[]) => canvasesFind(...args),
          countDocuments: async () => 0,
          deleteMany: (...args: unknown[]) => genericDeleteMany(...args),
        };
      default:
        return {
          find: () => cursor([]),
          findOne: async () => null,
          countDocuments: async () => 0,
          deleteMany: (...args: unknown[]) => genericDeleteMany(...args),
        };
    }
  },
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
  },
}));

import { ResearchModel } from './research.model.js';

describe('ResearchModel AI advisor message cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiDeleteMany.mockResolvedValue({ deletedCount: 1 });
    projectsDeleteOne.mockResolvedValue({ deletedCount: 1 });
    canvasesFind.mockReturnValue(cursor([]));
    genericDeleteMany.mockResolvedValue({ deletedCount: 0 });
  });

  it('deletes project advisor messages during project cleanup', async () => {
    await expect(ResearchModel.deleteProject('project-1')).resolves.toBe(true);

    expect(aiDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
  });

  it('clears project advisor messages and returns the deleted count', async () => {
    aiDeleteMany.mockResolvedValue({ deletedCount: 3 });

    await expect(ResearchModel.clearProjectAgentMessages('project-1')).resolves.toBe(3);

    expect(aiDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
  });
});
