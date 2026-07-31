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

```bash
bun run build
npm login
npm publish --access public
```

`prepublishOnly` runs the full build (web assets + CLI bundle). Published package ships `bin/mdparse` + `dist/` (no runtime npm deps; web is prebuilt).

## Development

```bash
bun install
bun run build:web          # SPA → dist/web
bun run src/cli.ts fixtures/sample.md
bun run build              # full package build
```

## License

MIT
