#!/usr/bin/env bun
import { $ } from "bun";
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");

// 1) Web SPA
await $`bun run scripts/build-web.ts`.cwd(root);

// 2) Bundle CLI for distribution (Bun target — uses Bun.serve)
mkdirSync(resolve(root, "dist"), { recursive: true });
console.log("Bundling CLI…");

const entry = resolve(root, "src/cli.ts");
const out = resolve(root, "dist/cli.js");

const result =
  await $`bun build ${entry} --outfile ${out} --target bun --minify`.cwd(
    root,
  ).nothrow();

if (result.exitCode !== 0) {
  console.error(result.stderr.toString() || result.stdout.toString());
  process.exit(result.exitCode ?? 1);
}

// Ensure shebang for direct execution
let code = await Bun.file(out).text();
if (!code.startsWith("#!")) {
  code = "#!/usr/bin/env bun\n" + code;
  writeFileSync(out, code);
}
try {
  chmodSync(out, 0o755);
} catch {
  /* windows */
}

// bin wrapper executable
const bin = resolve(root, "bin/mdparse");
if (existsSync(bin)) {
  try {
    chmodSync(bin, 0o755);
  } catch {
    /* ignore */
  }
}

console.log("CLI → dist/cli.js");
console.log("Build complete.");
