import { Link } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { GoalProgress, GoalState } from "@/components/goals/GoalBits";
import { formatKES } from "@/lib/format";
import { goalAdvice } from "@/lib/goals";

// The nearest goal, so saving stays in view next to spending.
const GoalSummary = ({ goal }) => (
  <Card className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:items-center sm:gap-6">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-2">
        <p className="truncate text-sm font-semibold">{goal.name}</p>
        <GoalState state={goal.state} />
      </div>
      <p className="mt-0.5 text-sm tabular-nums">
        {formatKES(goal.saved)} <span className="text-muted-foreground">of {formatKES(goal.target)}</span>
      </p>
    </div>
    <div className="space-y-1.5">
      <GoalProgress goal={goal} />
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-xs text-muted-foreground tabular-nums">{goalAdvice(goal)}</p>
        <Link to="/accounts#goals" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {goal.count > 1 ? `All ${goal.count} goals` : "Your goal"} <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>
    </div>
  </Card>
);

export default GoalSummary;
