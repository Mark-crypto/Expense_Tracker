import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CircleDollarSign, Gauge, TrendingUp } from "lucide-react";
import axiosInstance from "@/axiosInstance.js";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Badge,
  EmptyState,
  ErrorState,
  Notice,
  PageHeader,
  ProgressBar,
  SpendDelta,
  StatCard,
} from "@/components/ui/common";
import CategoryBars from "@/components/charts/CategoryBars";
import Loading from "@/components/Loading";
import { formatKES } from "@/lib/format";

const paceStatus = (used, elapsed) => {
  if (used > elapsed + 15) return { label: "Well over pace", tone: "danger", bar: "bg-danger" };
  if (used > elapsed + 5) return { label: "Slightly over pace", tone: "warning", bar: "bg-warning" };
  return { label: "On pace", tone: "success", bar: "bg-success" };
};

const Prediction = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["predictions"],
    queryFn: async () => await axiosInstance("/predictions"),
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message="We couldn't load your forecast." onRetry={refetch} />;

  const forecast = data?.data || {};
  const percentChange = parseFloat(forecast.percentChange) || 0;
  const avgDailyExpense = parseFloat(forecast.avgDailyExpense) || 0;
  const timePassedPercent = parseFloat(forecast.timePassedPercent) || 0;
  const budgetUsedPercent = parseFloat(forecast.budgetUsedPercent) || 0;
  const weeklyChange = parseFloat(forecast.weeklyChange) || 0;
  const projectedExpense = parseFloat(forecast.projectedExpense) || 0;
  const categoryPercent = forecast.categoryPercent || [];
  const monthlyTotal = forecast.monthlyTotal || [];
  const lastMonthTotal = monthlyTotal?.[0]?.monthly_total || 0;
  const currentMonthTotal = monthlyTotal?.[1]?.monthly_total || 0;

  const pace = paceStatus(budgetUsedPercent, timePassedPercent);

  return (
    <>
      <PageHeader
        title="Forecast"
        description="Where this month is heading, based on your spending so far."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Spent this month"
          icon={CircleDollarSign}
          value={formatKES(currentMonthTotal)}
          hint={<SpendDelta value={percentChange} suffix="vs last month" />}
        />
        <StatCard
          label="Projected month end"
          icon={TrendingUp}
          value={formatKES(projectedExpense)}
          hint="At your current daily rate"
        />
        <StatCard label="Daily average" icon={CalendarDays} value={formatKES(avgDailyExpense)} hint="So far this month" />
        <StatCard
          label="This week"
          icon={Gauge}
          value={<SpendDelta value={weeklyChange} />}
          hint="Compared with last week"
        />
      </div>

      {forecast.projectionMessage && (
        <Notice icon={TrendingUp} className="mt-4">
          {forecast.projectionMessage}
        </Notice>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader
              title="Budget pace"
              description="Budget used compared with time gone"
              action={<Badge tone={pace.tone}>{pace.label}</Badge>}
            />
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget used</span>
                  <span className="font-medium tabular-nums">{budgetUsedPercent}%</span>
                </div>
                <ProgressBar value={budgetUsedPercent} barClassName={pace.bar} />
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-muted-foreground">Month gone</span>
                  <span className="font-medium tabular-nums">{timePassedPercent}%</span>
                </div>
                <ProgressBar value={timePassedPercent} barClassName="bg-muted-foreground" />
              </div>
              {forecast.budgetProgressMessage && (
                <p className="text-sm text-muted-foreground">{forecast.budgetProgressMessage}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Month to month" />
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Last month</p>
                <p className="mt-1 text-lg font-semibold">{formatKES(lastMonthTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This month so far</p>
                <p className="mt-1 text-lg font-semibold">{formatKES(currentMonthTotal)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-3">
          <CardHeader title="This month by category" description="Largest first" />
          <CardContent>
            {categoryPercent.length > 0 ? (
              <CategoryBars items={categoryPercent} />
            ) : (
              <EmptyState title="No spending recorded this month" className="py-8" />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Prediction;
