import { generateAccessToken } from '../utils/jwt.util.js';

const userToken = generateAccessToken({ sub: 'e2e-user-1', username: 'e2e_user', role: 'user' });
const adminToken = generateAccessToken({ sub: 'e2e-admin-1', username: 'e2e_admin', role: 'admin' });
console.log(JSON.stringify({ userToken, adminToken }));
