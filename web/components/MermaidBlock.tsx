import { useEffect, useId, useRef, useState } from "react";
import { ZoomIn } from "lucide-react";
import { MermaidModal } from "@/components/MermaidModal";

type Props = {
  chart: string;
  isDark: boolean;
};

let mermaidReady: Promise<typeof import("mermaid")> | null = null;

function loadMermaid() {
  if (!mermaidReady) {
    mermaidReady = import("mermaid");
  }
  return mermaidReady;
}

export function MermaidBlock({ chart, isDark }: Props) {
  const id = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { default: mermaid } = await loadMermaid();
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: isDark ? "dark" : "default",
          fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
        });
        const { svg: rendered } = await mermaid.render(
          `mermaid-${id}-${isDark ? "d" : "l"}`,
          chart.trim(),
        );
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setSvg("");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, isDark, id]);

  if (error) {
    return (
      <div className="mermaid-wrap border-destructive/40">
        <pre className="m-0 w-full whitespace-pre-wrap font-mono text-xs text-destructive">
          Mermaid error: {error}
          {"\n\n"}
          {chart}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div ref={containerRef} className="mermaid-wrap">
        <span className="text-sm text-muted-foreground">Rendering diagram…</span>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        role="button"
        tabIndex={0}
        aria-label="Mermaid diagram. Click to open diagram viewer with zoom and pan."
        title="Click to open diagram in zoomable dialog"
        onClick={(e) => {
          // Allow internal links in the diagram to work if present
          if ((e.target as HTMLElement).closest("a")) return;
          setIsModalOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
        className="mermaid-wrap group relative cursor-pointer transition-all hover:border-foreground/40 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div
          className="w-full flex justify-center"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-md border border-border/80 bg-background/85 px-2 py-1 text-xs text-muted-foreground shadow-xs backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none sm:inline-flex">
          <ZoomIn className="size-3.5" />
          <span>Click to zoom</span>
        </div>
      </div>

      <MermaidModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        svg={svg}
        chart={chart}
        id={id}
        isDark={isDark}
      />
    </>
  );
}
