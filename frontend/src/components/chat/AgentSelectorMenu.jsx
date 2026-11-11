import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  RotateCcw,
  Settings,
} from "lucide-react";

/**
 * Accessible agent selector popover with keyboard navigation and retry handling.
 */
export default function AgentSelectorMenu({
  agents,
  selectedAgent,
  isLoading,
  loadError,
  onRetryLoad,
  onSelectAgent,
  onCreateAgent,
  onManageAgents,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (!menuRef.current) return;
      const items = Array.from(
        menuRef.current.querySelectorAll('[role="menuitem"]:not(:disabled)'),
      );
      if (items.length === 0) return;

      const currentIndex = items.indexOf(document.activeElement);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex]?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        items[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        items[items.length - 1]?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleChoose = (agent) => {
    setIsOpen(false);
    onSelectAgent(agent);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="h-8 px-2.5 rounded-lg border border-border/70 bg-secondary/40 hover:bg-secondary/80 text-xs font-medium text-foreground inline-flex items-center gap-2 transition-colors cursor-pointer max-w-[210px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bot className="size-3.5 text-muted-foreground shrink-0" />
        <span className="truncate">
          {selectedAgent ? selectedAgent.name : "Select agent"}
        </span>
        <ChevronDown
          className={`size-3.5 text-muted-foreground shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div
          ref={menuRef}
          role="menu"
          className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-1.5 z-50"
        >
          {isLoading ? (
            <div className="px-2.5 py-2 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Loading agents...</span>
            </div>
          ) : loadError ? (
            <div className="px-2.5 py-2 text-xs space-y-2">
              <p className="text-red-400 leading-relaxed">{loadError}</p>
              <button
                type="button"
                role="menuitem"
                onClick={onRetryLoad}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:underline cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <RotateCcw className="size-3" />
                <span>Retry loading agents</span>
              </button>
            </div>
          ) : agents.length === 0 ? (
            <div className="px-2.5 py-2 text-xs text-muted-foreground">
              No agents yet — create one below.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {selectedAgent ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleChoose(null)}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs text-left text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors cursor-pointer outline-none focus-visible:bg-accent/60 focus-visible:text-foreground"
                >
                  <span>General chat (no agent)</span>
                </button>
              ) : null}

              {agents.map((agent) => {
                const isSelected = selectedAgent?._id === agent._id;
                return (
                  <button
                    key={agent._id}
                    type="button"
                    role="menuitem"
                    onClick={() => handleChoose(agent)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer outline-none focus-visible:bg-accent/60 ${
                      isSelected
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-foreground hover:bg-accent/60"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Bot className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{agent.name}</span>
                    </span>
                    {isSelected ? (
                      <Check className="size-3.5 text-foreground shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          <div className="my-1 h-px bg-border/60" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onCreateAgent();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-foreground hover:bg-accent/60 transition-colors cursor-pointer outline-none focus-visible:bg-accent/60"
          >
            <Plus className="size-3.5 text-muted-foreground shrink-0" />
            <span>Create new agent</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onManageAgents();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-foreground hover:bg-accent/60 transition-colors cursor-pointer outline-none focus-visible:bg-accent/60"
          >
            <Settings className="size-3.5 text-muted-foreground shrink-0" />
            <span>Manage agents</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
