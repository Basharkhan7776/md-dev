import { useCallback, useEffect, useState } from "react";
import { MarkdownView } from "@/components/MarkdownView";
import { TopBar } from "@/components/TopBar";
import { TableOfContents } from "@/components/TableOfContents";
import { useSSE } from "@/hooks/useSSE";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

type ContentResponse = {
  path: string;
  name: string;
  markdown: string;
  mtime: number;
  theme: ThemeMode;
  width?: "normal" | "wide" | "full";
  toc?: boolean;
  topbar?: boolean;
  zoom?: boolean;
  error?: string;
};

export function App() {
  const [data, setData] = useState<ContentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cliTheme, setCliTheme] = useState<ThemeMode>("system");

  const { isDark } = useTheme(cliTheme);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/content");
      const json = (await res.json()) as ContentResponse & { error?: string };
      if (!res.ok) {
        setError(json.error || `Failed to load (${res.status})`);
        setData(null);
      } else {
        setData(json);
        setError(null);
        document.title = json.name || "md-dev";
        if (json.theme) setCliTheme(json.theme);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useSSE(() => {
    void load();
  }, true);

  const cycleTheme = useCallback(() => {
    setCliTheme((prev) => {
      if (prev === "system") return "light";
      if (prev === "light") return "dark";
      return "system";
    });
  }, []);

  const widthClass =
    data?.width === "full"
      ? "max-w-7xl"
      : data?.width === "wide"
      ? "max-w-5xl"
      : "max-w-3xl";

  const showTopBar = data?.topbar !== false;
  const showToc = Boolean(data?.toc);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {showTopBar && data && (
        <TopBar
          fileName={data.name}
          filePath={data.path}
          mode={cliTheme}
          onCycleTheme={cycleTheme}
          live={true}
          updatedAt={data.mtime}
        />
      )}

      <div
        className={cn(
          "mx-auto w-full px-5 py-8 sm:px-6 sm:py-12 flex justify-center gap-10 flex-1",
          widthClass,
        )}
      >
        <main className="min-w-0 flex-1">
          {loading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-8 w-2/3 rounded-md bg-muted" />
              <div className="h-4 w-full rounded-md bg-muted" />
              <div className="h-4 w-5/6 rounded-md bg-muted" />
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
              <h1 className="mb-2 text-lg font-semibold">Could not load file</h1>
              <p className="font-mono text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          {data && !loading && (
            <MarkdownView
              markdown={data.markdown}
              isDark={isDark}
              allowZoom={data.zoom !== false}
            />
          )}
        </main>

        {showToc && data && !loading && (
          <TableOfContents markdown={data.markdown} />
        )}
      </div>
    </div>
  );
}
