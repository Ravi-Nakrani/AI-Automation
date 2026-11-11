import { ArrowLeft } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import BrandMark from "@/components/BrandMark";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";

/**
 * Fallback 404 screen for unknown routes.
 */
export default function NotFound() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user?.user);
  const destination = user ? "/home" : "/login";

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <Header borderless />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full text-center space-y-4">
          <BrandMark size="md" className="mx-auto" />
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              404
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              Page not found
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(destination, { replace: true })}
            className="gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>{user ? "Back to chat" : "Go to sign in"}</span>
          </Button>
        </div>
      </main>
    </div>
  );
}
