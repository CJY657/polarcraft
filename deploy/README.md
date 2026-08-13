# GitHub automatic production deployment

The workflow in `.github/workflows/deploy-production.yml` validates, builds,
and deploys every push to `main`. Builds run on GitHub-hosted runners; the
server receives only `dist`, `server/dist`, and backend package manifests.
Persistent uploads, backend `.env` files, the database, and PM2 logs are never
synced.

The automatic gate runs the passing backend TypeScript check plus both
production builds. The repository's frontend typecheck, complete test suites,
and lint command should be made required only after their existing baseline
failures are fixed.

The deployment uses a fixed same-disk staging directory, verifies SHA-256
checksums, installs production dependencies only when backend manifests change,
stops PM2 during the brief multi-directory switch, and restores the prior
release when activation, termination handling, or any health probe fails.

## One-time server setup

Use a dedicated SSH key that does not require the interactive Tencent Cloud QR
login. Run these commands on a trusted computer, replacing `ubuntu` and the
host as needed:

```bash
ssh-keygen -t ed25519 -N '' -f ~/.ssh/polarcraft-github-actions -C github-actions-polarcraft
ssh-copy-id -i ~/.ssh/polarcraft-github-actions.pub ubuntu@43.161.250.206
```

After this change is present on the server, install the fixed privileged helper
and give the SSH user permission to create the staging directory:

```bash
scp -i ~/.ssh/polarcraft-github-actions \
  deploy/polarcraft-deploy ubuntu@43.161.250.206:/tmp/polarcraft-deploy
ssh -i ~/.ssh/polarcraft-github-actions ubuntu@43.161.250.206
cd /var/www/polarcraft
sudo install -o root -g root -m 0755 /tmp/polarcraft-deploy /usr/local/sbin/polarcraft-deploy
sudo install -d -o ubuntu -g ubuntu -m 0755 /var/www/polarcraft/.deploy-staging
printf '%s\n' 'ubuntu ALL=(root) NOPASSWD: /usr/local/sbin/polarcraft-deploy' \
  | sudo tee /etc/sudoers.d/polarcraft-deploy >/dev/null
sudo chmod 0440 /etc/sudoers.d/polarcraft-deploy
sudo visudo -cf /etc/sudoers.d/polarcraft-deploy
rm /tmp/polarcraft-deploy
```

Confirm the existing production assumptions before enabling the workflow:

```bash
test -f /var/www/polarcraft/.env || test -f /var/www/polarcraft/server/.env
test -d /data/polarcraft/uploads
sudo pm2 describe polarcraft
curl -fsS http://127.0.0.1:3001/api/health
npm --version
rsync --version | head -n 1
```

## GitHub production environment

In the repository, create an environment named `production`, restrict it to the
`main` branch, and add these environment secrets:

| Secret | Value |
| --- | --- |
| `SSH_HOST` | `43.161.250.206` |
| `SSH_PORT` | `22` |
| `SSH_USER` | `ubuntu` or the dedicated deployment user |
| `SSH_KEY` | Complete contents of `~/.ssh/polarcraft-github-actions` |
| `SSH_KNOWN_HOSTS` | Verified SSH host-key line for this host and port |

Do not generate `SSH_KNOWN_HOSTS` blindly inside the workflow. Compare the
server console's `/etc/ssh/ssh_host_ed25519_key.pub` fingerprint with the key
you store. For port 22 the secret line has this shape:

```text
43.161.250.206 ssh-ed25519 AAAA...
```

Add these repository-level Actions variables. They are build-time public
frontend configuration, not server secrets. Copy the current values from the
ignored local `.env.production` before enabling the workflow so analytics
behavior does not change.

| Variable | Default |
| --- | --- |
| `VITE_PUBLIC_POSTHOG_KEY` | Required current PostHog project key |
| `VITE_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` |
| `VITE_PUBLIC_POSTHOG_SESSION_RECORDING` | `false` |

The workflow can also be run manually from the Actions tab. Keep
`cancel-in-progress: false`: a newer push waits instead of interrupting an
in-progress atomic deployment.
