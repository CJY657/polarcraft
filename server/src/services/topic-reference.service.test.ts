import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockResearchModel, mockProjectAccessService } = vi.hoisted(() => ({
  mockResearchModel: {
    getTopicReferenceLabels: vi.fn(),
    findTopicReferenceSources: vi.fn(),
  },
  mockProjectAccessService: {
    getProjectAccess: vi.fn(),
  },
}));

vi.mock('../models/research.model.js', () => ({ ResearchModel: mockResearchModel }));
vi.mock('./project-access.service.js', () => ({ ProjectAccessService: mockProjectAccessService }));

import { TopicReferenceService } from './topic-reference.service.js';

const TARGET = 'project-target';

function project(id: string, extra: Record<string, unknown> = {}) {
  return { id, issue_number: 7, name_zh: `课题 ${id}`, name_en: null, ...extra };
}

/** Access decision keyed by project id, defaulting to "invisible". */
function grantAccess(grants: Record<string, { canRead?: boolean; canAccessDiscussion?: boolean }>) {
  mockProjectAccessService.getProjectAccess.mockImplementation(async (projectId: string) => {
    const grant = grants[projectId];
    if (!grant) {
      return { project: null, canRead: false, canAccessDiscussion: false };
    }
    return {
      project: project(projectId, { issue_number: 42 }),
      canRead: grant.canRead ?? false,
      canAccessDiscussion: grant.canAccessDiscussion ?? false,
    };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockResearchModel.getTopicReferenceLabels.mockResolvedValue([]);
  mockResearchModel.findTopicReferenceSources.mockResolvedValue({ projects: [], comments: [] });
});

describe('TopicReferenceService.resolveReferences', () => {
  it('drops targets the viewer cannot read, exposing no title or number', async () => {
    mockResearchModel.getTopicReferenceLabels.mockResolvedValue([
      { id: 'visible', issue_number: 1, name_zh: '可见课题', name_en: 'Visible' },
      { id: 'secret', issue_number: 2, name_zh: '机密课题', name_en: 'Secret' },
    ]);
    grantAccess({ visible: { canRead: true } });

    const references = await TopicReferenceService.resolveReferences(
      ['visible', 'secret'],
      { userId: 'user-1', role: 'user' }
    );

    expect(references).toEqual([
      { number: 1, project_id: 'visible', name_zh: '可见课题', name_en: 'Visible' },
    ]);
    expect(JSON.stringify(references)).not.toContain('机密');
  });

  it('skips targets that never got an issue number', async () => {
    mockResearchModel.getTopicReferenceLabels.mockResolvedValue([
      { id: 'legacy', issue_number: null, name_zh: '旧课题', name_en: null },
    ]);
    grantAccess({ legacy: { canRead: true } });

    expect(
      await TopicReferenceService.resolveReferences(['legacy'], { userId: 'u', role: 'user' })
    ).toEqual([]);
  });

  it('ignores a missing or malformed id list without querying', async () => {
    expect(await TopicReferenceService.resolveReferences(undefined, { role: 'user' })).toEqual([]);
    expect(await TopicReferenceService.resolveReferences(['', 3], { role: 'user' })).toEqual([]);
    expect(mockResearchModel.getTopicReferenceLabels).not.toHaveBeenCalled();
  });
});

describe('TopicReferenceService.getBacklinks', () => {
  beforeEach(() => {
    mockResearchModel.getTopicReferenceLabels.mockResolvedValue([
      { id: TARGET, issue_number: 42, name_zh: '目标课题', name_en: null },
    ]);
  });

  it('groups both description languages and messages under one source topic', async () => {
    mockResearchModel.findTopicReferenceSources.mockResolvedValue({
      projects: [
        project('source-a', {
          // The repeated #42 in one field must collapse to a single location.
          description_zh: '见 #42，另见 #42。',
          description_en: 'See #42.',
        }),
      ],
      comments: [
        { id: 'comment-1', project_id: 'source-a' },
        { id: 'comment-2', project_id: 'source-a' },
      ],
    });
    grantAccess({ 'source-a': { canRead: true, canAccessDiscussion: true } });

    const { items, total } = await TopicReferenceService.getBacklinks(TARGET, {
      userId: 'user-1',
      role: 'user',
    });

    expect(total).toBe(1);
    expect(items[0].locations).toEqual([
      { type: 'description_zh' },
      { type: 'description_en' },
      { type: 'comment', comment_id: 'comment-1' },
      { type: 'comment', comment_id: 'comment-2' },
    ]);
  });

  it('hides discussion locations from a reader who is not a member', async () => {
    mockResearchModel.findTopicReferenceSources.mockResolvedValue({
      projects: [project('source-a', { description_zh: '见 #42', description_en: null })],
      comments: [{ id: 'comment-1', project_id: 'source-a' }],
    });
    grantAccess({ 'source-a': { canRead: true, canAccessDiscussion: false } });

    const { items } = await TopicReferenceService.getBacklinks(TARGET, { role: 'user' });

    expect(items[0].locations).toEqual([{ type: 'description_zh' }]);
  });

  it('omits an entire source the viewer cannot see, from items and total alike', async () => {
    mockResearchModel.findTopicReferenceSources.mockResolvedValue({
      projects: [
        project('open', { description_zh: '见 #42', description_en: null }),
        project('private', { description_zh: '见 #42', description_en: null }),
      ],
      comments: [{ id: 'comment-1', project_id: 'private' }],
    });
    grantAccess({ open: { canRead: true } });

    const { items, total } = await TopicReferenceService.getBacklinks(TARGET, { role: 'user' });

    expect(total).toBe(1);
    expect(items.map((item) => item.project_id)).toEqual(['open']);
    expect(JSON.stringify(items)).not.toContain('private');
  });

  it('excludes the topic referencing itself', async () => {
    mockResearchModel.findTopicReferenceSources.mockResolvedValue({
      projects: [project(TARGET, { description_zh: '见 #42', description_en: null })],
      comments: [{ id: 'comment-1', project_id: TARGET }],
    });
    grantAccess({ [TARGET]: { canRead: true, canAccessDiscussion: true } });

    expect((await TopicReferenceService.getBacklinks(TARGET, { role: 'user' })).total).toBe(0);
  });

  it('pages 20 groups at a time over the filtered set', async () => {
    const sources = Array.from({ length: 25 }, (_, index) => `source-${index}`);
    mockResearchModel.findTopicReferenceSources.mockResolvedValue({
      projects: sources.map((id) => project(id, { description_zh: '见 #42', description_en: null })),
      comments: [],
    });
    grantAccess(Object.fromEntries(sources.map((id) => [id, { canRead: true }])));

    const first = await TopicReferenceService.getBacklinks(TARGET, { role: 'user' }, 1);
    const second = await TopicReferenceService.getBacklinks(TARGET, { role: 'user' }, 2);

    expect(first.items).toHaveLength(20);
    expect(second.items).toHaveLength(5);
    expect(second.total).toBe(25);
  });

  it('reports no description location when the target has no issue number', async () => {
    mockResearchModel.getTopicReferenceLabels.mockResolvedValue([
      { id: TARGET, issue_number: null, name_zh: '旧目标', name_en: null },
    ]);
    mockResearchModel.findTopicReferenceSources.mockResolvedValue({
      projects: [project('source-a', { description_zh: '见 #42', description_en: null })],
      comments: [],
    });
    grantAccess({ 'source-a': { canRead: true } });

    expect((await TopicReferenceService.getBacklinks(TARGET, { role: 'user' })).total).toBe(0);
  });
});
