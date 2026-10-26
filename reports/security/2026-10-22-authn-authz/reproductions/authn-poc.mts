// Isolated, no network/DB: real controller/service/JWT/middleware, in-memory model substitutes.
import assert from 'node:assert/strict';
process.chdir('/tmp');
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'isolated-authn-scan-access-key-not-used-outside-this-test';
process.env.JWT_REFRESH_SECRET = 'isolated-authn-scan-refresh-key-not-used-outside-this-test';
process.env.LOG_ENABLED = 'false';
process.env.EMAIL_ENABLED = 'false';
const base = '/home/cjy/polarcraft/server/src';
const { TokenService } = await import(`${base}/services/token.service.ts`);
const { AuthController } = await import(`${base}/controllers/auth.controller.ts`);
const { RefreshTokenModel } = await import(`${base}/models/refresh-token.model.ts`);
const { UserModel } = await import(`${base}/models/user.model.ts`);
const { authenticate } = await import(`${base}/middleware/auth.middleware.ts`);
const { requireAdmin } = await import(`${base}/middleware/rbac.middleware.ts`);
const { verifyAccessToken } = await import(`${base}/utils/jwt.util.ts`);

const records = new Map();
let revokeCalls = 0;
let userLookups = 0;
let accountState = { id: 'synthetic-account', username: 'synthetic', role: 'admin', is_active: true };
RefreshTokenModel.create = async ({ userId, token, expiresAt }) => {
  const row = { id: String(records.size + 1), user_id: userId, token, expires_at: expiresAt, revoked_at: null };
  records.set(token, row);
  return row;
};
RefreshTokenModel.findByToken = async token => {
  const row = records.get(token);
  return row && row.revoked_at === null ? { ...row } : null;
};
RefreshTokenModel.revoke = async id => {
  revokeCalls++;
  const row = [...records.values()].find(item => item.id === id);
  if (row) row.revoked_at = new Date();
  return Boolean(row);
};
UserModel.updateLastLogin = async () => {};
UserModel.findById = async () => {
  userLookups++;
  return accountState.is_active ? { ...accountState } : null;
};

const issued = await TokenService.generateTokens(accountState);
const req = { cookies: { access_token: issued.accessToken, refresh_token: issued.refreshToken }, headers: {} };
authenticate(req, { status: () => { throw new Error('Unexpected authentication failure'); } }, () => {});
assert.equal(req.sessionId, undefined);
const cleared = [];
await new Promise((resolve, reject) => AuthController.logout(req, {
  clearCookie: name => cleared.push(name),
  success: () => resolve(undefined),
}, reject));
assert.deepEqual(cleared, ['access_token', 'refresh_token', 'remember_me']);
assert.equal(revokeCalls, 0);
const afterLogout = await TokenService.refreshAccessToken(issued.refreshToken);
assert.equal(verifyAccessToken(afterLogout.accessToken).sub, accountState.id);
console.log('PASS: successful logout cleared cookies but made zero revocation calls; saved refresh token renewed session.');

accountState = { ...accountState, role: 'user', is_active: false };
const afterDisable = await TokenService.refreshAccessToken(afterLogout.refreshToken);
assert.equal(userLookups, 0);
assert.equal(verifyAccessToken(afterDisable.accessToken).role, 'admin');
let adminAllowed = false;
const disabledReq = { cookies: { access_token: afterDisable.accessToken }, headers: {} };
authenticate(disabledReq, { status: () => { throw new Error('Unexpected authentication failure'); } }, () => {});
requireAdmin(disabledReq, { status: () => { throw new Error('Unexpected admin denial'); } }, () => { adminAllowed = true; });
assert.equal(adminAllowed, true);
console.log('PASS: refresh performed zero user-state reads, reissued stale admin claim, and authenticate + requireAdmin allowed it.');

const racePair = await TokenService.generateTokens({ ...accountState, role: 'user' });
const concurrent = await Promise.all([
  TokenService.refreshAccessToken(racePair.refreshToken),
  TokenService.refreshAccessToken(racePair.refreshToken),
]);
assert.notEqual(concurrent[0].refreshToken, concurrent[1].refreshToken);
assert.equal(records.get(concurrent[0].refreshToken).revoked_at, null);
assert.equal(records.get(concurrent[1].refreshToken).revoked_at, null);
console.log('PASS: two concurrent refreshes of one token each produced a distinct active refresh token (in-memory DB semantics).');
process.exit(0);
