import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Outlet } from "react-router-dom";
import { Loader2, RotateCcw } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { fetchProfile } from "@/features/auth";
import { setUnauthorizedHandler } from "@/lib/api";
import { clearUserData, setUserData } from "@/store/userSlice";

/**
 * Root layout shell that bootstraps the user session and handles auth expiry.
 */
const MainLayout = () => {
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setUnauthorizedHandler(() => {
      dispatch(clearUserData());
    });
    return () => setUnauthorizedHandler(null);
  }, [dispatch]);

  const loadSession = useCallback(
    async (signal) => {
      try {
        const profile = await fetchProfile(signal);
        if (signal?.aborted) return;
        dispatch(setUserData(profile));
        setLoadError("");
      } catch (err) {
        if (signal?.aborted) return;
        setLoadError(
          err?.message || "Unable to connect to the server. Please try again.",
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [dispatch],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadSession(controller.signal);
    return () => controller.abort();
  }, [loadSession]);

  const handleRetry = () => {
    setIsLoading(true);
    setLoadError("");
    loadSession();
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-between transition-colors duration-200">
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <BrandMark size="md" className="animate-pulse" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            <span>Loading workspace...</span>
          </div>
        </div>
      ) : loadError ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-sm w-full rounded-2xl border border-border/80 bg-card p-6 text-center space-y-4 shadow-xs">
            <BrandMark size="md" className="mx-auto" />
            <div className="space-y-1">
              <h1 className="text-base font-semibold tracking-tight">
                Connection unavailable
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {loadError}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleRetry}
              className="gap-1.5 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Retry</span>
            </Button>
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </div>
  );
};

export default MainLayout;
