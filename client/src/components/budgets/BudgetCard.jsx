import { CheckCircle, PauseCircle, Warning, WarningOctagon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category";
import { categoryLabel } from "@/lib/categories";
import { formatKES, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONES = {
  danger: ["text-danger", "bg-danger", WarningOctagon],
  warning: ["text-warning", "bg-warning", Warning],
  success: ["text-success", "bg-primary", CheckCircle],
  muted: ["text-muted-foreground", "bg-muted-foreground", PauseCircle],
};

export const PaceBar = ({ share, elapsed, showMarker, fill, className }) => (
  <div className={cn("relative h-2 rounded-full bg-muted", className)}>
    <div
      className={cn("h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none", fill)}
      style={{ width: `${Math.min(share, 1) * 100}%` }}
    />
    {showMarker && (
      <span
        title="Today"
        className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-foreground"
        style={{ left: `${Math.min(elapsed, 1) * 100}%` }}
      />
    )}
  </div>
);

const forecast = (budget, progress, state) => {
  if (state.key === "over") return `Over by ${formatKES(budget.spent - budget.limit)}`;
  if (!progress.running) return `${formatKES(progress.left)} left unspent`;
  if (state.key === "paused" || state.key === "ended") return `${formatKES(budget.spent)} spent`;
  if (progress.canForecast && progress.projected > budget.limit) {
    return `On pace to finish ${formatKES(progress.projected - budget.limit)} over`;
  }
  return `${formatKES(progress.dailyLeft)} a day left`;
};

const BudgetCard = ({ budget, progress, state, active, compact, onOpen }) => {
  const [text, fill, Icon] = TONES[state.tone];

  return (
    <Card
      className={cn(
        "transition-colors hover:border-input",
        active && "border-primary shadow-[inset_0_0_0_1px_var(--primary)]"
      )}
    >
      <button
        type="button"
        aria-pressed={active}
        onClick={() => onOpen(budget.budget_id)}
        className={cn("w-full space-y-2.5 rounded-xl p-4 text-left", compact && "space-y-1.5 p-3")}
      >
        <span className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <CategoryIcon category={budget.category} className="size-5" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{titleCase(budget.name)}</span>
              {!compact && (
                <span className="block truncate text-xs text-muted-foreground">
                  {categoryLabel(budget.category)} · {budget.has_time_limit ? "One-off" : "Monthly"}
                </span>
              )}
            </span>
          </span>
          <span className={cn("inline-flex shrink-0 items-center gap-1 text-xs font-medium", text)}>
            <Icon className="size-3.5" aria-hidden />
            {state.label}
          </span>
        </span>

        <span className="flex items-baseline gap-1.5 tabular-nums">
          <span className="text-lg font-semibold tracking-tight">{formatKES(budget.spent)}</span>
          <span className="text-xs text-muted-foreground">of {formatKES(budget.limit)}</span>
        </span>

        <PaceBar share={progress.share} elapsed={progress.elapsed} showMarker={progress.running} fill={fill} />

        <span className="block text-xs text-muted-foreground tabular-nums">
          {forecast(budget, progress, state)}
        </span>
      </button>
    </Card>
  );
};

export default BudgetCard;
