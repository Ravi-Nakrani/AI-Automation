import { useEffect, useRef, useState } from "react";
import { Bot, Check, Copy } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import ChatMessageContent from "@/components/chat/ChatMessageContent";

/**
 * Renders a single user or assistant message bubble in the chat thread.
 */
export default function ChatMessage({ message, selectedAgent }) {
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
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API may be unavailable in insecure contexts
    }
  };

  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end gap-1">
        <div
          className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words border ${
            message.failed
              ? "bg-destructive/10 border-destructive/30 text-foreground"
              : "bg-secondary/80 border-border/60 text-foreground"
          }`}
        >
          {message.content}
        </div>
        {message.failed ? (
          <span className="text-[11px] text-red-400 pr-1">
            Not delivered
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-3.5">
      {selectedAgent ? (
        <div
          title={selectedAgent.name}
          className="size-7 rounded-md bg-secondary border border-border/80 text-foreground flex items-center justify-center shrink-0 mt-0.5 shadow-xs"
        >
          <Bot className="size-4" />
        </div>
      ) : (
        <BrandMark size="sm" className="mt-0.5" />
      )}

      <div className="flex-1 min-w-0 pt-0.5 space-y-1.5">
        <ChatMessageContent content={message.content} />

        <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy response"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted/60 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      </div>
    </div>
  );
}
