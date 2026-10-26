import { fileURLToPath } from 'node:url';
process.chdir('/tmp');
export default { root: '/tmp', test: { globals: true, include: [fileURLToPath(new URL('./private-autojoin.test.ts', import.meta.url))], environment: 'node', poolOptions: { forks: { singleFork: true } } } };
