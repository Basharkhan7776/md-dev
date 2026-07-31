import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { CodeBlock } from "@/components/CodeBlock";
import { MermaidBlock } from "@/components/MermaidBlock";

type Props = {
  markdown: string;
  isDark: boolean;
};

function isExternal(href: string) {
  return /^(https?:|mailto:|tel:)/i.test(href);
}

function rewriteImageSrc(src: string | undefined): string | undefined {
  if (!src) return src;
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("/media/") ||
    src.startsWith("blob:")
  ) {
    return src;
  }
  // Relative to markdown file → served under /media/
  const clean = src.replace(/^\.\//, "");
  return `/media/${clean}`;
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    const el = node as { props?: { children?: React.ReactNode } };
    return extractText(el.props?.children);
  }
  return "";
}

export function MarkdownView({ markdown, isDark }: Props) {
  const components: Components = {
    a({ href, children, ...props }) {
      const external = href ? isExternal(href) : false;
      return (
        <a
          href={href}
          {...props}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {children}
        </a>
      );
    },
    img({ src, alt, ...props }) {
      return <img src={rewriteImageSrc(src)} alt={alt ?? ""} {...props} />;
    },
    pre({ children }) {
      // react-markdown wraps code in pre; we handle in code when block
      return <>{children}</>;
    },
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const code = extractText(children).replace(/\n$/, "");
      const isBlock =
        Boolean(match) || (typeof children === "string" && children.includes("\n"));

      // Inline code
      if (!isBlock && !match) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      const lang = match?.[1] ?? "text";
      if (lang === "mermaid") {
        return <MermaidBlock chart={code} isDark={isDark} />;
      }
      return <CodeBlock code={code} language={lang} isDark={isDark} />;
    },
    table({ children }) {
      return (
        <div className="md-table-wrap">
          <table>{children}</table>
        </div>
      );
    },
    thead({ children }) {
      return <thead>{children}</thead>;
    },
    tbody({ children }) {
      return <tbody>{children}</tbody>;
    },
    tr({ children }) {
      return <tr>{children}</tr>;
    },
    th({ children }) {
      return <th scope="col">{children}</th>;
    },
    td({ children }) {
      return <td>{children}</td>;
    },
  };

  return (
    <article className="md-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: "append",
              properties: { className: ["heading-anchor"], ariaHidden: true, tabIndex: -1 },
              content: { type: "text", value: "#" },
            },
          ],
        ]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
