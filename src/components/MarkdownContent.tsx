import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const plugins = [remarkGfm];

/**
 * Renders markdown content with GFM support (tables, strikethrough, task lists, etc.)
 * Styled to look native within the app's design system.
 * Memoized — skips re-parse when content string is unchanged.
 */
export default memo(function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={plugins}
      components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-lg font-semibold mt-4 mb-2 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold mt-4 mb-2 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mt-3 mb-1.5 first:mt-0">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-medium mt-3 mb-1 first:mt-0">
            {children}
          </h4>
        ),

        // Paragraphs
        p: ({ children }) => (
          <p className="text-sm leading-relaxed mb-2.5 last:mb-0">{children}</p>
        ),

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {children}
          </a>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-outside pl-5 mb-2.5 space-y-1 text-sm">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside pl-5 mb-2.5 space-y-1 text-sm">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,

        // Code
        code: ({ className, children }) => {
          const isBlock = className?.startsWith("language-");
          if (isBlock) {
            return (
              <code className="text-xs">{children}</code>
            );
          }
          return (
            <code className="rounded-md bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 text-xs font-mono text-foreground">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="rounded-xl glass-inset p-3.5 mb-2.5 overflow-x-auto text-xs font-mono leading-relaxed">
            {children}
          </pre>
        ),

        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary/30 pl-3 my-2.5 text-muted-foreground italic">
            {children}
          </blockquote>
        ),

        // Horizontal rule
        hr: () => <hr className="border-border my-4" />,

        // Table
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2.5">
            <table className="w-full text-xs border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted/50">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="border border-border px-2.5 py-1.5 text-left font-medium text-muted-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-2.5 py-1.5">{children}</td>
        ),

        // Images
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt ?? ""}
            className="max-w-full rounded-md my-2"
          />
        ),

        // Strong / emphasis
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
})
