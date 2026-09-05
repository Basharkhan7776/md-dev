import { existsSync, statSync, watch, type FSWatcher } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { resolveMediaPath } from "./paths";

export type ServerOptions = {
  file: string;
  host: string;
  port: number;
  watch: boolean;
  theme: "light" | "dark" | "system";
  webRoot: string;
  width?: "normal" | "wide" | "full";
  toc?: boolean;
  topbar?: boolean;
  zoom?: boolean;
};

type SseClient = {
  id: number;
  controller: ReadableStreamDefaultController<Uint8Array>;
};

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
};

function mimeFor(path: string): string {
  return MIME[extname(path).toLowerCase()] ?? "application/octet-stream";
}

export function startServer(opts: ServerOptions) {
  const clients = new Map<number, SseClient>();
  let nextClientId = 1;
  let watcher: FSWatcher | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const encoder = new TextEncoder();

  function broadcast(event: string, data: unknown) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const bytes = encoder.encode(payload);
    for (const client of clients.values()) {
      try {
        client.controller.enqueue(bytes);
      } catch {
        clients.delete(client.id);
      }
    }
  }

  function scheduleReload(reason: string) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      broadcast("reload", { reason, mtime: Date.now() });
    }, 80);
  }

  if (opts.watch) {
    const dir = dirname(opts.file);
    const targetBase = basename(opts.file);
    try {
      // Watch non-recursively in the file's directory to avoid scanning node_modules / .git
      watcher = watch(dir, (_event, filename) => {
        if (!filename) {
          scheduleReload("change");
          return;
        }
        const str = String(filename);
        // Only trigger reload for the target file or relevant markdown/image files
        if (str === targetBase || str.endsWith(".md") || /\.(png|jpe?g|gif|svg|webp)$/i.test(str)) {
          scheduleReload(str);
        }
      });
      watcher.on("error", () => {
        /* Ignore watcher errors (e.g. temporary file unlinks) */
      });
    } catch {
      // Fallback: watch the target file directly
      try {
        watcher = watch(opts.file, () => scheduleReload("file"));
        watcher.on("error", () => {
          /* Ignore watcher errors */
        });
      } catch (err) {
        console.warn("File watching unavailable:", err);
      }
    }
  }

  async function serveStatic(urlPath: string): Promise<Response | null> {
    // Normalize: strip query, map / → index.html
    let pathname = urlPath.split("?")[0] || "/";
    if (pathname === "/") pathname = "/index.html";

    // Only serve from web root
    const rel = pathname.replace(/^\/+/, "");
    if (rel.includes("..")) return new Response("Forbidden", { status: 403 });

    const candidates = [
      join(opts.webRoot, rel),
      // Vite may put assets under assets/
    ];

    for (const filePath of candidates) {
      if (existsSync(filePath) && statSync(filePath).isFile()) {
        const file = Bun.file(filePath);
        return new Response(file, {
          headers: {
            "Content-Type": mimeFor(filePath),
            "Cache-Control": pathname === "/index.html" ? "no-cache" : "public, max-age=3600",
          },
        });
      }
    }
    return null;
  }

  const server = Bun.serve({
    hostname: opts.host,
    port: opts.port,
    async fetch(req) {
      const url = new URL(req.url);
      const { pathname } = url;

      // --- API: content ---
      if (pathname === "/api/content") {
        if (!existsSync(opts.file)) {
          return Response.json(
            { error: "File not found", path: opts.file },
            { status: 404 },
          );
        }
        const markdown = await Bun.file(opts.file).text();
        const st = statSync(opts.file);
        return Response.json({
          path: opts.file,
          name: basename(opts.file),
          markdown,
          mtime: st.mtimeMs,
          theme: opts.theme,
          width: opts.width ?? "normal",
          toc: opts.toc ?? false,
          topbar: opts.topbar ?? true,
          zoom: opts.zoom ?? true,
        });
      }

      // --- API: SSE events ---
      if (pathname === "/api/events") {
        const id = nextClientId++;
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            clients.set(id, { id, controller });
            controller.enqueue(
              encoder.encode(
                `event: connected\ndata: ${JSON.stringify({ id })}\n\n`,
              ),
            );
            // heartbeat every 25s
            const hb = setInterval(() => {
              try {
                controller.enqueue(encoder.encode(`: ping\n\n`));
              } catch {
                clearInterval(hb);
              }
            }, 25_000);
            // store cleanup on cancel via cancel()
            (controller as unknown as { _hb?: ReturnType<typeof setInterval> })._hb = hb;
          },
          cancel() {
            const client = clients.get(id);
            if (client) {
              const hb = (client.controller as unknown as { _hb?: ReturnType<typeof setInterval> })._hb;
              if (hb) clearInterval(hb);
            }
            clients.delete(id);
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      // --- Media (relative images from markdown dir) ---
      if (pathname.startsWith("/media/")) {
        const rel = pathname.slice("/media/".length);
        const resolved = resolveMediaPath(rel, opts.file);
        if (!resolved || !existsSync(resolved) || !statSync(resolved).isFile()) {
          return new Response("Not found", { status: 404 });
        }
        return new Response(Bun.file(resolved), {
          headers: {
            "Content-Type": mimeFor(resolved),
            "Cache-Control": "public, max-age=60",
          },
        });
      }

      // --- Static SPA ---
      const staticRes = await serveStatic(pathname);
      if (staticRes) return staticRes;

      // SPA fallback for client routes
      const index = join(opts.webRoot, "index.html");
      if (existsSync(index)) {
        return new Response(Bun.file(index), {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      }

      return new Response(
        `<!doctype html><html><body style="font-family:system-ui;padding:2rem">
          <h1>md-dev</h1>
          <p>Web assets not built. Run <code>bun run build:web</code> first.</p>
          <p>Viewing: <code>${opts.file}</code></p>
        </body></html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 },
      );
    },
  });

  return {
    server,
    url: `http://${opts.host === "0.0.0.0" ? "127.0.0.1" : opts.host}:${server.port}`,
    stop() {
      if (watcher) watcher.close();
      if (debounceTimer) clearTimeout(debounceTimer);
      for (const c of clients.values()) {
        try {
          c.controller.close();
        } catch {
          /* ignore */
        }
      }
      clients.clear();
      server.stop(true);
    },
  };
}

export function findWebRoot(fromDir: string): string {
  // Prefer built assets; fall back for development
  const candidates = [
    join(fromDir, "dist", "web"),
    join(fromDir, "web", "dist"),
    resolve(fromDir, "dist/web"),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "index.html"))) return c;
  }
  // Return expected build output path even if missing (server will 503 with hint)
  return join(fromDir, "dist", "web");
}
