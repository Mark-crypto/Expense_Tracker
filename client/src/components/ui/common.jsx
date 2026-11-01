import { ArrowDownRight, ArrowUpRight, CaretLeft, CaretRight, Minus, WarningCircle } from "@phosphor-icons/react";
import { Button } from "./button";
import { Card } from "./card";
import { cn } from "@/lib/utils";

export const PageHeader = ({ title, description, actions }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div className="min-w-0">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const StatCard = ({ label, value, hint, icon: Icon, valueClassName }) => (
  <Card className="p-4 sm:p-5">
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
    </div>
    <p className={cn("mt-2 truncate text-xl font-semibold tracking-tight sm:text-2xl", valueClassName)}>
      {value}
    </p>
    {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
  </Card>
);

// Rising spend is the bad direction, so up reads as danger.
export const SpendDelta = ({ value, suffix }) => {
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  const tone = value > 0 ? "text-danger" : value < 0 ? "text-success" : "text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-medium", tone)}>
      <Icon className="size-3.5" aria-hidden />
      {Math.abs(value)}%
      {suffix && <span className="ml-1 font-normal text-muted-foreground">{suffix}</span>}
    </span>
  );
};

export const Badge = ({ tone = "neutral", className, children }) => {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    accent: "bg-accent text-accent-foreground",
    success: "bg-success/12 text-success",
    warning: "bg-warning/12 text-warning",
    danger: "bg-danger/12 text-danger",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
};

export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn("flex flex-col items-center px-4 py-12 text-center", className)}>
    {Icon && (
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" aria-hidden />
      </div>
    )}
    <p className="text-sm font-medium">{title}</p>
    {description && (
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState = ({ message = "Something went wrong.", onRetry }) => (
  <Card>
    <EmptyState
      icon={WarningCircle}
      title="We couldn't load this"
      description={message}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    />
  </Card>
);

export const Notice = ({ tone = "neutral", icon: Icon, className, children }) => {
  const tones = {
    neutral: "border-border bg-muted/50 text-muted-foreground",
    warning: "border-warning/30 bg-warning/10 text-warning",
    danger: "border-danger/30 bg-danger/10 text-danger",
  };
  return (
    <div className={cn("flex gap-2.5 rounded-lg border p-3 text-sm", tones[tone], className)}>
      {Icon && <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />}
      <div className="min-w-0">{children}</div>
    </div>
  );
};

export const Pagination = ({ page, totalPages = 1, onChange }) => (
  <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
    <p className="text-xs text-muted-foreground">
      Page {page} of {totalPages || 1}
    </p>
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <CaretLeft /> Previous
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= (totalPages || 1)}
        onClick={() => onChange(page + 1)}
      >
        Next <CaretRight />
      </Button>
    </div>
  </div>
);

export const ProgressBar = ({ value, className, barClassName }) => (
  <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
    <div
      className={cn("h-full rounded-full bg-primary transition-[width] duration-500", barClassName)}
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);

export const Avatar = ({ text, className }) => (
  <span
    aria-hidden
    className={cn(
      "flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground",
      className
    )}
  >
    {text}
  </span>
);
