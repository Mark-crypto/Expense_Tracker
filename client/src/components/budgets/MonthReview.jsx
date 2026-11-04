import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { monthLabel } from "@/lib/dashboard";
import { formatKES, titleCase } from "@/lib/format";

const SHOWN = 3;

const MonthReview = ({ review, canDismiss, onUse }) => {
  const key = `budget-review-${review.month}`;
  const [hidden, setHidden] = useState(() => localStorage.getItem(key) === "seen");
  if ((canDismiss && hidden) || review.onTrack + review.over === 0) return null;

  const dismiss = () => {
    localStorage.setItem(key, "seen");
    setHidden(true);
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm">How {monthLabel(review.month, "long")} went</h2>
          <p className="text-xs text-muted-foreground tabular-nums">
            {review.onTrack} stayed within the limit, {review.over} went over.
          </p>
        </div>
        {canDismiss && (
          <Button variant="ghost" size="icon" className="size-7" aria-label="Dismiss review" onClick={dismiss}>
            <X />
          </Button>
        )}
      </div>
      {review.rows.length > 0 && (
        <ul className="mt-2 divide-y divide-border">
          {review.rows.slice(0, SHOWN).map((row) => (
            <li key={row.budget_id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{titleCase(row.name)}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatKES(row.spent)} of {formatKES(row.limit)}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onUse(row)}>
                {row.over ? "Raise" : "Lower"} to {formatKES(row.suggestion)}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default MonthReview;
