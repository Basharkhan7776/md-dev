# mdparse

CLI Markdown viewer powered by **Bun**. Open a clean preview of any `.md` file in your browser with a **Vercel Geist** look, GFM tables, **syntax-colored** code (Geist palette), and Mermaid diagrams.

## Install

Requires [Bun](https://bun.sh) ≥ 1.1.

```bash
# Global (recommended)
bun install -g mdparse

# Or with npm (Bun must still be on PATH)
npm install -g mdparse
```

From this repo (local link):

```bash
bun install
bun run build
bun link          # then: mdparse README.md
```

## Usage

```bash
mdparse README.md
mdparse docs/guide.md -p 5173
mdparse ./notes.md --theme dark
mdparse .                 # README.md / index.md
```

Opens **http://127.0.0.1:5000** by default.

```
mdparse [file] [options]

  -p, --port <n>       Port (default: 5000)
  -H, --host <host>    Host (default: 127.0.0.1)
  --theme <theme>      light | dark | system (default: system)
  --no-open            Do not open the browser
  --no-watch           Disable live reload
  -h, --help
  -v, --version
```

Theme follows the OS by default (`system`). Override with `--theme light` or `--theme dark` — there is no in-page toggle.

> **Chrome:** port **6000** is blocked (`ERR_UNSAFE_PORT`). Default is **5000**.

## Features

| Feature | Details |
| --- | --- |
| Local server | Bun.serve on port 5000 |
| Minimal UI | Markdown only — no chrome bar / TOC / footer |
| Geist code | Vercel-style token colors via Shiki |
| GFM | Tables, task lists, strikethrough |
| Mermaid | Fenced mermaid code blocks |
| Images | Relative paths via `/media/*` |
| Live reload | File watch + SSE |

## Publish to npm

### GitHub Actions (recommended)

1. Create an npm **granular** token with **publish** + **Bypass 2FA**  
   (or a classic **Automation** token) — see [docs/PUBLISH.md](docs/PUBLISH.md)
2. GitHub repo → **Settings** → **Secrets and variables** → **Actions**  
   → secret name: **`NPM_TOKEN`**
3. Release:

```bash
# bump version in package.json, then:
git tag v1.0.1
git push origin main --tags
# or create a GitHub Release
```

Workflows:

| Workflow | Trigger |
|----------|---------|
| [CI](.github/workflows/ci.yml) | push / PR — build + smoke test |
| [Publish](.github/workflows/publish.yml) | tag `v*`, GitHub Release, or manual |

### Local publish

```bash
bun run build
npm publish --access public --otp=XXXXXX   # if 2FA is on
```

Published package ships `bin/mdparse` + `dist/` (prebuilt; needs Bun on the machine to run).

## Development

```bash
bun install
bun run build:web          # SPA → dist/web
bun run src/cli.ts fixtures/sample.md
bun run build              # full package build
```

## License

MIT
