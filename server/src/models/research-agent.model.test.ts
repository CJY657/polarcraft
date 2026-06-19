import { beforeEach, describe, expect, it, vi } from 'vitest';

const aiFind = vi.fn();
const aiInsertOne = vi.fn();
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
          find: (...args: unknown[]) => aiFind(...args),
          insertOne: (...args: unknown[]) => aiInsertOne(...args),
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

vi.mock('../utils/crypto.util.js', () => ({
  generateId: () => 'generated-id',
}));

import { ResearchModel } from './research.model.js';

describe('ResearchModel AI advisor messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiInsertOne.mockResolvedValue({ insertedId: 'mongo-id' });
    aiDeleteMany.mockResolvedValue({ deletedCount: 1 });
    projectsDeleteOne.mockResolvedValue({ deletedCount: 1 });
    canvasesFind.mockReturnValue(cursor([]));
    genericDeleteMany.mockResolvedValue({ deletedCount: 0 });
  });

  it('returns limited project messages in chronological order', async () => {
    const limits: number[] = [];
    aiFind.mockReturnValue(
      cursor(
        [
          { id: 'newer', project_id: 'project-1', role: 'assistant', content: 'later', created_at: new Date('2026-01-02') },
          { id: 'older', project_id: 'project-1', role: 'user', content: 'earlier', created_at: new Date('2026-01-01') },
        ],
        (value) => limits.push(value)
      )
    );

    const messages = await ResearchModel.getProjectAgentMessages('project-1', 500);

    expect(aiFind).toHaveBeenCalledWith({ project_id: 'project-1' });
    expect(limits).toEqual([100]);
    expect(messages.map((message) => message.id)).toEqual(['older', 'newer']);
  });

  it('stores user and assistant messages in the shared project collection', async () => {
    const message = await ResearchModel.addProjectAgentMessage({
      projectId: 'project-1',
      userId: 'user-1',
      role: 'assistant',
      content: '下一步先定义变量。',
      model: 'advisor-model',
      usage: { total_tokens: 10 },
    });

    expect(message).toEqual(
      expect.objectContaining({
        id: 'generated-id',
        project_id: 'project-1',
        user_id: 'user-1',
        role: 'assistant',
        content: '下一步先定义变量。',
        model: 'advisor-model',
        usage: { total_tokens: 10 },
      })
    );
    expect(aiInsertOne).toHaveBeenCalledWith(message);
  });

  it('deletes project advisor messages during project cleanup', async () => {
    await expect(ResearchModel.deleteProject('project-1')).resolves.toBe(true);

    expect(aiDeleteMany).toHaveBeenCalledWith({ project_id: 'project-1' });
  });
});
