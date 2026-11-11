import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Eye,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import ErrorAlert from "@/components/ErrorAlert";
import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteAgent, getAllAgents } from "@/features/agent";
import { getAgentToolLabel } from "@/lib/agentTools";
import { useDispatch, useSelector } from "react-redux";
import { setAgents } from "@/store/agentSlice";

function AgentCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-5 flex flex-col justify-between min-h-[208px]">
      <div className="flex items-start justify-between">
        <Skeleton className="size-10 rounded-xl" />
        <Skeleton className="size-7 rounded-lg" />
      </div>

      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>

      <div className="mt-5 pt-3.5 border-t border-border/40 flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3.5 w-20" />
      </div>
    </div>
  );
}

function AgentDetailsModal({ agent, onClose, onUseAgent }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!agent) return;
    const previouslyFocused = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [agent, onClose]);

  if (!agent) return null;

  const tools = Array.isArray(agent.tools) ? agent.tools : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-detail-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card text-card-foreground shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex items-start justify-between gap-4 border-b border-border/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center shadow-xs shrink-0">
              <Bot className="size-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="agent-detail-title"
                className="text-base font-semibold tracking-tight truncate"
              >
                {agent.name}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {tools.length}{" "}
                {tools.length === 1 ? "tool configured" : "tools configured"}
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close agent details"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Instructions
            </h3>
            <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap rounded-lg border border-border/60 bg-background/50 p-3">
              {agent.instructions || "No instructions provided."}
            </p>
          </div>

          {agent.knowledgeBase ? (
            <div className="space-y-1.5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Knowledge Base
              </h3>
              <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap rounded-lg border border-border/60 bg-background/50 p-3">
                {agent.knowledgeBase}
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Tools
            </h3>
            {tools.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tools.map((toolId) => (
                  <Badge key={toolId} variant="secondary">
                    {getAgentToolLabel(toolId)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No tools attached to this agent.
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div className="p-4 flex items-center justify-end gap-2 bg-card/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="cursor-pointer"
          >
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onUseAgent(agent)}
            className="gap-1.5 cursor-pointer"
          >
            <span>Use agent</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Agents() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const agents = useSelector((state) => state.agent.agents);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [inspectedAgent, setInspectedAgent] = useState(null);

  const loadAgents = useCallback(async (signal) => {
    try {
      const data = await getAllAgents(signal);
      if (signal?.aborted) return;
      dispatch(setAgents(data));
      setErrorMessage("");
    } catch (err) {
      if (signal?.aborted) return;
      setErrorMessage(
        err?.message || "Failed to load your agents. Please try again.",
      );
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadAgents(controller.signal);
    return () => controller.abort();
  }, [loadAgents]);

  useEffect(() => {
    if (!confirmDeleteId) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setConfirmDeleteId(null);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [confirmDeleteId]);

  const handleRetryLoad = () => {
    setIsLoading(true);
    setErrorMessage("");
    loadAgents();
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setConfirmDeleteId(null);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const trimmedQuery = searchQuery.trim();
  const filteredAgents = useMemo(() => {
    if (!trimmedQuery) return agents;
    const query = trimmedQuery.toLowerCase();

    return agents.filter((agent) => {
      const nameMatch = agent.name?.toLowerCase().includes(query);
      const instructionsMatch = agent.instructions
        ?.toLowerCase()
        .includes(query);
      const toolMatch = Array.isArray(agent.tools)
        ? agent.tools.some((toolId) =>
            getAgentToolLabel(toolId).toLowerCase().includes(query),
          )
        : false;
      return nameMatch || instructionsMatch || toolMatch;
    });
  }, [agents, trimmedQuery]);

  const handleCloseDetails = useCallback(() => {
    setInspectedAgent(null);
  }, []);

  const handleUseAgent = (agent) => {
    navigate(`/home?agent=${encodeURIComponent(agent._id)}`);
  };

  const handleDelete = async (agentId) => {
    if (deletingId) return;
    setDeletingId(agentId);
    setErrorMessage("");

    try {
      await deleteAgent(agentId);
      dispatch(setAgents(agents.filter((a) => a._id !== agentId)));
      if (inspectedAgent?._id === agentId) {
        setInspectedAgent(null);
      }
      setConfirmDeleteId(null);
    } catch (err) {
      setErrorMessage(
        err?.message || "Failed to delete agent. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <Header
        borderless
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate("/home")}
            className="h-8 text-xs gap-1.5 rounded-lg border-border/80 bg-card/50 hover:bg-muted/60 cursor-pointer sm:hidden"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to chat</span>
          </Button>
        }
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Bot className="size-3.5" />
              <span>Agent Workspace</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-1.5">
              My Agents
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Manage your AI agents and choose one to get started.
            </p>
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => navigate("/create-agent")}
            className="h-9 px-4 text-xs font-medium gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Create agent</span>
          </Button>
        </div>

        <ErrorAlert
          message={errorMessage}
          onRetry={agents.length === 0 ? handleRetryLoad : undefined}
          onDismiss={agents.length > 0 ? () => setErrorMessage("") : undefined}
          className="mt-6"
        />

        <div className="mt-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name, instructions, or tool..."
              aria-label="Search agents"
              className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-card/50 border-border/80 rounded-lg"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="text-xs text-muted-foreground tabular-nums">
            {isLoading ? (
              <Skeleton className="h-4 w-16 inline-block align-middle" />
            ) : (
              <span>
                {filteredAgents.length}{" "}
                {filteredAgents.length === 1 ? "Agent" : "Agents"}
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AgentCardSkeleton />
            <AgentCardSkeleton />
            <AgentCardSkeleton />
          </div>
        ) : agents.length === 0 && !errorMessage ? (
          <div className="mt-6 rounded-xl border border-dashed border-border/70 bg-card/20 py-14 px-4 text-center">
            <div className="mx-auto size-10 rounded-xl border border-border/80 bg-card text-muted-foreground flex items-center justify-center mb-3">
              <Bot className="size-5" />
            </div>
            <h2 className="text-sm font-medium text-foreground">
              No agents yet
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
              Create your first AI agent with custom instructions, knowledge,
              and tools.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/create-agent")}
              className="mt-4 h-8 text-xs gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Create agent</span>
            </Button>
          </div>
        ) : agents.length === 0 ? null : filteredAgents.length === 0 ? (
          <div className="mt-6 rounded-xl border border-border/60 bg-card/20 py-14 px-4 text-center">
            <h2 className="text-sm font-medium text-foreground">
              No matching agents
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              No agents match &ldquo;{trimmedQuery}&rdquo;.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSearch}
              className="mt-4 h-8 text-xs cursor-pointer"
            >
              Clear search
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => {
              const isConfirming = confirmDeleteId === agent._id;
              const isDeleting = deletingId === agent._id;
              const tools = Array.isArray(agent.tools) ? agent.tools : [];
              const visibleTools = tools.slice(0, 2);
              const extraToolCount = Math.max(0, tools.length - 2);

              return (
                <article
                  key={agent._id}
                  className="group rounded-xl border border-border/80 bg-card/60 hover:bg-card hover:border-border transition-all p-5 flex flex-col justify-between min-h-[208px]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="size-10 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center shadow-xs shrink-0">
                        <Bot className="size-5" />
                      </div>

                      <div className="flex items-center gap-1">
                        {isConfirming ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(agent._id)}
                              disabled={isDeleting}
                              className="px-2 py-1 rounded-md text-[11px] font-medium bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {isDeleting ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : null}
                              <span>Delete</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={isDeleting}
                              aria-label="Cancel delete"
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setInspectedAgent(agent)}
                              aria-label={`View details for ${agent.name}`}
                              className="p-1.5 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <Eye className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(agent._id)}
                              aria-label={`Delete ${agent.name}`}
                              className="p-1.5 rounded-lg text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <h2 className="text-sm font-semibold tracking-tight text-foreground truncate">
                        {agent.name}
                      </h2>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {agent.instructions}
                      </p>
                    </div>

                    {visibleTools.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {visibleTools.map((toolId) => (
                          <Badge
                            key={toolId}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 font-normal"
                          >
                            {getAgentToolLabel(toolId)}
                          </Badge>
                        ))}
                        {extraToolCount > 0 ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground"
                          >
                            +{extraToolCount}
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-border/50 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      {tools.length > 0
                        ? `${tools.length} ${tools.length === 1 ? "tool" : "tools"}`
                        : "No tools"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleUseAgent(agent)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer group/use rounded px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span>Use agent</span>
                      <ArrowRight className="size-3.5 transition-transform group-hover/use:translate-x-0.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <AgentDetailsModal
        agent={inspectedAgent}
        onClose={handleCloseDetails}
        onUseAgent={handleUseAgent}
      />
    </div>
  );
}
