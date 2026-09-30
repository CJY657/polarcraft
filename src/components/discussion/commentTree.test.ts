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

  it('keeps equal timestamps stable and retains invalid-date comparison behavior', () => {
    const comments = [
      { id: 'older', parent: null, at: '2026-01-01' },
      { id: 'invalid', parent: null, at: 'invalid' },
      { id: 'newer', parent: null, at: '2026-01-03' },
      { id: 'equal', parent: null, at: '2026-01-03' },
      { id: 'reply', parent: 'older', at: '2026-01-03' },
      { id: 'reply-equal', parent: 'older', at: '2026-01-03' },
      { id: 'reply-invalid', parent: 'older', at: '' },
      { id: 'reply-earlier', parent: 'older', at: '2026-01-01' },
    ];
    const tree = buildCommentTree(comments, ACCESSORS);

    expect(tree.map((comment) => comment.id)).toEqual(['older', 'invalid', 'newer', 'equal']);
    expect(tree[0].replies.map((comment) => comment.id)).toEqual([
      'reply', 'reply-equal', 'reply-invalid', 'reply-earlier',
    ]);
  });

  it('sorts duplicate IDs by each record timestamp without mutating input records', () => {
    const comments = [
      { id: 'same', parent: null, at: '2026-01-01' },
      { id: 'same', parent: null, at: '2026-01-03' },
      { id: 'child', parent: 'same', at: '2026-01-02' },
      { id: 'late', parent: 'child', at: '2026-01-05' },
      { id: 'early', parent: 'child', at: '2026-01-04' },
      { id: 'orphan', parent: 'missing', at: 'invalid' },
    ];
    const original = structuredClone(comments);
    comments.forEach(Object.freeze);
    Object.freeze(comments);
    const tree = buildCommentTree(comments, ACCESSORS);

    expect(tree.map((comment) => comment.at)).toEqual(['2026-01-03', '2026-01-01']);
    for (const root of tree) {
      expect(root.replies.map((comment) => comment.id)).toEqual(['child']);
      expect(root.replies[0].replies.map((comment) => comment.id)).toEqual(['early', 'late']);
    }
    expect(tree[0]).not.toBe(comments[1]);
    expect(tree[0].replies[0]).not.toBe(tree[1].replies[0]);
    expect(comments).toEqual(original);
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
