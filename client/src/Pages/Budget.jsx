import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Bell, CalendarPlus, CaretLeft, CaretRight, Export, MagnifyingGlass, Plus, Rows, Wallet, WarningCircle } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import BudgetCard from "@/components/budgets/BudgetCard";
import { AlertSettingsDialog, LimitDialog, MoveMoneyDialog } from "@/components/budgets/BudgetDialogs";
import MonthReview from "@/components/budgets/MonthReview";
import PlanMonth from "@/components/budgets/PlanMonth";
import BudgetPanel from "@/components/budgets/BudgetPanel";
import BudgetForm from "@/components/BudgetForm";
import ExportDialog from "@/components/ExportDialog";
import AnimatedAmount from "@/components/dashboard/AnimatedAmount";
import { SubPage } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryIcon, categoryColor } from "@/components/ui/category";
import { EmptyState, ErrorState, Notice } from "@/components/ui/common";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { Input } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { budgetProgress, budgetState, riskOf, shiftMonth } from "@/lib/budgets";
import { categoryLabel } from "@/lib/categories";
import { monthKey, monthLabel } from "@/lib/dashboard";
import { compactNumber, formatKES, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePageTour } from "@/lib/usePageTour";

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

const REVIEW_DAYS = 7;

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
  const navigate = useNavigate();
  const { pathname, state: routeState } = useLocation();
  const { id } = useParams();
  // Each budget, the edit form, New budget and Plan my month have their own address.
  const activeId = id ? Number(id) : null;
  const view = pathname === "/budget/plan" ? "plan" : pathname === "/budget/new" ? "new" : pathname.endsWith("/edit") ? "edit" : "list";
  const setActiveId = (next) => navigate(next ? `/budget/${next}` : "/budget");
  const setCreating = (value) => navigate("/budget/new", { state: { category: value?.category } });
  const setEditing = (budget) => navigate(`/budget/${budget.budget_id}/edit`);
  const setPlanning = () => navigate("/budget/plan");
  const [changing, setChanging] = useState(null);
  const [moving, setMoving] = useState(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Alerts and emails link straight to a budget or to the alert settings.
  useEffect(() => {
    const opened = Number(searchParams.get("budget"));
    if (searchParams.get("alerts")) setShowAlerts(true);
    if (opened) navigate(`/budget/${opened}`, { replace: true });
    else if (searchParams.get("alerts")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, navigate]);
  const [toDelete, setToDelete] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["budgets", "overview", month],
    queryFn: async () => (await axiosInstance.get(`/budgets/overview?month=${month}`)).data,
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    ["budgets", "dashboard-overview", "limit-notification", "forecast"].forEach((queryKey) =>
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    );
  };

  const removeBudget = useMutation({
    mutationFn: async (id) => await axiosInstance.delete(`/budget/${id}`),
    onSuccess: (response) => {
      toast.success(response.data.message);
      setToDelete(null);
      navigate("/budget");
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

  usePageTour("budgets", !!data);

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

  const stepLimit = (budget, by) => setChanging({ budget, preset: Math.max(budget.baseLimit + by, 1) });
  const panelProps = active && {
    budget: active,
    budgets,
    onEdit: setEditing,
    onLimit: (budget) => setChanging({ budget }),
    onMove: setMoving,
    onClose: () => setActiveId(null),
    onChanged: refresh,
    onDelete: setToDelete,
  };

  const { plan, review, overlaps, alertSettings } = data;
  const dayOfMonth = new Date().getDate();
  const showReview = month < thisMonth || dayOfMonth <= REVIEW_DAYS;
  const reviewChange = ({ budget_id: id, suggestion }) => {
    const budget = budgets.find((row) => row.budget_id === id);
    if (budget) setChanging({ budget, preset: suggestion });
  };

  const budgetsCrumb = { label: "Budgets", to: "/budget" };
  const dialogs = (
    <>
      {changing && <LimitDialog {...changing} onClose={() => setChanging(null)} />}
      {moving && <MoveMoneyDialog {...moving} budgets={budgets} onClose={() => setMoving(null)} />}
      {showAlerts && <AlertSettingsDialog settings={alertSettings} onClose={() => setShowAlerts(false)} />}
      {exporting && (
        <ExportDialog
          months
          title="Export budgets"
          description="Each budget's limit, what was spent and what was left, month by month."
          endpoint="/budget/report"
          filename="budgets"
          onClose={() => setExporting(false)}
        />
      )}
      <ConfirmDelete
        open={!!toDelete}
        title={`Delete ${titleCase(toDelete?.name)}?`}
        description="The budget is removed. Your expenses stay, and they'll no longer count toward it."
        confirmLabel="Delete budget"
        loading={removeBudget.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => removeBudget.mutate(toDelete.budget_id)}
      />
    </>
  );

  if (view === "plan") {
    return (
      <SubPage crumbs={[budgetsCrumb, { label: "Plan my month" }]}>
        <Card className="overflow-hidden p-0">
          <PlanMonth onDone={() => navigate("/budget")} />
        </Card>
      </SubPage>
    );
  }

  if (view === "new") {
    return (
      <SubPage crumbs={[budgetsCrumb, { label: "New budget" }]} title="New budget">
        <Card className="p-4 sm:p-5">
          <BudgetForm
            category={routeState?.category}
            onCreated={() => {
              refresh();
              navigate("/budget");
            }}
          />
        </Card>
      </SubPage>
    );
  }

  if (view === "edit") {
    const editing = budgets.find((budget) => budget.budget_id === activeId);
    return (
      <SubPage
        crumbs={[budgetsCrumb, ...(editing ? [{ label: titleCase(editing.name), to: `/budget/${editing.budget_id}` }] : []), { label: "Edit" }]}
        title="Edit budget"
      >
        <Card className="p-4 sm:p-5">
          {editing ? (
            <BudgetForm key={editing.budget_id} budget={editing} onCreated={() => navigate(`/budget/${editing.budget_id}`)} />
          ) : (
            <p className="text-sm text-muted-foreground">This budget wasn't found in {monthLabel(month, "long")}.</p>
          )}
        </Card>
      </SubPage>
    );
  }

  // On narrower screens a budget opens as its own page; wide screens show it beside the list.
  if (active && !wide) {
    return (
      <SubPage crumbs={[budgetsCrumb, { label: titleCase(active.name) }]}>
        <Card className="overflow-hidden p-0">
          <BudgetPanel key={`${active.budget_id}-${active.limit}`} {...panelProps} inSheet />
        </Card>
        {dialogs}
      </SubPage>
    );
  }

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
          <Button variant="secondary" data-tour="budget-alerts" onClick={() => setShowAlerts(true)}>
            <Bell /> Alerts
          </Button>
          <Button variant="secondary" onClick={() => setExporting(true)}>
            <Export /> Export
          </Button>
          <Button variant="secondary" data-tour="budget-plan" onClick={() => setPlanning(true)}>
            <CalendarPlus /> Plan my month
          </Button>
          <Button onClick={() => setCreating({})}>
            <Plus /> New budget
          </Button>
        </div>
      </header>

      {overlaps.map(({ category, budgets: clashing }) => (
        <Notice key={category} tone="warning" icon={WarningCircle}>
          <p>
            {clashing.map((row) => titleCase(row.name)).join(" and ")} both cover {categoryLabel(category)}, so spending only counts toward the newest.
            Keep one and pause the others.
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {clashing.map((row) => (
              <Button key={row.budget_id} variant="secondary" size="sm" onClick={() => setActiveId(row.budget_id)}>
                Open {titleCase(row.name)}
              </Button>
            ))}
          </div>
        </Notice>
      ))}

      {showReview && <MonthReview review={review} canDismiss={month === thisMonth} onUse={reviewChange} />}

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

          {month === thisMonth && plan.income !== null && (
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 border-t border-border pt-3 text-xs text-muted-foreground tabular-nums">
              <span>About {formatKES(plan.income)} comes in</span>
              <span>· {formatKES(plan.budgeted)} in budgets</span>
              {plan.billsOutside > 0 && <span>· {formatKES(plan.billsOutside)} in other bills</span>}
              <span className={cn("font-medium", plan.unassigned < 0 ? "text-danger" : "text-foreground")}>
                · {plan.unassigned < 0 ? `${formatKES(-plan.unassigned)} more than you earn` : `${formatKES(plan.unassigned)} unassigned`}
              </span>
            </p>
          )}
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
                onStep={month === thisMonth ? stepLimit : undefined}
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

      {dialogs}
    </div>
  );
};

export default Budget;
