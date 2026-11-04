import { CheckCircle, Minus, PauseCircle, Plus, Warning, WarningOctagon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category";
import { LIMIT_STEP, periodLabel } from "@/lib/budgets";
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

const answer = (budget, progress, state) => {
  if (state.key === "over") return `${formatKES(budget.spent - budget.limit)} over`;
  if (state.key === "paused" || state.key === "ended") return `${formatKES(budget.spent)} spent`;
  if (!progress.running) return `${formatKES(progress.left)} left unspent`;
  if (progress.left <= 0) return budget.committed > 0 ? "Fully committed to bills" : "Nothing left";
  const perDay = `${formatKES(progress.left)} left, about ${formatKES(progress.dailyLeft)} a day`;
  if (state.key === "fast") return `${perDay}, on track to finish ${formatKES(progress.projected - budget.limit)} over`;
  return state.key === "good" ? `${perDay}, on track` : perDay;
};

const BudgetCard = ({ budget, progress, state, active, compact, onOpen, onStep }) => {
  const [text, fill, Icon] = TONES[state.tone];
  const canStep = !compact && !!onStep && ["active", "exceeded"].includes(budget.status);

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
                  {budget.name === categoryLabel(budget.category).toLowerCase() ? periodLabel(budget.period) : `${categoryLabel(budget.category)} · ${periodLabel(budget.period)}`}
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
          {answer(budget, progress, state)}
        </span>
        {budget.committed > 0 && (
          <span className="block text-xs text-muted-foreground tabular-nums">
            {formatKES(budget.committed)} already committed to bills
          </span>
        )}
      </button>
      {canStep && (
        <div data-tour="budget-step" className="flex items-center justify-end gap-1 border-t border-border px-3 py-1.5">
          <span className="mr-auto text-xs text-muted-foreground">Change limit by</span>
          <Button variant="ghost" size="icon" className="size-7" aria-label={`Lower ${budget.name} by ${LIMIT_STEP}`} disabled={budget.baseLimit <= LIMIT_STEP} onClick={() => onStep(budget, -LIMIT_STEP)}>
            <Minus />
          </Button>
          <span className="min-w-16 text-center text-xs font-medium tabular-nums">{LIMIT_STEP}</span>
          <Button variant="ghost" size="icon" className="size-7" aria-label={`Raise ${budget.name} by ${LIMIT_STEP}`} onClick={() => onStep(budget, LIMIT_STEP)}>
            <Plus />
          </Button>
        </div>
      )}
    </Card>
  );
};

export default BudgetCard;
