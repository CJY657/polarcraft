import { beforeEach, describe, expect, it, vi } from 'vitest';

const canvasesFind = vi.fn();
const nodesFind = vi.fn();
const commentsFind = vi.fn();

type TestCursor = {
  project: () => TestCursor;
  sort: () => TestCursor;
  toArray: () => Promise<unknown[]>;
};

function cursor(docs: unknown[]): TestCursor {
  const chain: TestCursor = {
    project: () => chain,
    sort: () => chain,
    toArray: async () => docs,
  };

  return chain;
}

vi.mock('../database/connection.js', () => ({
  getCollection: (name: string) => {
    switch (name) {
      case 'research_canvases':
        return { find: (...args: unknown[]) => canvasesFind(...args) };
      case 'research_nodes':
        return { find: (...args: unknown[]) => nodesFind(...args) };
      case 'research_project_comments':
        return { find: (...args: unknown[]) => commentsFind(...args) };
      default:
        return { find: () => cursor([]) };
    }
  },
}));

import { getProjectCoverImageMap } from './research-cover.util.js';

describe('getProjectCoverImageMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the first canvas image before falling back to discussion images', async () => {
    canvasesFind.mockReturnValue(
      cursor([
        { id: 'canvas-1', project_id: 'project-1' },
        { id: 'canvas-2', project_id: 'project-2' },
      ])
    );
    nodesFind.mockReturnValue(
      cursor([
        { canvas_id: 'canvas-1', media_url: '/uploads/canvas-first.jpg' },
        { canvas_id: 'canvas-1', media_url: '/uploads/canvas-later.jpg' },
      ])
    );
    commentsFind.mockReturnValue(
      cursor([
        { project_id: 'project-1', image_urls: ['/uploads/comment-ignored.jpg'] },
        { project_id: 'project-2', image_urls: ['/uploads/comment-fallback.jpg'] },
        { project_id: 'project-3', image_urls: [] },
      ])
    );

    const coverMap = await getProjectCoverImageMap(['project-1', 'project-2', 'project-3']);

    expect(coverMap).toEqual(
      new Map([
        ['project-1', '/uploads/canvas-first.jpg'],
        ['project-2', '/uploads/comment-fallback.jpg'],
      ])
    );
    expect(nodesFind).toHaveBeenCalledWith({
      canvas_id: { $in: ['canvas-1', 'canvas-2'] },
      media_type: 'image',
      media_url: { $nin: [null, ''] },
    });
    expect(commentsFind).toHaveBeenCalledWith({
      project_id: { $in: ['project-2', 'project-3'] },
      is_deleted: { $ne: true },
    });
  });

  it('skips collection reads when no project IDs are provided', async () => {
    await expect(getProjectCoverImageMap([])).resolves.toEqual(new Map());

    expect(canvasesFind).not.toHaveBeenCalled();
    expect(nodesFind).not.toHaveBeenCalled();
    expect(commentsFind).not.toHaveBeenCalled();
  });
});
