# md-dev

CLI Markdown viewer powered by **Bun**. Open a clean preview of any `.md` file in your browser with a **Vercel Geist** look, GFM tables, **syntax-colored** code (Geist palette), and Mermaid diagrams.

## Install

Requires [Bun](https://bun.sh) ≥ 1.1.

```bash
# Global (recommended)
bun install -g md-dev

# Or with npm (Bun must still be on PATH)
npm install -g md-dev
```

From this repo (local link):

```bash
bun install
bun run build
bun link          # then: md-dev README.md
```

## Usage

```bash
md-dev README.md
md-dev --light README.md         # Open directly in light mode
md-dev --dark docs/guide.md      # Open directly in dark mode
md-dev README.md -W --toc        # Wide layout with Table of Contents
md-dev notes.md -d -W --zen      # Dark mode, wide view, zen mode (no header)
md-dev .                         # README.md / index.md
```

Opens **http://127.0.0.1:5000** by default.

```
md-dev [file] [options]

Theme Options:
  -l, --light          Open in light mode
  -d, --dark           Open in dark mode
  --theme <theme>      Theme mode: light | dark | system (default: system)

Layout Options:
  -W, --wide           Wide layout (max-w-5xl, ideal for diagrams & tables)
  --full               Full-width layout (max-w-7xl)
  --toc                Show Table of Contents sidebar
  --no-toc             Hide Table of Contents sidebar
  --zen, --no-topbar   Zen mode: hide the top navigation header

Diagram Options:
  --no-zoom            Disable click-to-zoom dialog on Mermaid diagrams

Server Options:
  -p, --port <n>       Port (default: 5000)
  -H, --host <host>    Host (default: 127.0.0.1)
  -o, --open           Open browser on start (default: true)
  --no-open            Do not open the browser
  -w, --watch          Watch file for live reload (default: true)
  --no-watch           Disable live reload
  -h, --help           Show help
  -v, --version        Show version
```

> **Chrome:** port **6000** is blocked (`ERR_UNSAFE_PORT`). Default is **5000**.

## Features

| Feature | Details |
| --- | --- |
| Local server | Bun.serve on port 5000 with live reload |
| Interactive Mermaid | Click diagram to open zoomable modal with pinch, +/- zoom, and hold-drag pan |
| Themes | System, light (`--light`/`-l`), or dark (`--dark`/`-d`) with topbar toggle |
| Layouts | Normal, wide (`--wide`/`-W`), full-width (`--full`), and Zen (`--zen`) |
| Table of Contents | Optional sticky TOC sidebar (`--toc`) with active section highlighting |
| Geist styling | Vercel Geist typography and token colors via Shiki |
| GFM | Tables, task lists, strikethrough, autolinked headings |
| Images | Relative paths served via `/media/*` |
| Live reload | File watch + SSE instant refresh |

## CI/CD (GitHub Actions)

Same idea as [create-churn](https://github.com/Basharkhan7776/Churn): **every push runs CI**; **main also publishes to npm**.

Workflow: [`.github/workflows/publish.yml`](.github/workflows/publish.yml)

| Event | What runs |
|-------|-----------|
| Push / PR | Install → build → smoke test |
| Push to `main` | Same CI, then **npm publish** (if version is new) |

### Setup once

1. Create an npm token (**Automation** or granular with **Bypass 2FA**) — [docs/PUBLISH.md](docs/PUBLISH.md)
2. Repo → **Settings** → **Secrets** → **Actions** → name: **`NPM_TOKEN`**

### Release

```bash
# 1. Bump version in package.json
# 2. Push to main
git add package.json
git commit -m "chore: release 1.0.2"
git push origin main
# → CI runs → npm publish md-dev@1.0.2
```

If the version is already on npm, publish is skipped (CI still passes).

### Local publish

```bash
bun run build
npm publish --access public --otp=XXXXXX
```

Package ships `bin/md-dev` + `dist/` (needs Bun on the machine to run).

## Development

```bash
bun install
bun run build:web          # SPA → dist/web
bun run src/cli.ts fixtures/sample.md
bun run build              # full package build
```

## License

MIT
