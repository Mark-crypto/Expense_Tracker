import { Warning } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { formatKES } from "@/lib/format";
import { cn } from "@/lib/utils";

const Change = ({ before, after }) => (
  <p className="text-sm tabular-nums">
    {formatKES(before)} left → <strong className="font-semibold">{formatKES(after)}</strong>
  </p>
);

export const ImpactCard = ({ rows }) => (
  <Card className="space-y-3 p-4">
    <h2 className="text-sm font-semibold">What this does</h2>
    {rows.length === 0 ? (
      <p className="text-sm text-muted-foreground">Enter an amount and category to see what it changes.</p>
    ) : (
      <ul className="space-y-3" aria-live="polite">
        {rows.map((row) => (
          <li key={row.key} className="space-y-1">
            <p className="flex justify-between gap-2 text-xs text-muted-foreground">
              <span>{row.label}</span>
              {row.bar && <span className="tabular-nums">of {formatKES(row.bar.limit)}</span>}
            </p>
            {row.bar && (
              <div className="flex h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <span className="bg-primary" style={{ width: `${Math.min(row.bar.spent, 1) * 100}%` }} />
                <span className="bg-warning" style={{ width: `${Math.min(row.bar.adds, Math.max(1 - row.bar.spent, 0)) * 100}%` }} />
              </div>
            )}
            {row.key === "account" ? (
              <p className="text-sm tabular-nums">
                {formatKES(row.before)} → <strong className="font-semibold">{formatKES(row.after)}</strong>
              </p>
            ) : row.key === "safe" && row.before <= 0 ? (
              <p className="text-sm">Nothing left for today</p>
            ) : (
              <Change before={row.before} after={Math.max(row.after, 0)} />
            )}
            {row.over && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-warning">
                <Warning className="size-3.5 shrink-0" aria-hidden /> {row.over}
              </p>
            )}
          </li>
        ))}
      </ul>
    )}
  </Card>
);

// On phones, one line: whatever goes over first, then the budget, Safe to spend, the account.
export const ImpactLine = ({ rows, className }) => {
  const row = rows.find((item) => item.over) ?? rows[0];
  if (!row) return null;
  return (
    <p className={cn("text-xs tabular-nums", row.over ? "font-medium text-warning" : "text-muted-foreground", className)} aria-live="polite">
      {row.over ? `${row.short}: ${row.over.charAt(0).toLowerCase()}${row.over.slice(1)}` : `${row.short}: ${formatKES(row.before)} → ${formatKES(row.after)}`}
    </p>
  );
};
