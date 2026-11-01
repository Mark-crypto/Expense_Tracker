import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, CreditCard, Landmark, Plus, Tag, Upload } from "lucide-react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, PageHeader, StatCard } from "@/components/ui/common";
import Loading from "@/components/Loading";
import CategoryBars from "@/components/charts/CategoryBars";
import MonthlyChart from "@/components/charts/MonthlyChart";
import ExpenseMiniTable from "@/components/ExpenseMiniTable";
import { useAuth } from "@/hooks/useAuth";
import { categoryLabel } from "@/lib/categories";
import { formatKES, titleCase } from "@/lib/format";

const Dashboard = () => {
  const { user } = useAuth();
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => await axiosInstance.get("/dashboard"),
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState onRetry={refetch} />;

  const report = data?.data;
  const firstName = titleCase(user?.name?.split(" ")[0]);
  const hasExpenses = report?.allCategories?.length > 0;

  const header = (
    <PageHeader
      title={firstName ? `Hello, ${firstName}` : "Dashboard"}
      description="Here's where your money has gone."
      actions={
        <Link to="/expense-form?method=mpesa">
          <Button variant="secondary" tabIndex={-1}>
            <Upload /> Import M-Pesa
          </Button>
        </Link>
      }
    />
  );

  if (!hasExpenses) {
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={ArrowDownToLine}
            title="Your dashboard is waiting for its first expense"
            description="Add an expense by hand or import an M-Pesa statement to see your spending here."
            action={
              <Link to="/expense-form">
                <Button tabIndex={-1}>
                  <Plus /> Add expense
                </Button>
              </Link>
            }
          />
        </Card>
      </>
    );
  }

  return (
    <>
      {header}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total spent" icon={CreditCard} value={formatKES(report?.totalExpense?.[0]?.total)} />
        <StatCard label="Debt repayments" icon={Landmark} value={formatKES(report?.debtAmount?.[0]?.debt)} />
        <StatCard
          label="Most frequent"
          icon={Tag}
          value={categoryLabel(report?.topCategory?.[0]?.category)}
          valueClassName="whitespace-normal text-base leading-6 sm:text-lg sm:leading-8"
        />
        <StatCard
          label="Least frequent"
          icon={Tag}
          value={categoryLabel(report?.lastCategory?.[0]?.category)}
          valueClassName="whitespace-normal text-base leading-6 sm:text-lg sm:leading-8"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Monthly spending" description="Last 12 months, in KES" />
          <CardContent>
            <div className="h-72">
              <MonthlyChart data={report?.monthlySum} />
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Spending by category" description="Largest first" />
          <CardContent>
            <CategoryBars items={report?.allCategories} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ExpenseMiniTable title="First five expenses" description="Your earliest records" rows={report?.topFive} />
        <ExpenseMiniTable title="Latest five expenses" description="Your newest records" rows={report?.bottomFive} />
      </div>
    </>
  );
};

export default Dashboard;
