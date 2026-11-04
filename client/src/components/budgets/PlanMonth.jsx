import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { WarningCircle } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category";
import { ErrorState, Notice } from "@/components/ui/common";
import { Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryLabel } from "@/lib/categories";
import { formatKES } from "@/lib/format";

const hintFor = ({ average, bills }) => {
  const usual = average > 0 ? `Usually ${formatKES(average)}` : "New";
  return bills > 0 ? `${usual}, ${formatKES(bills)} in bills` : usual;
};

const Planner = ({ plan, onDone }) => {
  const queryClient = useQueryClient();
  const rows = plan.rows.filter((row) => row.period === "monthly");
  const [amounts, setAmounts] = useState(() =>
    Object.fromEntries(rows.map((row) => [row.category, row.current ?? row.suggested ?? ""]))
  );
  const set = (category, value) => setAmounts((previous) => ({ ...previous, [category]: value }));
  const fillFrom = (pick) => setAmounts(Object.fromEntries(rows.map((row) => [row.category, pick(row) ?? ""])));

  const assigned = rows.reduce((sum, row) => sum + (Number(amounts[row.category]) || 0), 0);
  const left = plan.income === null ? null : plan.income - plan.billsOutside - assigned;
  const hasLastMonth = rows.some((row) => row.lastMonth);

  const save = useMutation({
    mutationFn: async () =>
      await axiosInstance.post("/budgets/plan", {
        rows: rows
          .filter((row) => Number(amounts[row.category]) > 0)
          .map((row) => ({
            category: row.category,
            name: categoryLabel(row.category).toLowerCase(),
            amount: Number(amounts[row.category]),
          })),
      }),
    onSuccess: ({ data }) => {
      toast.success(data.message);
      ["budgets", "dashboard-overview", "limit-notification", "forecast"].forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      );
      onDone();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Your plan could not be saved."),
  });

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Add some spending or a budget first, and we'll suggest your plan here.</p>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        <Button variant="secondary" size="sm" onClick={() => fillFrom((row) => row.suggested)}>
          Use suggestions
        </Button>
        {hasLastMonth && (
          <Button variant="secondary" size="sm" onClick={() => fillFrom((row) => row.lastMonth ?? row.current)}>
            Copy last month
          </Button>
        )}
      </div>

      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li key={row.category} className="flex items-center gap-3 py-2">
            <CategoryIcon category={row.category} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{categoryLabel(row.category)}</p>
              <p className="truncate text-xs text-muted-foreground tabular-nums">{hintFor(row)}</p>
            </div>
            <Input
              aria-label={`Limit for ${categoryLabel(row.category)}`}
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="0"
              className="h-9 w-28 shrink-0 text-right tabular-nums"
              value={amounts[row.category]}
              onChange={(e) => set(row.category, e.target.value)}
            />
          </li>
        ))}
      </ul>

      <div className="sticky bottom-0 mt-auto space-y-2 border-t border-border bg-card pt-3">
        {left === null ? (
          <p className="text-sm tabular-nums">
            <span className="font-semibold">{formatKES(assigned)}</span>
            <span className="ml-1 text-muted-foreground">planned</span>
          </p>
        ) : (
          <div className="space-y-0.5 text-sm tabular-nums">
            <p className="flex justify-between text-muted-foreground">
              <span>Usual money in</span>
              <span>{formatKES(plan.income)}</span>
            </p>
            {plan.billsOutside > 0 && (
              <p className="flex justify-between text-muted-foreground">
                <span>Bills outside these budgets</span>
                <span>−{formatKES(plan.billsOutside)}</span>
              </p>
            )}
            <p className="flex justify-between text-muted-foreground">
              <span>Planned</span>
              <span>−{formatKES(assigned)}</span>
            </p>
            <p className="flex justify-between font-semibold">
              <span>{left < 0 ? "Over what you earn" : "Left to assign"}</span>
              <span className={left < 0 ? "text-danger" : undefined}>{formatKES(Math.abs(left))}</span>
            </p>
          </div>
        )}
        {left !== null && left < 0 && (
          <Notice tone="warning" icon={WarningCircle} className="p-2.5 text-xs">
            This plan is more than you usually bring in.
          </Notice>
        )}
        <Button className="w-full" loading={save.isPending} disabled={assigned <= 0} onClick={() => save.mutate()}>
          Approve plan
        </Button>
      </div>
    </div>
  );
};

const PlanMonth = ({ onDone }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["budgets", "plan"],
    queryFn: async () => (await axiosInstance.get("/budgets/plan")).data,
    gcTime: 0,
  });

  return (
    <div className="flex min-h-full flex-col gap-4 p-5">
      <div className="pr-8">
        <h2 className="text-lg">Plan my month</h2>
        <p className="text-xs text-muted-foreground">Suggestions come from your last three full months. Changes apply from now on.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-80 w-full rounded-xl" />
      ) : error ? (
        <ErrorState message="We couldn't load your plan." onRetry={refetch} />
      ) : (
        <Planner plan={data} onDone={onDone} />
      )}
    </div>
  );
};

export default PlanMonth;
