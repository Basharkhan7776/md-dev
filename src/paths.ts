import { resolve, normalize, relative, dirname, join, isAbsolute } from "node:path";

/** Resolve a user-supplied path to an absolute markdown file path. */
export function resolveMarkdownPath(input: string, cwd = process.cwd()): string {
  const abs = isAbsolute(input) ? input : resolve(cwd, input);
  return normalize(abs);
}

/**
 * Safely resolve a media path relative to the markdown file's directory.
 * Returns null if the path escapes the allowed root (markdown parent dir).
 */
export function resolveMediaPath(
  mediaRelative: string,
  markdownFile: string,
): string | null {
  const root = dirname(resolve(markdownFile));
  // Decode URL path, strip leading slashes
  let decoded = decodeURIComponent(mediaRelative).replace(/^\/+/, "");
  // Block absolute paths and null bytes
  if (decoded.includes("\0") || isAbsolute(decoded)) return null;

  const candidate = normalize(join(root, decoded));
  const rel = relative(root, candidate);
  if (rel.startsWith("..") || isAbsolute(rel)) return null;
  return candidate;
}

export function getMediaRoot(markdownFile: string): string {
  return dirname(resolve(markdownFile));
}
