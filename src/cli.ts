#!/usr/bin/env bun
import { existsSync, statSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import { parseArgs } from "node:util";
import { openBrowser } from "./open";
import { resolveMarkdownPath } from "./paths";
import { findWebRoot, startServer } from "./server";

const VERSION = "1.0.2";

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
md-dev v${VERSION} — Markdown viewer (Geist theme · Mermaid)

Usage:
  md-dev [file] [options]

Arguments:
  file                 Markdown file to preview (default: README.md)

Options:
  -p, --port <n>       Port (default: ${DEFAULT_PORT})
  -H, --host <host>    Host (default: 127.0.0.1)
  --theme <theme>      light | dark | system (default: system)
  --no-open            Do not open the browser
  --no-watch           Disable live reload
  -h, --help           Show help
  -v, --version        Show version

Examples:
  md-dev README.md
  md-dev docs/guide.md -p 5173
  md-dev ./notes.md --theme dark --no-open

Install (global):
  bun install -g md-dev
  npm install -g md-dev   # still requires Bun on PATH

Note:
  Port 6000 is blocked by Chrome/Edge (ERR_UNSAFE_PORT). Default is ${DEFAULT_PORT}.
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
        "no-open": { type: "boolean", default: false },
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

  const theme = String(values.theme ?? "system");
  if (!["light", "dark", "system"].includes(theme)) {
    console.error(`Invalid --theme "${theme}". Use light, dark, or system.`);
    process.exit(1);
  }

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
      watch: !values["no-watch"],
      theme: theme as "light" | "dark" | "system",
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
  print(`  ➜  Watch:   ${values["no-watch"] ? "off" : "on"}`);
  print("");
  print("  Press Ctrl+C to stop");
  print("");

  if (!values["no-open"]) {
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
