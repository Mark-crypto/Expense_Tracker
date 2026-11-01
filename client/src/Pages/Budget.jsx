import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { CaretLeft, CaretRight, MagnifyingGlass, Plus, Rows, Wallet } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import BudgetCard, { PaceBar } from "@/components/budgets/BudgetCard";
import BudgetPanel from "@/components/budgets/BudgetPanel";
import BudgetForm from "@/components/BudgetForm";
import DownloadButton from "@/components/DownloadButton";
import AnimatedAmount from "@/components/dashboard/AnimatedAmount";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryIcon, categoryColor } from "@/components/ui/category";
import { EmptyState, ErrorState } from "@/components/ui/common";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { Input } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { budgetProgress, budgetState, riskOf, shiftMonth } from "@/lib/budgets";
import { categoryLabel } from "@/lib/categories";
import { monthKey, monthLabel } from "@/lib/dashboard";
import { compactNumber, formatKES, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS = [
  ["active", "Active"],
  ["over", "Over"],
  ["paused", "Paused"],
  ["ended", "Ended"],
];

const SORTS = {
  risk: ["Most at risk", (a, b) => riskOf(b, b.progress) - riskOf(a, a.progress)],
  left: ["Least left", (a, b) => a.progress.left - b.progress.left],
  name: ["Name", (a, b) => a.name.localeCompare(b.name)],
};

const inTab = (tab, { status, state }) => {
  if (tab === "paused") return status === "inactive";
  if (tab === "ended") return status === "expired";
  if (tab === "over") return state.key === "over";
  return status === "active" || status === "exceeded";
};

const useIsWide = () => {
  const query = "(min-width: 1120px)";
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setWide(list.matches);
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, []);
  return wide;
};

