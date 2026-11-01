import { cva } from "class-variance-authority";
import { CircleNotch } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "border border-input bg-card text-foreground hover:bg-muted",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        danger: "bg-destructive text-destructive-foreground hover:opacity-90",
        "danger-ghost": "text-danger hover:bg-danger/10",
      },
      size: {
        sm: "h-8 gap-1.5 px-3 text-xs",
        md: "h-9 gap-2 px-3.5 text-sm",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export const Button = ({ variant, size, loading = false, disabled, className, children, type = "button", ...props }) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={cn(buttonVariants({ variant, size }), className)}
    {...props}
  >
    {loading && <CircleNotch className="animate-spin" />}
    {children}
  </button>
);
