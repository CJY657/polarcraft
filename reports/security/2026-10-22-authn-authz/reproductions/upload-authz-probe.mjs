import fs from 'node:fs';
import path from 'node:path';
import { Readable, Writable } from 'node:stream';
process.chdir('/tmp');
const { default: express } = await import('/home/cjy/polarcraft/server/node_modules/express/index.js');
const probeRoot = fs.mkdtempSync('/tmp/polarcraft-upload-authz-');
process.env.UPLOAD_ROOT_DIR = path.join(probeRoot, 'uploads');
process.env.UPLOAD_DIR = path.join(probeRoot, 'uploads/courses');
const { createUploadMiddleware } = await import('/home/cjy/polarcraft/server/src/middleware/upload.middleware.ts');
const { UploadController } = await import('/home/cjy/polarcraft/server/src/controllers/upload.controller.ts');
async function anonymousStaticProbe(relativePath = 'courses/project-meeting-record-audit/document/known-file.txt', contents = 'synthetic private meeting attachment') {
  const privatePath = path.join(process.env.UPLOAD_ROOT_DIR, relativePath);
  fs.mkdirSync(path.dirname(privatePath), { recursive: true });
  fs.writeFileSync(privatePath, contents);
  const req = Readable.from([]);
  req.method = 'GET';
  req.url = '/' + relativePath;
  req.headers = {};
  const headers = {};
  let data = '';
  const res = new Writable({ write(chunk, encoding, callback) { data += chunk.toString(); callback(); } });
  res.setHeader = (name, value) => { headers[name.toLowerCase()] = value; };
  res.getHeader = name => headers[name.toLowerCase()];
  res.removeHeader = name => { delete headers[name.toLowerCase()]; };
  res.statusCode = 200;
  res.finished = false;
  const result = new Promise((resolve, reject) => {
    res.on('finish', () => resolve({ status: res.statusCode, headers, body: data, cookiesSent: false }));
    express.static(process.env.UPLOAD_ROOT_DIR, { maxAge: '1d', etag: true, index: false })(req, res, err => reject(err ?? new Error('Static fixture not found')));
  });
  return await result;
}
async function probe(filename, mimeType, unitId, options = {}) {
  const boundary = 'audit-boundary';
  const harmless = '<!doctype html><title>local security audit marker</title>';
  const fields = unitId === null ? '' : `--${boundary}\r\nContent-Disposition: form-data; name="unitId"\r\n\r\n${unitId}\r\n`;
  const body = Buffer.from(`${fields}--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n${harmless}\r\n--${boundary}--\r\n`);
  const req = Readable.from([body]);
  req.method = 'POST';
  req.headers = { 'content-type': `multipart/form-data; boundary=${boundary}`, 'content-length': String(body.length) };
  req.body = { unitId: 'course-discussion-server-selected' };
  req.params = { category: 'image' };
  req.user = { username: 'synthetic-auditor' };
  return await new Promise(resolve => createUploadMiddleware('image', options).single('file')(req, {}, async err => {
    let controllerResponse = null;
    if (!err && filename.endsWith('.html')) {
      controllerResponse = await new Promise((reply, reject) => {
        const res = { locals: {}, statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { reply({ status: this.statusCode, data }); return this; } };
        UploadController.uploadFile(req, res, reject);
      });
    }
    resolve({
    controllerResponse,
    accepted: !err,
    error: err?.message,
    storagePath: req.file ? path.relative(probeRoot, req.file.path) : null,
    bodyScopeAfterMulter: req.body?.unitId ?? null,
    outsideConfiguredUploadRoot: req.file ? !req.file.path.startsWith(process.env.UPLOAD_ROOT_DIR + path.sep) : null,
    harmlessBytesUnmodified: req.file ? fs.readFileSync(req.file.path, 'utf8') === harmless : null,
  }); }));
}
try {
  console.log(JSON.stringify({
    anonymousPrivateAttachment: await anonymousStaticProbe(),
    anonymousHtmlResponse: await anonymousStaticProbe('courses/general/image/audit-marker.html', '<!doctype html><title>local security audit marker</title>'),
    normalImageRouteHtml: await probe('audit-marker.html', 'image/png', null),
    clientScopeTraversal: await probe('audit-marker.png', 'image/png', '../../escaped'),
    serverFixedScopeControl: await probe('audit-marker.png', 'image/png', '../../escaped', { storageScope: 'server-fixed', requireMimeAndExtension: true }),
    strictExtensionControl: await probe('audit-marker.html', 'image/png', null, { storageScope: 'server-fixed', requireMimeAndExtension: true }),
  }, null, 2));
} finally {
  fs.rmSync(probeRoot, { recursive: true, force: true });
}
