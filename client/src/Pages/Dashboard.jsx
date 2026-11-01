import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Plus, Scan, UploadSimple, X } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/common";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryBars from "@/components/charts/CategoryBars";
import BudgetRings from "@/components/dashboard/BudgetRings";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import HeroCurve from "@/components/dashboard/HeroCurve";
import NeedsAttention from "@/components/dashboard/NeedsAttention";
import SpendingCalendar from "@/components/dashboard/SpendingCalendar";
import StatRow from "@/components/dashboard/StatRow";
import TransactionsTable from "@/components/dashboard/TransactionsTable";
import { useAuth } from "@/hooks/useAuth";
import { categoryLabel } from "@/lib/categories";
import { buildPeriods, inMonths, monthKey, monthLabel, total } from "@/lib/dashboard";
import { formatDate, localToday, titleCase } from "@/lib/format";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  return hour < 17 ? "Good afternoon" : "Good evening";
};

const Onboarding = () => {
  const steps = [
    { label: "Import an M-Pesa statement", to: "/import", icon: UploadSimple },
    { label: "Add an expense by hand", to: "/expense-form", icon: Plus },
    { label: "Create your first budget", to: "/budget", icon: Check },
  ];
  return (
    <Card>
      <CardHeader
        title="Let's fill your dashboard"
        description="Your charts and insights appear as soon as you add some spending."
      />
      <CardContent className="grid gap-2 sm:grid-cols-3">
        {steps.map(({ label, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-4" aria-hidden />
            </span>
            {label}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

const FilterChip = ({ label, onClear }) => (
  <button
    type="button"
    onClick={onClear}
    aria-label={`Clear filter: ${label}`}
    className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
  >
    {label}
    <X className="size-3.5" aria-hidden />
  </button>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDay, setSelectedDay] = useState(null);

  const today = localToday();
  const periods = useMemo(() => buildPeriods(new Date()), []);
  const periodId = periods[searchParams.get("period")] ? searchParams.get("period") : "month";
  const category = searchParams.get("category");
  const period = periods[periodId];

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => (await axiosInstance.get("/dashboard/overview")).data,
  });

  const updateParams = (changes) => {
    setSelectedDay(null);
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        Object.entries(changes).forEach(([key, value]) =>
          value ? next.set(key, value) : next.delete(key)
        );
        return next;
      },
      { replace: true }
    );
  };

  const toggleCategory = (value) => updateParams({ category: category === value ? null : value });

  const expenses = data?.expenses;
  const filtered = useMemo(
    () => (category ? expenses?.filter((row) => row.category === category) : expenses) ?? [],
    [expenses, category]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-96 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  if (error) return <ErrorState onRetry={refetch} />;

  const { budgets, monthly } = data;
  const firstName = titleCase(user?.name?.split(" ")[0]);
  const lastSix = periods["6m"].months;
  const monthlyByKey = new Map(monthly.map((row) => [row.month, row]));
  const hasStatement = monthly.length > 0;

  const periodExpenses = inMonths(filtered, period.months);
  const calendarMonth = period.months[period.months.length - 1];
  const tableRows = selectedDay
    ? filtered.filter((row) => row.date === selectedDay)
    : periodExpenses;

  const categoryTotals = Object.values(
    inMonths(expenses, period.months).reduce((totals, row) => {
      totals[row.category] ??= { category: row.category, total: 0 };
      totals[row.category].total += row.amount;
      return totals;
    }, {})
  );

  const moneyOutFor = (months) => total(inMonths(filtered, months));
  const savedFor = (months) =>
    total(inMonths(filtered, months).filter((row) => row.category === "savings"));
  const fromStatement = (months, field) =>
    months.reduce((sum, month) => sum + (monthlyByKey.get(month)?.[field] ?? 0), 0);

  const stats = [
    {
      label: "Money in",
      value: fromStatement(period.months, "moneyIn"),
      trend: lastSix.map((month) => monthlyByKey.get(month)?.moneyIn ?? 0),
      color: "var(--chart-in)",
      missing: !hasStatement,
    },
    {
      label: "Money out",
      value: moneyOutFor(period.months),
      trend: lastSix.map((month) => moneyOutFor([month])),
      color: "var(--chart-mark)",
    },
    {
      label: "Saved",
      value: savedFor(period.months),
      trend: lastSix.map((month) => savedFor([month])),
      color: "var(--chart-in)",
    },
    {
      label: "M-Pesa fees",
      value: fromStatement(period.months, "fees"),
      trend: lastSix.map((month) => monthlyByKey.get(month)?.fees ?? 0),
      color: "var(--chart-mark)",
      missing: !hasStatement,
    },
  ];

  const cashFlow = lastSix.map((month) => ({
    label: monthLabel(month),
    moneyIn: monthlyByKey.get(month)?.moneyIn ?? 0,
    moneyOut: moneyOutFor([month]),
  }));

  const feesIn = (month) => monthlyByKey.get(month)?.fees ?? 0;
  const lastMonth = periods.last.months[0];
  const monthBefore = periods.last.previous[0];
  const thisMonth = monthKey(new Date());
  const feeAlert =
    feesIn(thisMonth) > feesIn(lastMonth) && feesIn(lastMonth) > 0
      ? { current: feesIn(thisMonth), previous: feesIn(lastMonth) }
      : feesIn(lastMonth) > feesIn(monthBefore) && feesIn(monthBefore) > 0
        ? { current: feesIn(lastMonth), previous: feesIn(monthBefore) }
        : null;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Here's how your money is doing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/insights" className="lg:hidden">
            <Button variant="secondary" tabIndex={-1}>
              <Scan /> Money X-ray
            </Button>
          </Link>
          <Link to="/import">
            <Button variant="secondary" tabIndex={-1}>
              <UploadSimple /> Import M-Pesa
            </Button>
          </Link>
        </div>
      </header>

      {expenses.length === 0 ? (
        <Onboarding />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              value={periodId}
              onValueChange={(id) => updateParams({ period: id === "month" ? null : id })}
            >
              <TabsList aria-label="Time period">
                {Object.entries(periods).map(([id, { label }]) => (
                  <TabsTrigger key={id} value={id} className="px-2.5 text-xs sm:px-3 sm:text-sm">
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {category && (
              <FilterChip label={categoryLabel(category)} onClear={() => updateParams({ category: null })} />
            )}
            {selectedDay && (
              <FilterChip label={formatDate(selectedDay)} onClear={() => setSelectedDay(null)} />
            )}
          </div>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
            <HeroCurve expenses={filtered} period={period} category={category} today={today} />
            <NeedsAttention
              budgets={budgets}
              fees={feeAlert}
              warnings={data.forecastWarnings}
              onSelectCategory={toggleCategory}
            />
          </section>

          <StatRow stats={stats} />

          <section className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <CashFlowChart data={cashFlow} category={category} />
            <BudgetRings budgets={budgets} selected={category} onSelect={toggleCategory} />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Where it went" description="Select a category to filter the whole page" />
              <CardContent className="p-3 sm:p-3">
                <CategoryBars items={categoryTotals} selected={category} onSelect={toggleCategory} />
              </CardContent>
            </Card>
            <SpendingCalendar
              expenses={filtered}
              month={calendarMonth}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          </section>

          <TransactionsTable expenses={tableRows} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
