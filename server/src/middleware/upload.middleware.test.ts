import fs from 'fs';
import http, { type Server } from 'http';
import os from 'os';
import path from 'path';

import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

interface UploadResponse {
  originalName: string;
  filename: string;
  path: string;
  size: number;
}

let server: Server;
let uploadRoot: string;
let baseUrl: string;

function sendMultipart(
  filename: string,
  mimeType: string,
  contents = 'test contents',
  route = '/upload',
  unitId = 'evidence-test',
) {
  const boundary = `----polariscope-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\n`
      + 'Content-Disposition: form-data; name="unitId"\r\n\r\n'
      + `${unitId}\r\n`
      + `--${boundary}\r\n`
      + `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`
      + `Content-Type: ${mimeType}\r\n\r\n`,
      'utf8'
    ),
    Buffer.from(contents),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  return new Promise<{ status: number; body: Record<string, any> }>((resolve, reject) => {
    const request = http.request(
      `${baseUrl}${route}`,
      {
        method: 'POST',
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
          'content-length': String(body.length),
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        response.on('end', () => {
          try {
            resolve({
              status: response.statusCode ?? 0,
              body: JSON.parse(Buffer.concat(chunks).toString('utf8')),
            });
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.on('error', reject);
    request.end(body);
  });
}

beforeAll(async () => {
  uploadRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'polariscope-upload-'));
  process.env.UPLOAD_ROOT_DIR = uploadRoot;
  process.env.UPLOAD_DIR = path.join(uploadRoot, 'courses');
  vi.resetModules();

  const { createUploadMiddleware } = await import('./upload.middleware.js');
  const app = express();
  const upload = createUploadMiddleware('pdf');
  const feedbackUpload = createUploadMiddleware('image', {
    storageScope: 'feedback',
    maxFileSize: 10,
    maxFields: 1,
    maxFieldSize: 32,
    maxFiles: 1,
    maxParts: 3,
    allowedMimeTypes: ['image/jpeg', 'image/png'],
    allowedExtensions: ['.jpg', '.jpeg', '.png'],
    mimeExtensionPairs: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    requireMimeAndExtension: true,
  });

  app.post('/upload', (req, res) => {
    upload.single('file')(req, res, (error) => {
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      const file = req.file as Express.Multer.File;
      res.status(201).json({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
      } satisfies UploadResponse);
    });
  });

  app.post('/feedback-upload', (req, res) => {
    feedbackUpload.single('file')(req, res, (error) => {
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      const file = req.file as Express.Multer.File;
      res.status(201).json({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
      } satisfies UploadResponse);
    });
  });

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Test server did not bind to a TCP port');
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  fs.rmSync(uploadRoot, { recursive: true, force: true });
  delete process.env.UPLOAD_ROOT_DIR;
  delete process.env.UPLOAD_DIR;
});

describe('createUploadMiddleware multipart filename parsing', () => {
  it('preserves Chinese and ASCII filenames while generating safe physical names', async () => {
    const chinese = await sendMultipart('中文证据.pdf', 'application/pdf');
    const ascii = await sendMultipart('evidence.pdf', 'application/pdf');

    expect(chinese.status).toBe(201);
    expect(chinese.body.originalName).toBe('中文证据.pdf');
    expect(chinese.body.filename).toMatch(/^[a-f0-9-]+\.pdf$/);
    expect(chinese.body.filename).not.toContain('中文证据');
    expect(chinese.body.size).toBe(Buffer.byteLength('test contents'));
    expect(fs.readFileSync(chinese.body.path, 'utf8')).toBe('test contents');

    expect(ascii.status).toBe(201);
    expect(ascii.body.originalName).toBe('evidence.pdf');
    expect(ascii.body.filename).toMatch(/^[a-f0-9-]+\.pdf$/);
    expect(fs.existsSync(ascii.body.path)).toBe(true);
  });

  it('keeps file-type validation in place', async () => {
    const invalid = await sendMultipart('evidence.txt', 'text/plain');

    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toContain('Invalid file type');
  });

  it('can require matching MIME and extension while forcing a server-side scope', async () => {
    const valid = await sendMultipart(
      'screenshot.png',
      'image/png',
      'pixels',
      '/feedback-upload',
      '../../outside',
    );
    const wrongExtension = await sendMultipart(
      'payload.html',
      'image/png',
      'pixels',
      '/feedback-upload',
    );
    const wrongMime = await sendMultipart(
      'screenshot.png',
      'text/html',
      'pixels',
      '/feedback-upload',
    );
    const mismatchedImageFormat = await sendMultipart(
      'screenshot.jpg',
      'image/png',
      'pixels',
      '/feedback-upload',
    );

    expect(valid.status).toBe(201);
    expect(valid.body.path).toContain(`${path.sep}feedback${path.sep}image${path.sep}`);
    expect(wrongExtension.status).toBe(400);
    expect(wrongMime.status).toBe(400);
    expect(mismatchedImageFormat.status).toBe(400);
  });

  it('supports a smaller endpoint-specific upload limit', async () => {
    const oversized = await sendMultipart(
      'screenshot.png',
      'image/png',
      '12345678901',
      '/feedback-upload',
    );

    expect(oversized.status).toBe(400);
    expect(oversized.body.error).toContain('File too large');
  });
});
