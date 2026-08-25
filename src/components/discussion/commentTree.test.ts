import { describe, expect, it } from 'vitest';
import {
  buildCommentTree,
  buildParentCommentLookup,
  countReplies,
  expandCommentAncestors,
  findRootCommentId,
} from './commentTree';
import { buildDraftAttachments } from './draftAttachments';

interface TestComment {
  id: string;
  parent: string | null;
  at: string;
}

const ACCESSORS = {
  idOf: (c: TestComment) => c.id,
  parentIdOf: (c: TestComment) => c.parent,
  createdAtOf: (c: TestComment) => c.at,
};

const COMMENTS: TestComment[] = [
  { id: 'a', parent: null, at: '2026-01-01T00:00:00Z' },
  { id: 'b', parent: null, at: '2026-01-03T00:00:00Z' },
  { id: 'a1', parent: 'a', at: '2026-01-02T00:00:00Z' },
  { id: 'a2', parent: 'a', at: '2026-01-01T12:00:00Z' },
  { id: 'a1x', parent: 'a1', at: '2026-01-04T00:00:00Z' },
];

describe('buildCommentTree', () => {
  it('sorts top-level threads newest first and replies oldest first', () => {
    const tree = buildCommentTree(COMMENTS, ACCESSORS);

    expect(tree.map((t) => t.id)).toEqual(['b', 'a']);
    expect(tree[1].replies.map((r) => r.id)).toEqual(['a2', 'a1']);
    expect(tree[1].replies[1].replies.map((r) => r.id)).toEqual(['a1x']);
  });

  it('counts nested replies', () => {
    const tree = buildCommentTree(COMMENTS, ACCESSORS);

    expect(countReplies(tree[1])).toBe(3);
    expect(countReplies(tree[0])).toBe(0);
  });
});

describe('comment ancestry', () => {
  const lookup = buildParentCommentLookup(COMMENTS, ACCESSORS);

  it('expands the whole chain up to the root', () => {
    expect(expandCommentAncestors('a1x', lookup)).toEqual({ a1x: true, a1: true, a: true });
  });

  it('finds the root of a nested comment', () => {
    expect(findRootCommentId('a1x', lookup)).toBe('a');
    expect(findRootCommentId('b', lookup)).toBe('b');
  });
});

describe('buildDraftAttachments', () => {
  const fileList = (...files: File[]) => files as unknown as FileList;
  const img = (name: string) => new File(['x'], name, { type: 'image/png' });
  const vid = (name: string) => new File(['x'], name, { type: 'video/mp4' });

  it('counts files outside the allowlist as invalid, not overflow', () => {
    const result = buildDraftAttachments(fileList(img('a.png'), vid('b.mp4')), {
      allowedTypes: ['image'],
      remainingImageSlots: 6,
    });

    expect(result.acceptedAttachments.map((a) => a.file.name)).toEqual(['a.png']);
    expect(result.invalidCount).toBe(1);
    expect(result.videoOverflowCount).toBe(0);
  });

  it('reports per-type overflow once the slots run out', () => {
    const result = buildDraftAttachments(fileList(img('a.png'), img('b.png'), vid('c.mp4')), {
      allowedTypes: ['image', 'video'],
      remainingImageSlots: 1,
      remainingVideoSlots: 0,
    });

    expect(result.acceptedAttachments).toHaveLength(1);
    expect(result.imageOverflowCount).toBe(1);
    expect(result.videoOverflowCount).toBe(1);
    expect(result.invalidCount).toBe(0);
  });

  it('treats negative remaining slots as zero', () => {
    const result = buildDraftAttachments(fileList(img('a.png')), {
      allowedTypes: ['image'],
      remainingImageSlots: -3,
    });

    expect(result.acceptedAttachments).toHaveLength(0);
    expect(result.imageOverflowCount).toBe(1);
  });
});
