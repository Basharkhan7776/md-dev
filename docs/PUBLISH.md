# CI/CD (like create-churn)

One workflow: **`.github/workflows/publish.yml`** (`CI & Publish`).

```
every push / PR  →  test (install, build, smoke)
push to main     →  test → publish to npm (if version is new)
```

## Secret

| Name | Where |
|------|--------|
| `NPM_TOKEN` | GitHub → Settings → Secrets and variables → Actions |

### Create the token (npm)

Because 2FA is on, use one of:

1. **Granular Access Token** — Read/write + **Bypass two-factor authentication**  
   https://www.npmjs.com/settings/~/tokens  
2. **Classic Automation** token (no OTP on publish)

Paste the value into the `NPM_TOKEN` secret.

## Release flow

1. Bump `"version"` in `package.json` (e.g. `1.0.0` → `1.0.1`)
2. Commit and push to **main**
3. GitHub Actions runs CI, then publishes that version once

If you push without bumping the version, CI still runs; publish **skips** (version already on npm).

## Manual local publish

```bash
bun run build
npm publish --access public --otp=XXXXXX
```
