import { useState } from "react";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { monthLabel } from "@/lib/dashboard";
import { formatDate, formatKES } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const SpendingCalendar = ({ expenses, month, selectedDay, onSelectDay }) => {
  const [hovered, setHovered] = useState(null);
  const [year, number] = month.split("-").map(Number);
  const dayCount = new Date(year, number, 0).getDate();
  const leadingBlanks = (new Date(year, number - 1, 1).getDay() + 6) % 7;

  const totals = new Map();
  expenses
    .filter((row) => row.date.startsWith(month))
    .forEach((row) => totals.set(row.date, (totals.get(row.date) ?? 0) + row.amount));
  const highest = Math.max(...totals.values(), 1);

  return (
    <Card>
      <CardHeader
        title={`Spending calendar, ${monthLabel(month, "long")}`}
        description="Darker days cost more. Select a day to see it below."
      />
      <CardContent>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((day, index) => (
            <span key={index} className="text-center text-xs text-muted-foreground">
              {day}
            </span>
          ))}
          {Array.from({ length: leadingBlanks }, (_, index) => (
            <span key={`blank-${index}`} />
          ))}
          {Array.from({ length: dayCount }, (_, index) => {
            const date = `${month}-${String(index + 1).padStart(2, "0")}`;
            const amount = totals.get(date) ?? 0;
            const strength = amount ? Math.round(20 + 80 * Math.sqrt(amount / highest)) : 0;
            return (
              <button
                key={date}
                type="button"
                aria-pressed={selectedDay === date}
                aria-label={`${formatDate(date)}, ${formatKES(amount)}`}
                onClick={() => onSelectDay(selectedDay === date ? null : date)}
                onPointerEnter={() => setHovered({ date, amount })}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered({ date, amount })}
                onBlur={() => setHovered(null)}
                style={
                  amount
                    ? { background: `color-mix(in srgb, var(--chart-mark) ${strength}%, var(--muted))` }
                    : undefined
                }
                className={cn(
                  "aspect-[4/3] rounded-md bg-muted text-xs tabular-nums transition-transform hover:scale-105 hover:ring-2 hover:ring-ring",
                  strength > 58 && "text-white",
                  selectedDay === date && "ring-2 ring-ring ring-offset-1 ring-offset-card"
                )}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex h-12 items-center justify-between gap-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            Less
            {[0, 30, 60, 100].map((mix) => (
              <span
                key={mix}
                className="h-2.5 w-4 rounded-sm"
                style={{ background: `color-mix(in srgb, var(--chart-mark) ${mix}%, var(--muted))` }}
              />
            ))}
            More
          </div>
          {hovered && (
            <ChartTooltip
              title={formatDate(hovered.date)}
              rows={[[formatKES(hovered.amount), "spent"]]}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpendingCalendar;
