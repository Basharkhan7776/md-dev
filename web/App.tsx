import { useCallback, useEffect, useState } from "react";
import { MarkdownView } from "@/components/MarkdownView";
import { useSSE } from "@/hooks/useSSE";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";

type ContentResponse = {
  path: string;
  name: string;
  markdown: string;
  mtime: number;
  theme: ThemeMode;
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
        document.title = json.name || "mdparse";
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
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
          <MarkdownView markdown={data.markdown} isDark={isDark} />
        )}
      </main>
    </div>
  );
}
