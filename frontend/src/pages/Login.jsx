import { useEffect, useRef, useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import BrandMark from "@/components/BrandMark";
import ErrorAlert from "@/components/ErrorAlert";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { login } from "@/features/auth";
import { auth, googleProvider } from "@/firebase";
import { setUserData } from "@/store/userSlice";

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
      return err?.message || "Failed to sign in with Google. Please try again.";
  }
};

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleGoogleSignIn = async () => {
    if (isLoading) return;

    setErrorMessage("");
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseToken = await result.user.getIdToken();
      const userData = await login(firebaseToken);

      if (!userData) {
        throw new Error(
          "Sign-in could not be verified by the server. Please try again.",
        );
      }

      if (!isMountedRef.current) return;
      dispatch(setUserData(userData));
      navigate("/home", { replace: true });
    } catch (err) {
      if (!isMountedRef.current) return;
      const friendly = parseAuthError(err);
      if (friendly) setErrorMessage(friendly);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-between transition-colors duration-200">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-[380px] border-border/80 bg-card shadow-sm">
          <CardHeader className="text-center pb-4 pt-6 px-6 sm:px-8 space-y-1.5">
            <BrandMark size="lg" className="mx-auto mb-3" />
            <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
              Welcome to AI Automation
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Sign in with your Google account to access your workspace and
              agents.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-6 pt-2 space-y-4">
            <ErrorAlert
              message={errorMessage}
              onDismiss={() => setErrorMessage("")}
            />

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

          <CardFooter className="px-6 sm:px-8 pb-6 pt-4 flex flex-col gap-3 text-center border-t border-border/50">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This is a personal project. Hope you enjoy using it!
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
