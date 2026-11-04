import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ArrowRight, CalendarCheck } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { PaidDialog } from "@/components/bills/BillDialogs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MerchantTile } from "@/components/ui/category";
import { Notice } from "@/components/ui/common";
import { dayMonth } from "@/lib/accounts";
import { kindLabel } from "@/lib/bills";
import { formatKES } from "@/lib/format";
import { refreshMoneyData } from "@/lib/refresh";
import { cn } from "@/lib/utils";

const SHOWN = 4;

const dot = (item) => (item.kind === "subscription" ? "bg-chart-in" : "bg-primary");
const weekday = (date) =>
  new Date(`${date}T00:00`).toLocaleDateString("en-KE", { weekday: "short" });
const paymentCount = (count) => `${count} ${count === 1 ? "payment" : "payments"}`;

const Day = ({ date, items, isToday, selected, onSelect, className }) => (
  <button
    type="button"
    disabled={items.length === 0}
    aria-pressed={selected}
    aria-label={`${dayMonth(date)}, ${paymentCount(items.length)}`}
    onClick={onSelect}
    className={cn(
      "flex min-h-16 min-w-0 flex-col items-center gap-1 rounded-lg py-1.5 transition-colors enabled:hover:bg-muted",
      selected && "bg-accent",
      className
    )}
  >
    <span className="text-[11px] text-muted-foreground">{weekday(date)}</span>
    <span
      className={cn(
        "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
        isToday && "bg-primary font-semibold text-primary-foreground"
      )}
    >
      {Number(date.slice(8))}
    </span>
    <span className="flex h-1.5 gap-0.5" aria-hidden>
      {items.slice(0, 3).map((item) => (
        <span key={`${item.id}-${item.date}`} className={cn("size-1.5 rounded-full", dot(item))} />
      ))}
    </span>
  </button>
);

const ComingUp = ({ upcoming }) => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [paying, setPaying] = useState(null);

  const pay = useMutation({
    mutationFn: async ({ id, amount }) => await axiosInstance.post(`/bills/${id}/paid`, amount ? { amount } : {}),
    onSuccess: ({ data }) => {
      toast.success(data.message);
      setPaying(null);
      refreshMoneyData(queryClient);
    },
    onError: (error) => toast.error(error.response?.data?.message || "This payment could not be saved."),
  });

  if (upcoming.tracked === 0) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <CalendarCheck className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Never miss a bill or subscription</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {upcoming.suggestions > 0
                ? `We found ${paymentCount(upcoming.suggestions).replace("payment", "repeat payment")} in your spending.`
                : "Track rent, KPLC or Spotify and see what's coming on a calendar."}
            </p>
          </div>
        </div>
        <Link to="/bills">
          <Button variant="secondary" tabIndex={-1}>
            {upcoming.suggestions > 0 ? "Review them" : "Add a payment"}
          </Button>
        </Link>
      </Card>
    );
  }

  const { items, days, total, heavyWeek } = upcoming;
  const onDay = (date) => items.filter((item) => item.date === date);
  const shown = (selected ? onDay(selected) : items).slice(0, SHOWN);
  const hidden = (selected ? onDay(selected) : items).length - shown.length;
  const markPaid = (item) => (item.varies ? setPaying(item) : pay.mutate({ id: item.id }));

  return (
    <Card>
      <CardHeader
        title="Coming up"
        description={items.length > 0 ? `${formatKES(total)} over the next ${days.length} days` : `Nothing due in the next ${days.length} days`}
        action={
          <Link to="/bills" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            See calendar <ArrowRight className="size-3" aria-hidden />
          </Link>
        }
      />
      <CardContent className="space-y-3 pt-3">
        <div className="grid grid-cols-7 gap-0.5 lg:grid-cols-14">
          {days.map((date, index) => (
            <Day
              key={date}
              date={date}
              items={onDay(date)}
              isToday={index === 0}
              selected={selected === date}
              className={index >= 7 ? "hidden lg:flex" : undefined}
              onSelect={() => setSelected(selected === date ? null : date)}
            />
          ))}
        </div>

        {heavyWeek && (
          <Notice>
            {formatKES(heavyWeek.total)} goes out between {dayMonth(heavyWeek.from)} and {dayMonth(heavyWeek.to)}.
          </Notice>
        )}

        {shown.length > 0 && (
          <ul className="divide-y divide-border">
            {shown.map((item) => (
              <li key={`${item.id}-${item.date}`} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
                <MerchantTile name={item.name} />
                <div className="min-w-0 flex-1 basis-32">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {kindLabel(item.kind)}, due {dayMonth(item.date)}
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {item.varies ? "~" : ""}
                  {formatKES(item.amount)}
                </span>
                {item.canAct && (
                  <Button size="sm" variant="secondary" disabled={pay.isPending} onClick={() => markPaid(item)}>
                    Mark paid
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <ul className="flex gap-4">
            <li className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary" /> Bill</li>
            <li className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-chart-in" /> Subscription</li>
          </ul>
          {hidden > 0 && <span>{hidden} more</span>}
        </div>
      </CardContent>

      {paying && (
        <PaidDialog
          bill={paying}
          pending={pay.isPending}
          onClose={() => setPaying(null)}
          onPaid={(amount) => pay.mutate({ id: paying.id, amount })}
        />
      )}
    </Card>
  );
};

export default ComingUp;
