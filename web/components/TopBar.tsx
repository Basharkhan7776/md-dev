import { FileText, Moon, Monitor, Sun, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ThemeMode } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

type Props = {
  fileName: string;
  filePath: string;
  mode: ThemeMode;
  onCycleTheme: () => void;
  live: boolean;
  updatedAt: number | null;
};

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === "light") return <Sun className="size-4" />;
  if (mode === "dark") return <Moon className="size-4" />;
  return <Monitor className="size-4" />;
}

export function TopBar({
  fileName,
  filePath,
  mode,
  onCycleTheme,
  live,
  updatedAt,
}: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card">
            <FileText className="size-4 text-foreground" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium tracking-tight">
              {fileName || "md-dev"}
            </div>
            <div className="truncate font-mono text-[11px] text-muted-foreground">
              {filePath || "—"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {live && (
            <span
              className={cn(
                "hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground",
              )}
              title={
                updatedAt
                  ? `Last update ${new Date(updatedAt).toLocaleTimeString()}`
                  : "Live reload enabled"
              }
            >
              <RefreshCw className="size-3" />
              Live
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onCycleTheme}
            title={`Theme: ${mode} (click to cycle)`}
            aria-label={`Theme ${mode}`}
          >
            <ThemeIcon mode={mode} />
          </Button>
        </div>
      </div>
    </header>
  );
}
