import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ErrorAlert from "@/components/ErrorAlert";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createAgent } from "@/features/agent";
import { AGENT_TOOLS } from "@/lib/agentTools";

export default function CreateAgent() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [tools, setTools] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleToggleTool = (toolId) => {
    setTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage("");
    const nextErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Please enter an agent name.";
    }
    if (!instructions.trim()) {
      nextErrors.instructions = "Please enter instructions for the agent.";
    }
    if (!knowledgeBase.trim()) {
      nextErrors.knowledgeBase = "Please provide a knowledge base.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      const response = await createAgent({
        name: name.trim(),
        instructions: instructions.trim(),
        knowledgeBase: knowledgeBase.trim(),
        tools,
      });

      const createdAgent = response?.agent || response;
      navigate(
        createdAgent?._id
          ? `/home?agent=${encodeURIComponent(createdAgent._id)}`
          : "/home",
      );
    } catch (err) {
      setErrorMessage(
        err?.message || "Failed to create agent. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header breadcrumbCurrent="Create Agent" />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link
            to="/agents"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3 rounded px-1 py-0.5 -ml-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to agents</span>
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Create Agent
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure a new agent with instructions, knowledge, and tools.
          </p>
        </div>

        <ErrorAlert
          message={errorMessage}
          onDismiss={() => setErrorMessage("")}
          className="mb-6"
        />

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="agent-name" className="text-xs font-medium">
                Name <span className="text-destructive">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {name.trim().length} chars
              </span>
            </div>
            <Input
              id="agent-name"
              type="text"
              placeholder="e.g. Customer Support Agent"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError("name");
              }}
              aria-invalid={Boolean(fieldErrors.name)}
              disabled={isLoading}
              className="h-9 text-sm"
              autoFocus
            />
            {fieldErrors.name ? (
              <p className="text-[11px] text-red-400">{fieldErrors.name}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="agent-instructions"
                className="text-xs font-medium"
              >
                Instructions <span className="text-destructive">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Role &amp; behavior rules ({instructions.trim().length} chars)
              </span>
            </div>
            <Textarea
              id="agent-instructions"
              placeholder="Define how the agent should behave, answer questions, and handle requests..."
              value={instructions}
              onChange={(e) => {
                setInstructions(e.target.value);
                clearFieldError("instructions");
              }}
              aria-invalid={Boolean(fieldErrors.instructions)}
              disabled={isLoading}
              rows={5}
              className="text-sm resize-y"
            />
            {fieldErrors.instructions ? (
              <p className="text-[11px] text-red-400">
                {fieldErrors.instructions}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="agent-knowledge" className="text-xs font-medium">
                Knowledge Base <span className="text-destructive">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Reference context ({knowledgeBase.trim().length} chars)
              </span>
            </div>
            <Textarea
              id="agent-knowledge"
              placeholder="Add product information, FAQs, company policies, or reference docs..."
              value={knowledgeBase}
              onChange={(e) => {
                setKnowledgeBase(e.target.value);
                clearFieldError("knowledgeBase");
              }}
              aria-invalid={Boolean(fieldErrors.knowledgeBase)}
              disabled={isLoading}
              rows={5}
              className="text-sm resize-y"
            />
            {fieldErrors.knowledgeBase ? (
              <p className="text-[11px] text-red-400">
                {fieldErrors.knowledgeBase}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Tools</Label>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {tools.length} selected
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-1">
              Select any capabilities this agent can use.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {AGENT_TOOLS.map((tool) => {
                const checked = tools.includes(tool.id);
                const checkboxId = `tool-${tool.id}`;
                return (
                  <label
                    key={tool.id}
                    htmlFor={checkboxId}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs select-none transition-colors ${
                      !tool.available
                        ? "border-border/40 bg-muted/10 text-muted-foreground/50 cursor-not-allowed opacity-60"
                        : checked
                          ? "border-primary/50 bg-primary/5 text-foreground cursor-pointer"
                          : "border-border/70 hover:bg-muted/40 text-muted-foreground hover:text-foreground cursor-pointer"
                    }`}
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={checked}
                      onCheckedChange={() => handleToggleTool(tool.id)}
                      disabled={isLoading || !tool.available}
                    />
                    <span className="font-medium flex-1">{tool.label}</span>
                    {!tool.available && (
                      <span className="text-[10px] font-normal text-muted-foreground/60 ml-auto">
                        Coming soon
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/agents")}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isLoading}
              className="cursor-pointer gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Agent</span>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
