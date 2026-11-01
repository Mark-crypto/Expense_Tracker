import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ArrowCounterClockwise, CalendarCheck, CheckCircle, UploadSimple, Warning, WarningOctagon, X } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import AnimatedAmount from "@/components/dashboard/AnimatedAmount";
import ForecastCurve from "@/components/forecast/ForecastCurve";
import { PaceBar } from "@/components/budgets/BudgetCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CategoryIcon, MerchantTile } from "@/components/ui/category";
import { EmptyState, ErrorState, StatCard } from "@/components/ui/common";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categoryLabel } from "@/lib/categories";
import { monthLabel } from "@/lib/dashboard";
import { formatDate, formatKES, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const CONFIDENCE = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

const Bills = ({ forecast, onChanged }) => {
  const dismiss = useMutation({
    mutationFn: async (key) => await axiosInstance.post("/forecast/bills/dismiss", { key }),
    onSuccess: (_, key) => {
      onChanged();
      toast(
        ({ closeToast }) => (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">Removed from your bills</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                closeToast();
                await axiosInstance.post("/forecast/bills/restore", { key });
                onChanged();
              }}
            >
              Undo
            </Button>
          </div>
        ),
        { autoClose: 6000 }
      );
    },
    onError: () => toast.error("Could not remove this bill."),
  });

  const upcoming = forecast.bills.filter((bill) => !bill.paid);
  const paid = forecast.bills.filter((bill) => bill.paid);

  return (
    <Card>
      <CardHeader title="Upcoming bills" description="Detected from what you pay every month" />
      <CardContent className="pt-3">
        {forecast.bills.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No regular bills found yet. They need at least 3 months of history.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {[...upcoming, ...paid].map((bill) => (
              <li key={bill.key} className="group flex items-center gap-2.5 py-2">
                <MerchantTile name={bill.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{bill.name}</p>
                  <p className={cn("text-xs text-muted-foreground", bill.overdue && "text-warning")}>
                    {bill.paid ? "Paid this month" : bill.overdue ? "Usually paid by now" : `Due ${formatDate(bill.date)}`}
                  </p>
                </div>
                <span className={cn("text-sm font-medium tabular-nums", bill.paid && "text-muted-foreground")}>
                  {bill.varies ? "~" : ""}
                  {formatKES(bill.amount)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
                  aria-label={`${bill.name} is not a regular bill`}
                  title="Not a regular bill"
                  onClick={() => dismiss.mutate(bill.key)}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

const WhatIf = ({ options, cuts, onChange, saved, total }) => (
  <Card>
    <CardHeader
      title="What if"
      description="Try spending less. This doesn't change your data."
      action={
        saved > 0 && (
          <Button variant="ghost" size="sm" onClick={() => onChange({})}>
            <ArrowCounterClockwise /> Reset
          </Button>
        )
      }
    />
    <CardContent className="space-y-4 pt-3">
      {options.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Nothing left to adjust this month.</p>
      ) : (
        options.map(({ category, amount }) => {
          const cut = cuts[category] ?? 0;
          return (
            <div key={category}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex min-w-0 items-center gap-1.5 font-medium">
                  <CategoryIcon category={category} />
                  <span className="truncate">{categoryLabel(category)}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {cut > 0 ? `Save ${formatKES(cut)}` : `${formatKES(amount)} expected`}
                </span>
              </div>
              <Slider
                aria-label={`Reduce ${categoryLabel(category)} spending`}
                min={0}
                max={amount}
                step={Math.max(Math.round(amount / 40), 50)}
                value={[cut]}
                onValueChange={([value]) => onChange({ ...cuts, [category]: value })}
              />
            </div>
          );
        })
      )}
      {saved > 0 && (
        <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          You'd finish at <span className="font-semibold tabular-nums">{formatKES(total)}</span>, saving{" "}
          <span className="font-semibold tabular-nums">{formatKES(saved)}</span>.
        </p>
      )}
    </CardContent>
  </Card>
);

const outlookStatus = (row) => {
  if (row.spent > row.limit) return ["Over budget", "text-danger", "bg-danger", WarningOctagon];
  if (row.over > 0) return [`Heading ${formatKES(row.over)} over`, "text-warning", "bg-warning", Warning];
  return ["On track", "text-success", "bg-primary", CheckCircle];
};

const Outlook = ({ rows }) => (
  <Card>
    <CardHeader title="Budget outlook" description="Where each budget should finish this month. The line marks the forecast." />
    <CardContent className="grid gap-x-8 gap-y-4 pt-3 md:grid-cols-2">
      {rows.map((row) => {
        const [label, text, fill, Icon] = outlookStatus(row);
        return (
          <div key={row.budget_id}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex min-w-0 items-center gap-1.5 font-medium">
                <CategoryIcon category={row.category} />
                <span className="truncate">{titleCase(row.name)}</span>
              </span>
              <span className={cn("inline-flex shrink-0 items-center gap-1 text-xs font-medium", text)}>
                <Icon className="size-3.5" aria-hidden />
                {label}
              </span>
            </div>
            <PaceBar share={row.spent / row.limit} elapsed={row.forecast / row.limit} showMarker fill={fill} />
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              {formatKES(row.spent)} now, {formatKES(row.forecast)} forecast, {formatKES(row.limit)} limit
            </p>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

const NextMonths = ({ forecast }) => {
  const highest = Math.max(...forecast.nextMonths.map((row) => row.estimate), 1);
  return (
    <Card>
      <CardHeader title="Next 3 months" description={`Rough estimate from your bills and usual spending. Based on ${forecast.monthsOfHistory} months of history.`} />
      <CardContent className="space-y-4 pt-3">
        {forecast.nextMonths.map(({ month, estimate }) => (
          <div key={month}>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="font-medium">{monthLabel(month, "long")}</span>
              <span className="font-semibold tabular-nums">About {formatKES(estimate)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(estimate / highest) * 100}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const Prediction = () => {
  const queryClient = useQueryClient();
  const [range, setRange] = useState("month");
  const [cuts, setCuts] = useState({});

  const { data: forecast, isLoading, error, refetch } = useQuery({
    queryKey: ["forecast"],
    queryFn: async () => (await axiosInstance.get("/forecast")).data,
  });

  const refresh = () => {
    ["forecast", "dashboard-overview", "limit-notification"].forEach((queryKey) =>
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }
  if (error) return <ErrorState message="We couldn't load your forecast." onRetry={refetch} />;

  const monthName = monthLabel(forecast.month, "long");

  if (!forecast.enough) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl">Forecast</h1>
        <Card>
          <EmptyState
            icon={CalendarCheck}
            title="Your forecast needs a little more history"
            description="It starts working after your first full month of expenses. Importing an M-Pesa statement is the fastest way to get there."
            action={
              <Link to="/import" className={buttonVariants()}>
                <UploadSimple /> Import M-Pesa
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const saved = Object.values(cuts).reduce((sum, value) => sum + value, 0);
  const total = forecast.total - saved;
  const change = forecast.lastMonth - total;
  const lastDay = forecast.curve.at(-1).date;

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl">Forecast</h1>
        <Tabs value={range} onValueChange={setRange}>
          <TabsList>
            <TabsTrigger value="month" className="px-3 text-sm">
              This month
            </TabsTrigger>
            <TabsTrigger value="next" className="px-3 text-sm">
              Next 3 months
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {range === "next" ? (
        <NextMonths forecast={forecast} />
      ) : (
        <>
          <section className="rounded-2xl bg-hero p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-white/70">Heading for this by {formatDate(lastDay)}</p>
                <AnimatedAmount value={total} className="mt-0.5 block text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl" />
                <p className="mt-1.5 text-sm text-white/85 tabular-nums">
                  {change >= 0 ? `${formatKES(change)} under` : `${formatKES(-change)} over`} last month · likely{" "}
                  {formatKES(forecast.low - saved)} to {formatKES(forecast.high - saved)}
                </p>
              </div>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/85">
                {CONFIDENCE[forecast.confidence]}
              </span>
            </div>
            <ForecastCurve forecast={forecast} saved={saved} />
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/70">
              <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-hero-line" /> Spent</li>
              <li className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-hero-line" /> Forecast</li>
              <li className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-hero-line/20" /> Likely range</li>
              <li className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-white" /> Bill due</li>
            </ul>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="How the forecast adds up">
            <StatCard label="Already spent" value={formatKES(forecast.spent)} hint={`So far in ${monthName}`} />
            <StatCard label="Bills to come" value={formatKES(forecast.stillToCome)} hint={`${forecast.bills.filter((bill) => !bill.paid).length} regular bills`} />
            <StatCard label="Likely extra" value={formatKES(forecast.likelyExtra - saved > 0 ? forecast.likelyExtra - saved : 0)} hint={`Everyday spending, ${forecast.daysLeft} days left`} />
            {forecast.safePerDay === null ? (
              <StatCard label="Safe to spend" value="Not set up" valueClassName="text-base leading-8" hint={<Link to="/budget" className="font-medium text-primary hover:underline">Create a budget</Link>} />
            ) : (
              <StatCard label="Safe to spend" value={`${formatKES(forecast.safePerDay)}`} hint="A day, after bills" />
            )}
          </section>

          <section className="grid items-start gap-3 lg:grid-cols-2">
            <Bills forecast={forecast} onChanged={refresh} />
            <WhatIf options={forecast.whatIf} cuts={cuts} onChange={setCuts} saved={saved} total={total} />
          </section>

          {forecast.outlook.length > 0 && <Outlook rows={forecast.outlook} />}
        </>
      )}
    </div>
  );
};

export default Prediction;
