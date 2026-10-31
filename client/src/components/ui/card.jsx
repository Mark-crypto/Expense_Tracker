import { cn } from "@/lib/utils";

export const Card = ({ className, ...props }) => (
  <div
    className={cn(
      "rounded-xl border border-border bg-card text-card-foreground",
      className
    )}
    {...props}
  />
);

export const CardHeader = ({ title, description, action, className }) => (
  <div
    className={cn(
      "flex flex-wrap items-start justify-between gap-3 p-5 pb-0",
      className
    )}
  >
    <div className="min-w-0">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && (
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
    {action}
  </div>
);

export const CardContent = ({ className, ...props }) => (
  <div className={cn("p-5", className)} {...props} />
);
