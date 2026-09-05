#!/usr/bin/env bun
import { existsSync, statSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import { parseArgs } from "node:util";
import { openBrowser } from "./open";
import { resolveMarkdownPath } from "./paths";
import { findWebRoot, startServer } from "./server";

const VERSION = "1.0.5";

/** Default port. Avoid 6000 — Chrome/Edge block it (ERR_UNSAFE_PORT / X11). */
const DEFAULT_PORT = 5000;

/** Ports blocked by Chromium as "unsafe" (subset most relevant to local servers). */
const CHROME_UNSAFE_PORTS = new Set([
  1, 7, 9, 11, 13, 15, 17, 19, 20, 21, 22, 23, 25, 37, 42, 43, 53, 69, 77, 79,
  87, 95, 101, 102, 103, 104, 109, 110, 111, 113, 115, 117, 119, 123, 135, 137,
  139, 143, 161, 179, 389, 427, 465, 512, 513, 514, 515, 526, 530, 531, 532,
  540, 548, 554, 556, 563, 587, 601, 636, 989, 990, 993, 995, 1719, 1720, 1723,
  2049, 3659, 4045, 5060, 5061, 6000, 6566, 6665, 6666, 6667, 6668, 6669, 6697,
  10080,
]);

const HELP = `
md-dev v${VERSION} — Markdown viewer (Geist theme · Mermaid · Live reload)

Usage:
  md-dev [file] [options]

Arguments:
  file                 Markdown file to preview (default: README.md)

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
  -p, --port <n>       Port (default: ${DEFAULT_PORT})
  -H, --host <host>    Host (default: 127.0.0.1)
  -o, --open           Open browser on start (default: true)
  --no-open            Do not open the browser
  -w, --watch          Watch file for live reload (default: true)
  --no-watch           Disable live reload
  -h, --help           Show help
  -v, --version        Show version

Examples:
  md-dev README.md
  md-dev --light README.md
  md-dev -d fixtures/sample.md
  md-dev docs/guide.md -W --toc
  md-dev notes.md -d -W --zen --no-open
`.trim();

function resolveDefaultFile(cwd: string): string | null {
  for (const name of ["README.md", "readme.md", "Readme.md", "index.md"]) {
    const p = join(cwd, name);
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
}

/** Package root whether running from src/cli.ts or dist/cli.js */
function resolvePackageRoot(): string {
  const here = import.meta.dir;
  const base = basename(here);
  if (base === "dist" || base === "src") return resolve(here, "..");
  return resolve(here, "..");
}

function print(msg: string) {
  console.log(msg);
}

async function main() {
  let values: Record<string, unknown>;
  let positionals: string[];

  try {
    const parsed = parseArgs({
      args: Bun.argv.slice(2),
      options: {
        port: { type: "string", short: "p", default: String(DEFAULT_PORT) },
        host: { type: "string", short: "H", default: "127.0.0.1" },
        theme: { type: "string", default: "system" },
        light: { type: "boolean", short: "l", default: false },
        dark: { type: "boolean", short: "d", default: false },
        wide: { type: "boolean", short: "W", default: false },
        full: { type: "boolean", default: false },
        toc: { type: "boolean", default: false },
        "no-toc": { type: "boolean", default: false },
        zen: { type: "boolean", default: false },
        "no-topbar": { type: "boolean", default: false },
        "no-zoom": { type: "boolean", default: false },
        open: { type: "boolean", short: "o", default: false },
        "no-open": { type: "boolean", default: false },
        watch: { type: "boolean", short: "w", default: false },
        "no-watch": { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "v", default: false },
      },
      allowPositionals: true,
      strict: true,
    });
    values = parsed.values;
    positionals = parsed.positionals;
  } catch (err) {
    console.error(String(err));
    console.error("\nRun md-dev --help for usage.");
    process.exit(1);
  }

  if (values.help) {
    print(HELP);
    process.exit(0);
  }
  if (values.version) {
    print(VERSION);
    process.exit(0);
  }

  if (values.light && values.dark) {
    console.error("Error: Cannot specify both --light (-l) and --dark (-d).");
    process.exit(1);
  }

  let theme: "light" | "dark" | "system" = "system";
  if (values.light) {
    theme = "light";
  } else if (values.dark) {
    theme = "dark";
  } else if (values.theme) {
    const t = String(values.theme).toLowerCase();
    if (["light", "dark", "system"].includes(t)) {
      theme = t as "light" | "dark" | "system";
    } else {
      console.error(`Invalid --theme "${values.theme}". Use light, dark, or system.`);
      process.exit(1);
    }
  }

  let width: "normal" | "wide" | "full" = "normal";
  if (values.full) {
    width = "full";
  } else if (values.wide) {
    width = "wide";
  }

  const toc = Boolean(values.toc && !values["no-toc"]);
  const topbar = !(values.zen || values["no-topbar"]);
  const zoom = !values["no-zoom"];
  const shouldWatch = !values["no-watch"];
  const shouldOpen = !values["no-open"];

  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(`Invalid --port "${values.port}".`);
    process.exit(1);
  }

  if (CHROME_UNSAFE_PORTS.has(port)) {
    console.error(
      `Port ${port} is blocked by Chrome/Edge (ERR_UNSAFE_PORT). Use -p ${DEFAULT_PORT} or another free port (e.g. 5173, 8080).`,
    );
    process.exit(1);
  }

  const host = String(values.host ?? "127.0.0.1");
  const cwd = process.cwd();

  let fileArg = positionals[0];
  if (!fileArg) {
    const def = resolveDefaultFile(cwd);
    if (!def) {
      console.error("No file specified and no README.md / index.md found.");
      console.error("Usage: md-dev <file.md>");
      process.exit(1);
    }
    fileArg = def;
  } else if (
    fileArg === "." ||
    (existsSync(fileArg) && statSync(fileArg).isDirectory())
  ) {
    const dir = resolve(cwd, fileArg);
    const def = resolveDefaultFile(dir);
    if (!def) {
      console.error(`No README.md / index.md in ${dir}`);
      process.exit(1);
    }
    fileArg = def;
  }

  const file = resolveMarkdownPath(fileArg, cwd);
  if (!existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }
  if (!statSync(file).isFile()) {
    console.error(`Not a file: ${file}`);
    process.exit(1);
  }

  const packageRoot = resolvePackageRoot();
  const webRoot = findWebRoot(packageRoot);

  if (!existsSync(join(webRoot, "index.html"))) {
    console.error("Web assets missing. From the package directory run: bun run build");
    console.error(`Expected: ${join(webRoot, "index.html")}`);
    process.exit(1);
  }

  let instance: ReturnType<typeof startServer>;
  try {
    instance = startServer({
      file,
      host,
      port,
      watch: shouldWatch,
      theme,
      width,
      toc,
      topbar,
      zoom,
      webRoot,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("EADDRINUSE") || msg.includes("address already in use")) {
      console.error(
        `Port ${port} is already in use. Try: md-dev -p ${port + 1} ${basename(file)}`,
      );
    } else {
      console.error("Failed to start server:", msg);
    }
    process.exit(1);
  }

  const { url, stop } = instance;

  print("");
  print(`  md-dev · ${basename(file)}`);
  print(`  ${file}`);
  print("");
  print(`  ➜  Local:   ${url}`);
  print(`  ➜  Theme:   ${theme}`);
  print(`  ➜  Layout:  ${width}${toc ? " · TOC" : ""}${!topbar ? " · Zen" : ""}`);
  print(`  ➜  Watch:   ${shouldWatch ? "on" : "off"}`);
  print(`  ➜  Zoom:    ${zoom ? "enabled" : "disabled"}`);
  print("");
  print("  Press Ctrl+C to stop");
  print("");

  if (shouldOpen) {
    await openBrowser(url);
  }

  const shutdown = () => {
    stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
