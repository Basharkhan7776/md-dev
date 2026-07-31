# Publish mdparse to npm (GitHub Actions)

## 1. Create an npm token

Because account 2FA is enabled, a normal `npm login` password is not enough for CI.

### Recommended: Granular Access Token

1. Open [npm Access Tokens](https://www.npmjs.com/settings/~/tokens)
2. **Generate New Token** → **Granular Access Token**
3. Configure:
   - **Token name**: `github-actions-mdparse`
   - **Expiration**: e.g. 90 days or no expiry (your choice)
   - **Permissions**: **Read and write**
   - **Packages and scopes**:
     - Select package `mdparse` after first publish, **or**
     - Allow **all packages** under your user for first publish
   - **Bypass two-factor authentication**: **Yes** (required for CI publish)
4. Copy the token once (starts with `npm_...`)

### Alternative: Classic Automation token

1. Tokens → **Generate New Token** → **Classic**
2. Type: **Automation** (does not require OTP on publish)
3. Copy the token

---

## 2. Add the secret on GitHub

1. Repo → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: paste the npm token
5. Save

---

## 3. Workflows

| Workflow | File | When |
|----------|------|------|
| **CI** | `.github/workflows/ci.yml` | Push / PR to `main` — install, build, smoke test |
| **Publish** | `.github/workflows/publish.yml` | GitHub Release, tag `v*`, or manual run |

Publish uses:

```yaml
env:
  NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

and runs `npm publish --access public --provenance`.

---

## 4. How to release

Bump version in `package.json` first (npm will not overwrite an existing version).

```bash
# local
# edit package.json "version": "1.0.1"
git add package.json
git commit -m "chore: release v1.0.1"
git tag v1.0.1
git push origin main --tags
```

Or create a **GitHub Release** with tag `v1.0.1` — that also triggers publish.

### Manual publish

GitHub → **Actions** → **Publish to npm** → **Run workflow**  
Set dry_run to `true` to only pack without publishing.

---

## 5. First-time local publish (optional)

If CI fails before the package exists, publish once from your machine:

```bash
npm publish --access public --otp=XXXXXX
```

Then restrict the granular token to the `mdparse` package only.

---

## 6. Install after publish

```bash
bun install -g mdparse
# or
npm install -g mdparse

mdparse README.md
# requires Bun on PATH
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `403 Two-factor authentication ... required` | Token must be **Automation** or granular with **Bypass 2FA** |
| `403 You do not have permission` | Token scope/package wrong, or name owned by someone else |
| `402 Payment required` / 404 on name | Use a free **scoped** name: `@basharkhan7776/mdparse` |
| `cannot publish over existing version` | Bump `version` in `package.json` |
| `NPM_TOKEN` empty | Add repo secret `NPM_TOKEN` (exact name) |
| Provenance fails | Ensure `id-token: write` permission (already in workflow) |

### Scoped package (if `mdparse` is blocked)

```json
{
  "name": "@basharkhan7776/mdparse",
  "publishConfig": { "access": "public" }
}
```

Install: `npm i -g @basharkhan7776/mdparse`
