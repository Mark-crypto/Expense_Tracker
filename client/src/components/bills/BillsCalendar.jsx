import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CaretLeft, CaretRight, CheckCircle } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MerchantTile } from "@/components/ui/category";
import { Badge, ErrorState, Notice } from "@/components/ui/common";
import { Skeleton } from "@/components/ui/skeleton";
import { kindLabel } from "@/lib/bills";
import { monthLabel } from "@/lib/dashboard";
import { formatDate, formatKES } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DOTS_IN_CELL = 3;
const STATUS = { paid: "Paid", confirm: "To confirm", due: "Due" };

const pad = (value) => String(value).padStart(2, "0");
const shiftMonth = (month, by) => {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(year, number - 1 + by, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
};

const buildDays = (month) => {
  const [year, number] = month.split("-").map(Number);
  const total = new Date(year, number, 0).getDate();
  const blanks = (new Date(year, number - 1, 1).getDay() + 6) % 7;
  return [
    ...Array(blanks).fill(null),
    ...Array.from({ length: total }, (_, index) => `${month}-${pad(index + 1)}`),
  ];
};

const dot = (item) => (item.kind === "subscription" ? "bg-chart-in" : "bg-primary");
const settled = (item) => item.status === "paid";
const sumOf = (items) => items.reduce((sum, item) => sum + item.amount, 0);

const Entry = ({ item, onPaid, onSkip, busy }) => (
  <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
    <MerchantTile name={item.name} />
    <div className="min-w-0 flex-1 basis-28">
      <p className="truncate text-sm font-medium">{item.name}</p>
      <p className="text-xs text-muted-foreground">
        {kindLabel(item.kind)}, {STATUS[item.status].toLowerCase()}
      </p>
    </div>
    <span className={cn("text-sm font-medium tabular-nums", settled(item) && "text-muted-foreground")}>
      {item.varies ? "~" : ""}
      {formatKES(item.amount)}
    </span>
    {settled(item) && <CheckCircle className="size-4 text-success" aria-label="Paid" />}
    {item.status === "confirm" && <Badge>To confirm</Badge>}
    {item.canAct && (
      <div className="flex gap-1.5">
        <Button size="sm" disabled={busy} onClick={() => onPaid(item)}>
          Mark paid
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => onSkip(item)}>
          Skip
        </Button>
      </div>
    )}
  </li>
);

const BillsCalendar = ({ onPaid, onSkip, busy }) => {
  const [month, setMonth] = useState(null);
  const [selected, setSelected] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["bills", "calendar", month],
    queryFn: async () =>
      (await axiosInstance.get("/bills/calendar", { params: month ? { month } : {} })).data,
  });

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (error) return <ErrorState message="We couldn't load your calendar." onRetry={refetch} />;

  const { items, today, heavyWeek } = data;
  const shown = data.month;
  const byDate = Object.groupBy(items, (item) => item.date);
  const datesWithItems = Object.keys(byDate).sort();
  const openDate = selected?.startsWith(shown) ? selected : (datesWithItems.find((date) => date >= today) ?? datesWithItems[0]);
  const dueLeft = items.filter((item) => item.status === "due");

  const move = (by) => {
    setMonth(shiftMonth(shown, by));
    setSelected(null);
  };

  return (
    <Card className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-1">
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="icon" className="size-8" aria-label="Previous month" onClick={() => move(-1)}>
            <CaretLeft />
          </Button>
          <div className="text-center">
            <h2 className="text-sm">{monthLabel(shown, "long")}</h2>
            <p className="text-xs text-muted-foreground tabular-nums">{formatKES(sumOf(dueLeft))} still to come</p>
          </div>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Next month" onClick={() => move(1)}>
            <CaretRight />
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-0.5">
          {WEEKDAYS.map((day) => (
            <p key={day} className="pb-1 text-center text-[11px] text-muted-foreground">
              {day}
            </p>
          ))}
          {buildDays(shown).map((date, index) => {
            if (!date) return <span key={`blank-${index}`} />;
            const list = byDate[date] ?? [];
            return (
              <button
                key={date}
                type="button"
                aria-label={`${formatDate(date)}, ${list.length} ${list.length === 1 ? "payment" : "payments"}`}
                aria-pressed={date === openDate}
                onClick={() => setSelected(date)}
                className={cn(
                  "flex h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg transition-colors hover:bg-muted",
                  date === openDate && "bg-accent hover:bg-accent"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                    date === today && "bg-primary font-semibold text-primary-foreground"
                  )}
                >
                  {Number(date.slice(8))}
                </span>
                <span className="flex h-1.5 gap-0.5" aria-hidden>
                  {list.slice(0, DOTS_IN_CELL).map((item) => (
                    <span key={item.id} className={cn("size-1.5 rounded-full", dot(item), settled(item) && "opacity-40")} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <ul className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary" /> Bill</li>
          <li className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-chart-in" /> Subscription</li>
        </ul>
      </div>

      <div className="min-w-0 space-y-3 border-t border-border pt-3 md:border-t-0 md:pt-0 xl:border-t xl:pt-3">
        {heavyWeek && (
          <Notice className="p-2.5 text-xs">
            {formatKES(heavyWeek.total)} goes out between {formatDate(heavyWeek.from)} and {formatDate(heavyWeek.to)}.
          </Notice>
        )}
        {openDate && byDate[openDate] ? (
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm">{openDate === today ? "Today" : formatDate(openDate)}</h3>
              <span className="text-sm font-semibold tabular-nums">{formatKES(sumOf(byDate[openDate]))}</span>
            </div>
            <ul className="divide-y divide-border">
              {byDate[openDate].map((item) => (
                <Entry key={item.id} item={item} onPaid={onPaid} onSkip={onSkip} busy={busy} />
              ))}
            </ul>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">Nothing due on this day.</p>
        )}
      </div>
    </Card>
  );
};

export default BillsCalendar;
