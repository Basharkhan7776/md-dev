#!/usr/bin/env bun
import { $ } from "bun";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const config = resolve(root, "web/vite.config.ts");

console.log("Building web viewer…");
const result = await $`bunx vite build --config ${config}`.cwd(root).nothrow();
if (result.exitCode !== 0) {
  console.error(result.stderr.toString() || result.stdout.toString());
  process.exit(result.exitCode ?? 1);
}
console.log("Web assets → dist/web");
