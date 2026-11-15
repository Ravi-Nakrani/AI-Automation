import { useState } from "react";
import { Bot, ChevronRight, Loader2, LogOut, MessageSquare } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { signOut } from "firebase/auth";
import BrandMark from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { logout as apiLogout } from "@/features/auth";
import { auth } from "@/firebase";
import { clearUserData } from "@/store/userSlice";

const navLinkClass = ({ isActive }) =>
  `inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    isActive
      ? "bg-secondary text-foreground"
      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
  }`;

/**
 * Top application bar with brand link, route navigation/breadcrumbs, user profile, and logout.
 */
const Header = ({ breadcrumbCurrent, actions, borderless = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user?.user);
  const [failedImageUrl, setFailedImageUrl] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const showProfileImage =
    Boolean(user?.profilePicture) && failedImageUrl !== user.profilePicture;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // 1. Call backend to clear httpOnly cookie
      await apiLogout().catch((err) => {
        console.warn("Backend logout error:", err);
      });

      // 2. Clear Firebase client auth session
      await signOut(auth).catch((err) => {
        console.warn("Firebase signOut error:", err);
      });
    } finally {
      // 3. Clear Redux user state & navigate to login
      dispatch(clearUserData());
      setIsLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <header
      className={`w-full bg-background/95 backdrop-blur-xs sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 transition-colors ${
        borderless ? "" : "border-b border-border/70"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to={user ? "/home" : "/login"}
          className="flex items-center gap-2.5 group outline-none shrink-0 rounded-md focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandMark
            size="sm"
            className="transition-transform group-hover:scale-105"
          />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            AI Automation
          </span>
        </Link>

        {breadcrumbCurrent ? (
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0"
          >
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
            <Link
              to="/agents"
              className="hover:text-foreground transition-colors truncate hidden sm:inline-block rounded px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Agents
            </Link>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60 hidden sm:inline-block" />
            <span className="font-medium text-foreground truncate">
              {breadcrumbCurrent}
            </span>
          </nav>
        ) : user ? (
          <nav
            aria-label="Main navigation"
            className="hidden sm:flex items-center gap-1 pl-2 ml-1 border-l border-border/60"
          >
            <NavLink to="/home" className={navLinkClass}>
              <MessageSquare className="size-3.5" />
              <span>Chat</span>
            </NavLink>
            <NavLink to="/agents" className={navLinkClass}>
              <Bot className="size-3.5" />
              <span>Agents</span>
            </NavLink>
          </nav>
        ) : null}
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {actions}

        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-border/60">
            <div className="flex items-center gap-2">
              {showProfileImage ? (
                <img
                  src={user.profilePicture}
                  alt={user.name || "User"}
                  referrerPolicy="no-referrer"
                  onError={() => setFailedImageUrl(user.profilePicture)}
                  className="size-7 rounded-full object-cover ring-1 ring-border/80"
                />
              ) : (
                <div className="size-7 rounded-full bg-secondary text-secondary-foreground text-xs font-medium flex items-center justify-center ring-1 ring-border">
                  {(user.name?.[0] || user.email?.[0] || "U").toUpperCase()}
                </div>
              )}
              <span className="text-xs font-medium text-muted-foreground hidden md:inline-block max-w-[140px] truncate">
                {user.name || user.email}
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs gap-1.5 cursor-pointer ml-1"
              title="Log out"
            >
              {isLoggingOut ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <LogOut className="size-3.5" />
              )}
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default Header;
