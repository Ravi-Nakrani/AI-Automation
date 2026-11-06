import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { Loader2, AlertCircle, Workflow } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { setUserData } from "@/store/userSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const parseAuthError = (err) => {
    const code = err?.code || "";
    switch (code) {
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return null;
      case "auth/popup-blocked":
        return "Popup was blocked by your browser. Please allow popups for this site.";
      case "auth/network-request-failed":
        return "Network connection issue. Please check your internet connection.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email using a different provider.";
      default:
        return (
          err?.message || "Failed to sign in with Google. Please try again."
        );
    }
  };

  const syncWithBackend = async (firebaseUser) => {
    try {
      const firebaseToken = await firebaseUser.getIdToken();
      console.log("firebaseToken", firebaseToken);
      const response = await api.post("/auth/login", { firebaseToken });

      return response.data;
    } catch (err) {
      console.warn("Could not sync session with backend server:", err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;

    setErrorMessage("");
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const res = await syncWithBackend(result.user);
      dispatch(setUserData(res));
      navigate("/home", { replace: true });
    } catch (err) {
      const friendly = parseAuthError(err);
      if (friendly) setErrorMessage(friendly);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-between transition-colors duration-200">
      {/* Subtle Top Navigation */}
      <header className="w-full px-6 py-4 flex items-center">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-md bg-zinc-100 text-zinc-900 flex items-center justify-center shadow-xs">
            <Workflow className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            AI Automation
          </span>
        </div>
      </header>

      {/* Main Centered Authentication Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-[380px] border-border/80 bg-card shadow-xs">
          <CardHeader className="text-center pb-4 pt-6 px-6 sm:px-8 space-y-1.5">
            <div className="mx-auto size-11 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center shadow-xs mb-3">
              <Workflow className="size-5.5" />
            </div>
            <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
              Welcome to AI Automation
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Sign in with your Google account to access your workspace and
              pipelines.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-6 pt-2 space-y-4">
            {/* Error Notification */}
            {errorMessage ? (
              <div
                role="alert"
                className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-400 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-500" />
                <div className="flex-1 leading-relaxed">{errorMessage}</div>
                <button
                  type="button"
                  onClick={() => setErrorMessage("")}
                  className="text-red-600/70 hover:text-red-700 dark:hover:text-red-300 text-xs font-medium cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            ) : null}

            {/* Google Authentication Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-11 border-border/80 bg-background hover:bg-muted/50 font-medium text-sm justify-center gap-3 transition-colors shadow-xs cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Signing in with Google...</span>
                </span>
              ) : (
                <>
                  <FcGoogle className="size-5" />
                  <span>Continue with Google</span>
                </>
              )}
            </Button>
          </CardContent>

          <CardFooter className="px-6 sm:px-8 pb-6 pt-0 flex flex-col gap-3 text-center border-t border-border/50 pt-4">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This is a personal project. Hope you enjoy using it!
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
