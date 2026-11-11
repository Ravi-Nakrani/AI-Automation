import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Bot, Loader2, Square } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BrandMark from "@/components/BrandMark";
import ErrorAlert from "@/components/ErrorAlert";
import AgentSelectorMenu from "@/components/chat/AgentSelectorMenu";
import ChatMessage from "@/components/chat/ChatMessage";
import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { getAllAgents } from "@/features/agent";
import { sendChatMessage } from "@/features/chat";
import { getAgentToolLabel } from "@/lib/agentTools";

const STARTER_PROMPTS = [
  "Summarize my workflow goals into actionable steps",
  "Draft a structured checklist for an API integration",
  "Help me write clear agent instructions for customer support",
];

function extractReplyContent(data) {
  if (typeof data === "string") return data;
  return (
    data?.reply || data?.message || data?.content || data?.response || ""
  );
}

function ChatSession({
  agents,
  selectedAgent,
  isLoadingAgents,
  agentsError,
  onRetryAgents,
  onSelectAgent,
  input,
  setInput,
  autoFocusComposer,
}) {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [failedMessageId, setFailedMessageId] = useState(null);

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const pendingUserIdRef = useRef(null);
  const nextMessageIdRef = useRef(1);

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
    if (autoFocusComposer) {
      textareaRef.current?.focus();
    }
  }, [adjustTextareaHeight, autoFocusComposer]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const cancelPendingRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const abortedUserId = pendingUserIdRef.current;
    pendingUserIdRef.current = null;

    if (abortedUserId) {
      setMessages((prev) =>
        prev.map((m) => (m.id === abortedUserId ? { ...m, failed: true } : m)),
      );
      setFailedMessageId(abortedUserId);
      setErrorMessage("Generation stopped.");
    }
    setIsGenerating(false);
  };

  const handleNewChat = () => {
    cancelPendingRequest();
    setMessages([]);
    setInput("");
    setErrorMessage("");
    setFailedMessageId(null);
    resetTextareaHeight();
    textareaRef.current?.focus();
  };

  const executeChatRequest = async (promptText, userMsgId, history) => {
    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    pendingUserIdRef.current = userMsgId;

    try {
      const data = await sendChatMessage(
        {
          message: promptText,
          agentId: selectedAgent?._id || null,
          messages: [...history, { role: "user", content: promptText }],
        },
        controller.signal,
      );

      if (controller.signal.aborted) return;

      const replyContent = extractReplyContent(data);
      if (!replyContent) {
        setMessages((prev) =>
          prev.map((m) => (m.id === userMsgId ? { ...m, failed: true } : m)),
        );
        setFailedMessageId(userMsgId);
        setErrorMessage("Received an empty response from the server.");
        return;
      }

      const replyMessage = {
        id: `assistant-${nextMessageIdRef.current++}`,
        role: "assistant",
        content: replyContent,
      };
      setMessages((prev) => [...prev, replyMessage]);
      setFailedMessageId(null);
    } catch (err) {
      if (controller.signal.aborted) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsgId ? { ...m, failed: true } : m)),
      );
      setFailedMessageId(userMsgId);
      setErrorMessage(
        err?.message || "Failed to get a response from the server.",
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        pendingUserIdRef.current = null;
        setIsGenerating(false);
      }
    }
  };

  const handleSend = async (e, overrideText = null) => {
    if (e) e.preventDefault();
    const rawText = typeof overrideText === "string" ? overrideText : input;
    const trimmed = rawText.trim();
    if (!trimmed || isGenerating) return;

    setErrorMessage("");
    setFailedMessageId(null);

    const userMsgId = `user-${nextMessageIdRef.current++}`;
    const userMessage = {
      id: userMsgId,
      role: "user",
      content: trimmed,
    };

    const cleanHistory = messages
      .filter((m) => !m.failed)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, userMessage]);
    if (typeof overrideText !== "string") {
      setInput("");
      resetTextareaHeight();
    }

    await executeChatRequest(trimmed, userMsgId, cleanHistory);
  };

  const handleRetryFailed = async () => {
    if (!failedMessageId || isGenerating) return;

    const targetIndex = messages.findIndex((m) => m.id === failedMessageId);
    if (targetIndex === -1) return;

    const targetMessage = messages[targetIndex];
    const cleanHistory = messages
      .slice(0, targetIndex)
      .filter((m) => !m.failed)
      .map(({ role, content }) => ({ role, content }));

    setErrorMessage("");
    setFailedMessageId(null);
    setMessages((prev) =>
      prev.map((m) => (m.id === failedMessageId ? { ...m, failed: false } : m)),
    );

    await executeChatRequest(targetMessage.content, targetMessage.id, cleanHistory);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedTools = Array.isArray(selectedAgent?.tools)
    ? selectedAgent.tools
    : [];

  return (
    <main className="flex-1 min-h-0 flex flex-col max-w-3xl w-full mx-auto px-4 sm:px-6">
      <div className="flex-1 overflow-y-auto py-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="space-y-4 max-w-lg w-full">
              {selectedAgent ? (
                <div className="mx-auto size-11 rounded-xl bg-secondary border border-border/80 text-foreground flex items-center justify-center shadow-xs">
                  <Bot className="size-5.5" />
                </div>
              ) : (
                <BrandMark size="md" className="mx-auto" />
              )}

              <div className="space-y-1.5">
                <h1 className="text-lg font-medium tracking-tight text-foreground">
                  {selectedAgent
                    ? selectedAgent.name
                    : "How can I assist you?"}
                </h1>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 max-w-md mx-auto">
                  {selectedAgent
                    ? selectedAgent.instructions ||
                      "How can I assist you today?"
                    : "Start a conversation or select an agent below."}
                </p>
              </div>

              {selectedTools.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {selectedTools.map((toolId) => (
                    <Badge
                      key={toolId}
                      variant="secondary"
                      className="text-[11px] font-normal"
                    >
                      {getAgentToolLabel(toolId)}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {!selectedAgent ? (
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(null, prompt)}
                      className="text-left text-xs px-3 py-1.5 rounded-full border border-border/70 bg-card/50 hover:bg-card hover:border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                selectedAgent={selectedAgent}
              />
            ))}

            {isGenerating ? (
              <div className="flex items-start gap-3.5">
                {selectedAgent ? (
                  <div className="size-7 rounded-md bg-secondary border border-border/80 text-foreground flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="size-4" />
                  </div>
                ) : (
                  <BrandMark size="sm" className="mt-0.5" />
                )}
                <div className="pt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 pb-4 pt-2">
        <ErrorAlert
          message={errorMessage}
          onRetry={failedMessageId ? handleRetryFailed : undefined}
          onDismiss={() => setErrorMessage("")}
          className="mb-2.5"
        />

        <form
          onSubmit={handleSend}
          className="rounded-2xl border border-border/80 bg-card/80 focus-within:border-ring/50 focus-within:bg-card transition-colors p-3 shadow-xs"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedAgent
                ? `Message ${selectedAgent.name}...`
                : "Ask anything..."
            }
            aria-label="Chat message"
            className="w-full bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground/70 min-h-[38px] max-h-40 px-1 leading-relaxed"
          />

          <div className="flex items-center justify-between gap-2 pt-2.5 mt-1">
            <AgentSelectorMenu
              agents={agents}
              selectedAgent={selectedAgent}
              isLoading={isLoadingAgents}
              loadError={agentsError}
              onRetryLoad={onRetryAgents}
              onSelectAgent={onSelectAgent}
              onCreateAgent={() => navigate("/create-agent")}
              onManageAgents={() => navigate("/agents")}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNewChat}
                disabled={messages.length === 0 && !input.trim() && !isGenerating}
                className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                New chat
              </button>

              {isGenerating ? (
                <button
                  type="button"
                  onClick={cancelPendingRequest}
                  aria-label="Stop generating"
                  title="Stop generating"
                  className="size-8 rounded-full flex items-center justify-center transition-all shrink-0 bg-secondary text-foreground hover:bg-secondary/80 border border-border cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Square className="size-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Send message"
                  className={`size-8 rounded-full flex items-center justify-center transition-all shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    input.trim()
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                      : "bg-muted text-muted-foreground/60 cursor-not-allowed"
                  }`}
                >
                  <ArrowUp className="size-4" />
                </button>
              )}
            </div>
          </div>
        </form>

        <p className="text-center text-[11px] text-muted-foreground/60 mt-2.5">
          AI Automation can make mistakes. Verify important information.
        </p>
      </div>
    </main>
  );
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedAgentId = searchParams.get("agent") || null;

  const [agents, setAgents] = useState([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [agentsError, setAgentsError] = useState("");
  const [input, setInput] = useState("");
  const [agentSwitchCount, setAgentSwitchCount] = useState(0);

  const selectedAgentIdRef = useRef(selectedAgentId);

  useEffect(() => {
    selectedAgentIdRef.current = selectedAgentId;
  }, [selectedAgentId]);

  const selectedAgent = useMemo(
    () => agents.find((a) => a._id === selectedAgentId) || null,
    [agents, selectedAgentId],
  );

  const loadAgents = useCallback(
    async (signal) => {
      try {
        const list = await getAllAgents(signal);
        if (signal?.aborted) return;
        setAgents(list);
        setAgentsError("");

        const activeId = selectedAgentIdRef.current;
        if (activeId && !list.some((a) => a._id === activeId)) {
          setSearchParams({}, { replace: true });
        }
      } catch (err) {
        if (signal?.aborted) return;
        setAgentsError(err?.message || "Could not load agents.");
      } finally {
        if (!signal?.aborted) {
          setIsLoadingAgents(false);
        }
      }
    },
    [setSearchParams],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadAgents(controller.signal);
    return () => controller.abort();
  }, [loadAgents]);

  const handleSelectAgent = (agent) => {
    const nextId = agent?._id ?? null;
    if (nextId !== selectedAgentId) {
      setAgentSwitchCount((c) => c + 1);
      if (nextId) {
        setSearchParams({ agent: nextId }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }
  };

  const handleRetryAgents = () => {
    setIsLoadingAgents(true);
    setAgentsError("");
    loadAgents();
  };

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col overflow-hidden">
      <Header borderless />

      <ChatSession
        key={selectedAgentId || "general"}
        agents={agents}
        selectedAgent={selectedAgent}
        isLoadingAgents={isLoadingAgents}
        agentsError={agentsError}
        onRetryAgents={handleRetryAgents}
        onSelectAgent={handleSelectAgent}
        input={input}
        setInput={setInput}
        autoFocusComposer={agentSwitchCount > 0}
      />
    </div>
  );
}
