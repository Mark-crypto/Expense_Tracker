import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Loading = ({ fullScreen = false, className }) => (
  <div
    role="status"
    aria-label="Loading"
    className={cn(
      "flex items-center justify-center",
      fullScreen ? "min-h-screen" : "min-h-64",
      className
    )}
  >
    <Loader2 className="size-6 animate-spin text-primary" />
  </div>
);

export default Loading;
