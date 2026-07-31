import { useEffect, useId, useRef, useState } from "react";

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
    <div
      ref={containerRef}
      className="mermaid-wrap"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
