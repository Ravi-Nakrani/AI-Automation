import { Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "size-7 rounded-md",
  md: "size-10 rounded-xl",
  lg: "size-11 rounded-xl",
};

const ICON_CLASSES = {
  sm: "size-4",
  md: "size-5",
  lg: "size-5.5",
};

/**
 * Consistent brand emblem used in navigation, empty states, and chat avatars.
 */
export default function BrandMark({ size = "sm", className }) {
  return (
    <div
      className={cn(
        "bg-zinc-100 text-zinc-900 flex items-center justify-center shadow-xs shrink-0 ring-1 ring-white/15",
        SIZE_CLASSES[size] || SIZE_CLASSES.sm,
        className,
      )}
    >
      <Workflow className={ICON_CLASSES[size] || ICON_CLASSES.sm} />
    </div>
  );
}
