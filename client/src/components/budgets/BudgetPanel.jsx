import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ArrowsLeftRight, PencilSimple, Pause, Play, Trash, X } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { CategoryIcon, MerchantTile } from "@/components/ui/category";
import { Separator } from "@/components/ui/separator";
import { bestSource, movableBudgets, periodLabel } from "@/lib/budgets";
import { categoryLabel } from "@/lib/categories";
import { displayName, monthLabel } from "@/lib/dashboard";
import { formatDate, formatKES, parseItems, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const SCOPE_NOTES = { month: "this month only", forward: "from then on", move: "moved between budgets" };

const History = ({ history }) => {
  const highest = Math.max(...history.flatMap((row) => [row.spent, row.limit]), 1);
  return (
    <ul className="flex h-24 items-end gap-1.5" aria-label="Spending in the last 6 months">
      {history.map(({ month, spent, limit }, index) => (
        <li key={month} className="flex h-full flex-1 flex-col justify-end gap-1" title={`${monthLabel(month, "long")}: ${formatKES(spent)}`}>
          <span
            className={cn(
              "block min-h-0.5 rounded-t-sm",
              spent > limit ? "bg-danger" : index === history.length - 1 ? "bg-primary" : "bg-primary/35"
            )}
            style={{ height: `${(spent / highest) * 72}px` }}
          />
          <span className="text-center text-[11px] text-muted-foreground">{monthLabel(month)}</span>
        </li>
      ))}
    </ul>
  );
};

const plannedVsActual = (budget) => {
  const planned = parseItems(budget.subcategories);
  const actual = new Map();
  budget.expenses.forEach((expense) => {
    const items = parseItems(expense.subcategories);
    (items.length ? items : [{ name: displayName(expense), amount: expense.amount }]).forEach(({ name, amount }) => {
      const key = name.trim().toLowerCase();
      actual.set(key, (actual.get(key) ?? 0) + Number(amount));
    });
  });

  const rows = planned.map(({ name, amount }) => {
    const key = name.trim().toLowerCase();
    const spent = actual.get(key) ?? 0;
    actual.delete(key);
    return { name, planned: Number(amount), spent };
  });
  const other = [...actual.values()].reduce((sum, value) => sum + value, 0);
  return other > 0 ? [...rows, { name: "Everything else", planned: 0, spent: other }] : rows;
};

const BudgetPanel = ({ budget, budgets, onClose, onChanged, onDelete, onEdit, onLimit, onMove, inSheet }) => {
  const items = plannedVsActual(budget);
  const paused = budget.status === "inactive";
  const live = ["active", "exceeded"].includes(budget.status);
  const over = budget.spent > budget.limit;
  const source = bestSource(budgets, budget);
  const canMove = live && budget.period === "monthly" && movableBudgets(budgets).length > 1;

  const togglePause = useMutation({
    mutationFn: async () =>
      await axiosInstance.patch(`/budget/${budget.budget_id}/status`, { paused: !paused }),
    onSuccess: (response) => {
      toast.success(response.data.message);
      onChanged();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Could not change this budget."),
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-border p-3 pr-10 lg:pr-3">
        <CategoryIcon category={budget.category} className="size-6" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{titleCase(budget.name)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {budget.name === categoryLabel(budget.category).toLowerCase() ? periodLabel(budget.period) : `${categoryLabel(budget.category)} · ${periodLabel(budget.period)}`}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="size-7" aria-label="Edit budget" onClick={() => onEdit(budget)}>
          <PencilSimple />
        </Button>
        {!inSheet && (
          <Button variant="ghost" size="icon" className="size-7" aria-label="Close details" onClick={onClose}>
            <X />
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-4 p-4">
        <div>
          <p className="text-xs text-muted-foreground">Limit</p>
          <p className="text-lg font-semibold tracking-tight tabular-nums">{formatKES(budget.limit)}</p>
          {budget.carried > 0 && (
            <p className="text-xs text-muted-foreground tabular-nums">Includes {formatKES(budget.carried)} carried over</p>
          )}
          {budget.committed > 0 && (
            <p className="text-xs text-muted-foreground tabular-nums">{formatKES(budget.committed)} already committed to bills</p>
          )}
        </div>

        {live && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => onLimit(budget)}>
              Change limit
            </Button>
            {canMove && (
              <Button variant="secondary" size="sm" onClick={() => onMove({ to: budget })}>
                <ArrowsLeftRight /> Move money
              </Button>
            )}
          </div>
        )}

        {over && canMove && source && (
          <p className="rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground tabular-nums">
            {titleCase(source.name)} has {formatKES(source.limit - source.spent)} spare.{" "}
            <button
              type="button"
              className="font-medium underline"
              onClick={() =>
                onMove({
                  to: budget,
                  from: source,
                  amount: Math.min(Math.ceil(budget.spent - budget.limit), Math.floor(source.limit - source.spent)),
                })
              }
            >
              Move it here
            </button>
          </p>
        )}

        <div>
          <p className="mb-2 text-xs text-muted-foreground">Last 6 months</p>
          <History history={budget.history} />
        </div>

        {budget.changes?.length > 0 && (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Limit changes</p>
            <ul className="space-y-1 text-xs tabular-nums">
              {budget.changes.map((change, index) => (
                <li key={index} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{formatDate(change.date)}</span>
                  <span className="text-right">
                    {formatKES(change.from)} to {formatKES(change.to)}, {SCOPE_NOTES[change.scope]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        {items.length > 0 && (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Planned against actual</p>
            <ul className="text-sm">
              {items.map(({ name, planned, spent }) => (
                <li key={name} className="flex justify-between gap-3 py-1">
                  <span className="min-w-0 truncate">{name}</span>
                  <span className="shrink-0 tabular-nums">
                    <span className={cn("font-medium", planned > 0 && spent > planned && "text-danger")}>
                      {formatKES(spent)}
                    </span>
                    {planned > 0 && <span className="text-xs text-muted-foreground"> / {formatKES(planned)}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="mb-1 text-xs text-muted-foreground">
            {budget.expenses.length} {budget.expenses.length === 1 ? "expense" : "expenses"} in this budget
          </p>
          <ul className="space-y-1.5">
            {budget.expenses.slice(0, 8).map((expense) => (
              <li key={expense.expense_id} className="flex items-center gap-2 text-sm">
                <MerchantTile name={displayName(expense)} className="size-7 rounded-md text-[11px]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{displayName(expense)}</span>
                  <span className="block text-xs text-muted-foreground">{formatDate(expense.date)}</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">{formatKES(expense.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card p-3">
        <Button variant="danger-ghost" onClick={() => onDelete(budget)}>
          <Trash /> Delete
        </Button>
        {budget.status !== "expired" && (
          <Button variant="secondary" className="flex-1" loading={togglePause.isPending} onClick={() => togglePause.mutate()}>
            {paused ? <Play /> : <Pause />}
            {paused ? "Resume" : "Pause"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default BudgetPanel;