const Budget = () => {
  const queryClient = useQueryClient();
  const wide = useIsWide();
  const thisMonth = useMemo(() => monthKey(new Date()), []);
  const [month, setMonth] = useState(thisMonth);
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("risk");
  const [compact, setCompact] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [creating, setCreating] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["budgets", "overview", month],
    queryFn: async () => (await axiosInstance.get(`/budgets/overview?month=${month}`)).data,
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    ["budgets", "dashboard-overview", "limit-notification"].forEach((queryKey) =>
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    );
  };

  const removeBudget = useMutation({
    mutationFn: async (id) => await axiosInstance.delete(`/budget/${id}`),
    onSuccess: (response) => {
      toast.success(response.data.message);
      setToDelete(null);
      setActiveId(null);
      refresh();
    },
    onError: () => toast.error("Could not delete this budget."),
  });

  const budgets = useMemo(
    () =>
      (data?.budgets ?? []).map((budget) => {
        const progress = budgetProgress(budget, data.month);
        return { ...budget, progress, state: budgetState(budget, progress) };
      }),
    [data]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  if (error) return <ErrorState onRetry={refetch} />;

  const live = budgets.filter((budget) => inTab("active", budget));
  const totalLimit = live.reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = live.reduce((sum, budget) => sum + budget.spent, 0);
  const totalLeft = totalLimit - totalSpent;
  const running = live.find((budget) => budget.progress.running && !budget.has_time_limit);
  const daysLeft = running?.progress.daysLeft ?? 0;
  const elapsed = running?.progress.elapsed ?? 1;

  const visible = budgets
    .filter((budget) => inTab(tab, budget))
    .filter((budget) => `${budget.name} ${categoryLabel(budget.category)}`.toLowerCase().includes(search.toLowerCase()))
    .sort(SORTS[sort][1]);

  const active = budgets.find((budget) => budget.budget_id === activeId);
  const showSide = active && wide;

  const panelProps = active && {
    budget: active,
    onClose: () => setActiveId(null),
    onChanged: refresh,
    onDelete: setToDelete,
  };

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <h1 className="mr-2 text-xl">Budgets</h1>
          <Button variant="ghost" size="icon" className="size-7" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}>
            <CaretLeft />
          </Button>
          <span className="min-w-20 text-center text-sm font-medium">{monthLabel(month, "long")}</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Next month"
            disabled={month >= thisMonth}
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            <CaretRight />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <DownloadButton endpoint="/budget/report" filename="budget_report.xlsx" label="Export" />
          <Button onClick={() => setCreating({})}>
            <Plus /> New budget
          </Button>
        </div>
      </header>

      {live.length > 0 && (
        <Card className="space-y-3 p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{totalLeft < 0 ? "Over across all budgets" : month < thisMonth ? "Left unspent" : "Left to spend"}</p>
              <p className="flex flex-wrap items-baseline gap-1.5">
                <AnimatedAmount
                  value={Math.abs(totalLeft)}
                  className={cn("text-[28px] leading-tight font-semibold tracking-tight tabular-nums", totalLeft < 0 && "text-danger")}
                />
                <span className="text-sm text-muted-foreground tabular-nums">of {formatKES(totalLimit)}</span>
              </p>
            </div>
            {daysLeft > 0 && totalLeft > 0 && (
              <div className="sm:text-right">
                <p className="text-[15px] font-semibold tracking-tight tabular-nums">{formatKES(totalLeft / daysLeft)} a day</p>
                <p className="text-xs text-muted-foreground">
                  for the next {daysLeft} {daysLeft === 1 ? "day" : "days"}
                </p>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted" role="img" aria-label="Budget used, by budget">
              {live.map((budget) => (
                <span
                  key={budget.budget_id}
                  title={`${titleCase(budget.name)}: ${formatKES(budget.spent)}`}
                  className="h-full transition-[width] duration-700 motion-reduce:transition-none"
                  style={{
                    width: `${(budget.spent / Math.max(totalLimit, totalSpent, 1)) * 100}%`,
                    background: categoryColor(budget.category),
                  }}
                />
              ))}
            </div>
            {daysLeft > 0 && (
              <span
                title="Today"
                className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-foreground"
                style={{ left: `${elapsed * 100}%` }}
              />
            )}
          </div>

          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {live.map((budget) => (
              <li key={budget.budget_id} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: categoryColor(budget.category) }} />
                {titleCase(budget.name)}
                <span className="font-medium text-foreground tabular-nums">{compactNumber(budget.spent)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList variant="line" className="h-auto gap-4 p-0">
            {TABS.map(([id, label]) => (
              <TabsTrigger key={id} value={id} className="flex-none px-0 pb-1 text-sm">
                {label}
                <span className="ml-1 rounded bg-muted px-1 text-[11px] text-muted-foreground tabular-nums">
                  {budgets.filter((budget) => inTab(id, budget)).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <span className="flex-1" />
        <div className="relative w-full sm:w-52">
          <MagnifyingGlass className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            aria-label="Search budgets"
            placeholder="Search budgets"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger aria-label="Sort budgets" size="sm" className="w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORTS).map(([value, [label]]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="secondary"
          size="sm"
          className={cn(compact && "bg-accent text-accent-foreground")}
          aria-pressed={compact}
          onClick={() => setCompact((value) => !value)}
        >
          <Rows /> Compact
        </Button>
      </div>

      <div className={cn("grid items-start gap-3", showSide && "grid-cols-[minmax(0,1fr)_21rem]")}>
        {visible.length === 0 ? (
          <Card>
            <EmptyState
              icon={Wallet}
              title={budgets.length === 0 ? "No budgets yet" : "Nothing here"}
              description={budgets.length === 0 ? "Create a budget and matching expenses count toward it automatically." : undefined}
              action={
                budgets.length === 0 && (
                  <Button onClick={() => setCreating({})}>
                    <Plus /> New budget
                  </Button>
                )
              }
            />
          </Card>
        ) : (
          <div className={cn("grid gap-3", !showSide && "md:grid-cols-2", compact && !showSide && "xl:grid-cols-3")}>
            {visible.map((budget) => (
              <BudgetCard
                key={budget.budget_id}
                budget={budget}
                progress={budget.progress}
                state={budget.state}
                compact={compact}
                active={budget.budget_id === activeId}
                onOpen={(id) => setActiveId(id === activeId ? null : id)}
              />
            ))}
          </div>
        )}

        {showSide && (
          <Card className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto">
            <BudgetPanel key={`${active.budget_id}-${active.limit}`} {...panelProps} />
          </Card>
        )}
      </div>

      {data.unbudgeted.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm">Not budgeted</h2>
          <p className="mb-2.5 text-xs text-muted-foreground">
            Spending in {monthLabel(month, "long")} with no limit. Select one to create a budget.
          </p>
          <div className="flex flex-wrap gap-2">
            {data.unbudgeted.map(({ category, total }) => (
              <button
                key={category}
                type="button"
                onClick={() => setCreating({ category })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-input hover:bg-muted"
              >
                <CategoryIcon category={category} />
                {categoryLabel(category)}
                <span className="text-muted-foreground tabular-nums">{formatKES(total)}</span>
                <Plus className="size-3 text-muted-foreground" aria-hidden />
              </button>
            ))}
          </div>
        </Card>
      )}

      {active && !wide && (
        <Sheet open onClose={() => setActiveId(null)} title={titleCase(active.name)}>
          <BudgetPanel key={`${active.budget_id}-${active.limit}`} {...panelProps} inSheet />
        </Sheet>
      )}

      <Sheet open={!!creating} onClose={() => setCreating(null)} title="New budget">
        <div className="p-5">
          <h2 className="mb-4 text-lg">New budget</h2>
          {creating && (
            <BudgetForm
              category={creating.category}
              onCreated={() => {
                setCreating(null);
                refresh();
              }}
            />
          )}
        </div>
      </Sheet>

      <ConfirmDelete
        open={!!toDelete}
        title={`Delete ${titleCase(toDelete?.name)}?`}
        description="The budget is removed. Your expenses stay, and they'll no longer count toward it."
        confirmLabel="Delete budget"
        loading={removeBudget.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => removeBudget.mutate(toDelete.budget_id)}
      />
    </div>
  );
};

export default Budget;
