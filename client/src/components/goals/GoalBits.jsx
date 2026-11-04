import { GOAL_STATES, progressOf } from "@/lib/goals";
import { cn } from "@/lib/utils";

export const GoalState = ({ state }) => {
  const { label, icon: Icon, className } = GOAL_STATES[state];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", className)}>
      {Icon && <Icon className="size-3.5" weight="bold" aria-hidden />}
      {label}
    </span>
  );
};

export const GoalProgress = ({ goal }) => (
  <div
    role="progressbar"
    aria-label={`${goal.name} progress`}
    aria-valuemin={0}
    aria-valuemax={goal.target}
    aria-valuenow={Math.min(goal.saved, goal.target)}
    className="h-2 overflow-hidden rounded-full bg-muted"
  >
    <div
      className={cn("h-full rounded-full", goal.state === "behind" || goal.state === "late" ? "bg-warning" : "bg-primary")}
      style={{ width: `${progressOf(goal)}%` }}
    />
  </div>
);
