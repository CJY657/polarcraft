# Reproduce the component checks

These checks reproduce existing vulnerable behavior. They do not fix it or prove production exploitation. They use the installed workspace dependencies, synthetic credentials/state, and harmless temporary fixtures. Source imports are anchored to `/home/cjy/polarcraft`; adjust those absolute imports if moving the checkout. Do not substitute production credentials or database connections.

From `/home/cjy/polarcraft`:

```sh
rtk proxy node --import /home/cjy/polarcraft/server/node_modules/tsx/dist/loader.mjs reports/security/2026-10-22-authn-authz/reproductions/authn-poc.mts
rtk proxy node --import /home/cjy/polarcraft/server/node_modules/tsx/dist/loader.mjs reports/security/2026-10-22-authn-authz/reproductions/upload-authz-probe.mjs
rtk proxy pnpm --filter polariscope-server exec vitest run --config /home/cjy/polarcraft/reports/security/2026-10-22-authn-authz/reproductions/vitest.config.mjs --pool forks
```

The authentication script changes cwd to `/tmp`, sets synthetic signing keys, disables email/logging, and replaces model methods in memory. The upload script uses actual Multer/Express components, a stream fixture instead of a listening server, and cleans up its own temporary directory. The research tests mock persistence/network-facing dependencies while exercising real controllers, models for reference resolution, and access policy.

Saved outputs are the original successful runs. Dynamic timestamps and random fixture filenames will differ on rerun. Existing-suite logs retain the first collection failure and successful isolated rerun. No browser execution or end-to-end authenticated HTTP route test is implied.
