import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { createHighlighter, type Highlighter } from "shiki/bundle/web";
import { vercelDark, vercelLight } from "@/lib/vercel-themes";

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [vercelDark, vercelLight],
      langs: [
        "typescript",
        "javascript",
        "tsx",
        "jsx",
        "json",
        "bash",
        "shellscript",
        "css",
        "html",
        "markdown",
        "python",
        "go",
        "rust",
        "java",
        "yaml",
        "toml",
        "sql",
        "diff",
        "xml",
        "vue",
        "svelte",
      ],
    });
  }
  return highlighterPromise;
}

const ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  sh: "shellscript",
  bash: "shellscript",
  shell: "shellscript",
  zsh: "shellscript",
  py: "python",
  md: "markdown",
  yml: "yaml",
  rs: "rust",
  plaintext: "text",
  txt: "text",
};

type Props = {
  code: string;
  language?: string;
  isDark: boolean;
};

export function CodeBlock({ code, language = "text", isDark }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const displayLang = language || "text";
  const lang = ALIASES[displayLang] ?? displayLang;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const hl = await getHighlighter();
        let useLang = lang;
        const loaded = hl.getLoadedLanguages();
        if (!loaded.includes(useLang as never)) {
          try {
            await hl.loadLanguage(useLang as never);
          } catch {
            useLang = "text";
          }
        }
        const out = hl.codeToHtml(code.replace(/\n$/, ""), {
          lang: useLang,
          theme: isDark ? "vercel-dark" : "vercel-light",
        });
        if (!cancelled) setHtml(out);
      } catch {
        if (!cancelled) setHtml(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, lang, isDark]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="shiki-wrap group">
      <div className="shiki-header">
        <span className="truncate">{displayLang}</span>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          onClick={copy}
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="size-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy
            </>
          )}
        </button>
      </div>
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
