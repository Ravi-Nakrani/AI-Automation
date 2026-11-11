import { Fragment, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

const INLINE_TOKEN_RE =
  /(`[^`\n]+`)|(\[[^\]]+\]\(https?:\/\/[^\s)]+\))|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)/g;

/**
 * Renders inline markdown tokens (code, links, bold, italic) safely without raw HTML.
 */
function renderInline(text) {
  const nodes = [];
  let lastIndex = 0;
  let keyIndex = 0;

  for (const match of text.matchAll(INLINE_TOKEN_RE)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      nodes.push(text.slice(lastIndex, matchIndex));
    }

    const token = match[0];
    if (match[1]) {
      nodes.push(
        <code
          key={`code-${keyIndex++}`}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground/95 border border-border/50"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (match[2]) {
      const splitIdx = token.indexOf("](");
      const label = token.slice(1, splitIdx);
      const url = token.slice(splitIdx + 2, -1);
      nodes.push(
        <a
          key={`link-${keyIndex++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-4 hover:opacity-80 break-all"
        >
          {label}
        </a>,
      );
    } else if (match[3]) {
      nodes.push(
        <strong key={`bold-${keyIndex++}`} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (match[4]) {
      nodes.push(
        <em key={`em-${keyIndex++}`} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    }

    lastIndex = matchIndex + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : text;
}

function splitSegments(content) {
  const lines = String(content ?? "").split(/\r?\n/);
  const segments = [];
  let textBuffer = [];
  let codeBuffer = [];
  let codeLanguage = "";
  let inCodeBlock = false;

  const flushText = () => {
    if (textBuffer.length > 0) {
      segments.push({ type: "text", content: textBuffer.join("\n") });
      textBuffer = [];
    }
  };

  const flushCode = () => {
    segments.push({
      type: "code",
      language: codeLanguage,
      content: codeBuffer.join("\n"),
    });
    codeBuffer = [];
    codeLanguage = "";
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!inCodeBlock && trimmed.startsWith("```")) {
      flushText();
      inCodeBlock = true;
      codeLanguage = trimmed.slice(3).trim();
    } else if (inCodeBlock && trimmed === "```") {
      flushCode();
      inCodeBlock = false;
    } else if (inCodeBlock) {
      codeBuffer.push(line);
    } else {
      textBuffer.push(line);
    }
  }

  if (inCodeBlock) {
    flushCode();
  } else {
    flushText();
  }

  return segments;
}

function parseTextBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      index += 1;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join("\n") });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paragraphLines = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s+/.test(lines[index].trim()) &&
      !/^>\s?/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim())
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join("\n") });
  }

  return blocks;
}

function CodeBlock({ language, content }) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API may be unavailable in insecure contexts
    }
  };

  return (
    <div className="my-2.5 overflow-hidden rounded-xl border border-border/80 bg-zinc-950/90">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/60 bg-muted/30">
        <span className="text-[11px] font-mono text-muted-foreground">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs leading-relaxed font-mono text-zinc-100">
        <code>{content}</code>
      </pre>
    </div>
  );
}

/**
 * Renders assistant responses with lightweight, XSS-safe markdown and code blocks.
 */
export default function ChatMessageContent({ content }) {
  const segments = splitSegments(content);

  return (
    <div className="space-y-2.5 text-sm text-foreground leading-relaxed break-words">
      {segments.map((segment, segIdx) => {
        if (segment.type === "code") {
          return (
            <CodeBlock
              key={`seg-${segIdx}`}
              language={segment.language}
              content={segment.content}
            />
          );
        }

        const blocks = parseTextBlocks(segment.content);
        return (
          <Fragment key={`seg-${segIdx}`}>
            {blocks.map((block, blockIdx) => {
              const key = `blk-${segIdx}-${blockIdx}`;
              if (block.type === "heading") {
                const sizeClass =
                  block.level === 1
                    ? "text-base font-semibold"
                    : block.level === 2
                      ? "text-sm font-semibold"
                      : "text-sm font-medium";
                return (
                  <p key={key} className={`${sizeClass} tracking-tight text-foreground pt-1`}>
                    {renderInline(block.text)}
                  </p>
                );
              }
              if (block.type === "blockquote") {
                return (
                  <blockquote
                    key={key}
                    className="border-l-2 border-border pl-3 text-muted-foreground italic whitespace-pre-line"
                  >
                    {renderInline(block.text)}
                  </blockquote>
                );
              }
              if (block.type === "ul") {
                return (
                  <ul key={key} className="list-disc pl-5 space-y-1">
                    {block.items.map((item, i) => (
                      <li key={`${key}-li-${i}`}>{renderInline(item)}</li>
                    ))}
                  </ul>
                );
              }
              if (block.type === "ol") {
                return (
                  <ol key={key} className="list-decimal pl-5 space-y-1">
                    {block.items.map((item, i) => (
                      <li key={`${key}-li-${i}`}>{renderInline(item)}</li>
                    ))}
                  </ol>
                );
              }
              return (
                <p key={key} className="whitespace-pre-line">
                  {renderInline(block.text)}
                </p>
              );
            })}
          </Fragment>
        );
      })}
    </div>
  );
}
