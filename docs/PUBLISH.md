# Fix npm 403 in GitHub Actions (2FA)

Your log means:

1. ✅ CI built the package  
2. ✅ GitHub OIDC / provenance worked  
3. ❌ **`NPM_TOKEN` cannot publish** because of 2FA  

```
403 Forbidden — Two-factor authentication or granular access token
with bypass 2fa enabled is required to publish packages.
```

The secret is set, but it is the **wrong token type** (e.g. “Publish” classic token, or granular **without** Bypass 2FA).

---

## Fix in 3 minutes

### 1. Create the correct npm token

Open: https://www.npmjs.com/settings/~/tokens  
(or https://www.npmjs.com/settings/basharkhan7776/tokens)

#### Option A — Classic **Automation** (recommended for CI)

1. **Generate New Token** → **Classic Token**
2. Type: **Automation**  
   - Do **not** choose “Publish” (that needs OTP every time → CI fails)
3. Copy token (`npm_...`)

#### Option B — Granular Access Token

1. **Generate New Token** → **Granular Access Token**
2. Name: `github-actions-mdparse`
3. Expiration: your choice
4. **Permissions**: Read and write  
5. **Packages and scopes**:  
   - Allow publish for your user / all packages (needed for first publish of `mdparse`)  
6. **Bypass two-factor authentication**: **ON** ✅  
7. Generate and copy

### 2. Replace the GitHub secret

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Open **`NPM_TOKEN`** → **Update**
3. Paste the **new** token (not the old one)
4. Save

### 3. Re-run the workflow

- Actions → failed run → **Re-run failed jobs**  
  or push a commit to `main`

---

## CI/CD flow (create-churn style)

| Event | Jobs |
|-------|------|
| Any push / PR | CI (build + smoke) |
| Push to `main` | CI → `npm publish` if version is new |

Bump `version` in `package.json` before each release.

---

## Checklist if it still 403s

- [ ] Token type is **Automation** or granular with **Bypass 2FA**
- [ ] Secret name is exactly `NPM_TOKEN`
- [ ] You **updated** the secret after creating the new token (old token still fails)
- [ ] Token was not revoked / expired
- [ ] You are logged into the same npm user that will own `mdparse` (`basharkhan7776`)

---

## First publish locally (optional)

If you prefer to create the package once by hand:

```bash
bun run build
npm publish --access public --otp=123456   # code from authenticator app
```

After that, CI Automation/granular token can publish later versions.
