import { Component } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Root-level error boundary preventing unrecoverable blank screens on runtime failures.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled application error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.assign("/home");
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-border/80 bg-card p-6 text-center shadow-sm space-y-4">
          <div className="mx-auto size-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold tracking-tight">
              Something went wrong
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {this.state.error?.message ||
                "An unexpected error occurred while rendering this page."}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={this.handleReload}
            className="gap-1.5 cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Reload workspace</span>
          </Button>
        </div>
      </div>
    );
  }
}
