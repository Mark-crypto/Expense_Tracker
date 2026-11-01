import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/common";
import { formatKES, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const Ring = ({ budget, selected, onSelect }) => {
  const [filled, setFilled] = useState(false);
  const share = budget.spent / budget.limit;
  const percent = Math.round(share * 100);
  const over = budget.spent > budget.limit;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const color = over ? "var(--danger)" : share >= 0.85 ? "var(--warning)" : "var(--chart-mark)";
  const offset = filled ? CIRCUMFERENCE * (1 - Math.min(share, 1)) : CIRCUMFERENCE;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(budget.category)}
      className={cn(
        "rounded-xl px-1 py-2 text-center transition-colors hover:bg-muted/70",
        selected && "bg-accent hover:bg-accent"
      )}
    >
      <svg viewBox="0 0 92 92" className="mx-auto size-20 sm:size-24" aria-hidden>
        <circle cx="46" cy="46" r={RADIUS} fill="none" stroke="var(--muted)" strokeWidth="9" />
        <circle
          cx="46"
          cy="46"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 46 46)"
          className="transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
        />
        <text
          x="46"
          y="51"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill="var(--foreground)"
        >
          {percent}%
        </text>
      </svg>
      <span className="mt-1 block truncate text-sm font-semibold">{titleCase(budget.name)}</span>
      <span className={cn("block text-xs", over ? "text-danger" : "text-muted-foreground")}>
        {over ? `Over by ${formatKES(budget.spent - budget.limit)}` : `${formatKES(budget.limit - budget.spent)} left`}
      </span>
    </button>
  );
};

const BudgetRings = ({ budgets, selected, onSelect }) => (
  <Card>
    <CardHeader title="Budgets" description="Select one to filter the page" />
    <CardContent>
      {budgets.length === 0 ? (
        <EmptyState
          title="No active budgets"
          className="py-6"
          action={
            <Link to="/budget">
              <Button variant="secondary" tabIndex={-1}>
                Create a budget
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {budgets.slice(0, 6).map((budget) => (
            <Ring
              key={budget.budget_id}
              budget={budget}
              selected={selected === budget.category}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default BudgetRings;
