import { describe, expect, it } from 'vitest';
import {
  extractDocumentFieldValues,
  extractReferencedUrlValues,
} from './managed-upload-cleanup.service.js';

describe('managed upload reference extraction', () => {
  it('extracts URLs from arrays of nested evidence attachments', () => {
    const document = {
      attachments: [
        { url: ' /uploads/courses/evidence/first.pdf ' },
        { url: '/uploads/courses/evidence/second.png' },
        { original_name: 'missing-url.txt' },
      ],
    };

    const values = extractDocumentFieldValues(document, 'attachments.url');

    expect(extractReferencedUrlValues(values)).toEqual([
      '/uploads/courses/evidence/first.pdf',
      '/uploads/courses/evidence/second.png',
    ]);
  });

  it('keeps existing scalar and array URL extraction behavior', () => {
    expect(extractReferencedUrlValues(' /uploads/comment.png ')).toEqual([
      '/uploads/comment.png',
    ]);
    expect(extractReferencedUrlValues([
      '/uploads/one.png',
      ' /uploads/two.png ',
      null,
    ])).toEqual(['/uploads/one.png', '/uploads/two.png']);
  });
});

describe('getHtmlPackageDir', () => {
  it('maps files inside <scope>/html/<id>/ to the package root and ignores other uploads', async () => {
    const path = await import('path');
    const { uploadConfig } = await import('../config/upload.config.js');
    const { getHtmlPackageDir } = await import('./managed-upload-cleanup.service.js');
    const root = path.resolve(uploadConfig.uploadDir);

    expect(getHtmlPackageDir(path.join(root, 'unit-1', 'html', 'abc', 'assets', 'a.js'))).toBe(
      path.join(root, 'unit-1', 'html', 'abc')
    );
    expect(getHtmlPackageDir(path.join(root, 'unit-1', 'html', 'abc', 'index.html'))).toBe(
      path.join(root, 'unit-1', 'html', 'abc')
    );
    expect(getHtmlPackageDir(path.join(root, 'unit-1', 'html', 'abc.zip'))).toBeNull();
    expect(getHtmlPackageDir(path.join(root, 'unit-1', 'pdf', 'x.pdf'))).toBeNull();
  });
});
