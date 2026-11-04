import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { DotsThree, PiggyBank, Plus } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { MoveDialog, UpdateBalanceDialog } from "@/components/accounts/AccountDialogs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKES } from "@/lib/format";
import { goalAdvice } from "@/lib/goals";
import { refreshMoneyData } from "@/lib/refresh";
import { GoalProgress, GoalState } from "./GoalBits";
import { GoalDialog, GoalMoneyDialog } from "./GoalDialogs";

const GoalCard = ({ goal, onAction }) => {
  const reached = goal.state === "reached";
  return (
    <Card className="flex flex-col gap-2 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{goal.name}</p>
          <GoalState state={goal.state} />
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7" aria-label={`Actions for ${goal.name}`}>
              <DotsThree />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onAction("edit")}>Edit</DropdownMenuItem>
            {!goal.accountId && goal.saved > 0 && <DropdownMenuItem onSelect={() => onAction("take")}>Take money out</DropdownMenuItem>}
            <DropdownMenuItem onSelect={() => onAction("archive")}>Archive</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("delete")}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-sm tabular-nums">
        <span className="text-xl font-semibold tracking-tight sm:text-2xl">{formatKES(goal.saved)}</span>
        <span className="text-muted-foreground"> of {formatKES(goal.target)}</span>
      </p>
      <GoalProgress goal={goal} />
      <p className="text-xs text-muted-foreground tabular-nums">
        {goalAdvice(goal)}
        {goal.accountName && ` Kept in ${goal.accountName}.`}
      </p>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
        {reached ? (
          <>
            <Button size="sm" onClick={() => onAction("archive")}>
              Archive
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onAction("edit")}>
              New target
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="secondary" onClick={() => onAction("add")}>
              <Plus /> Add money
            </Button>
            {goal.state === "late" && (
              <Button size="sm" variant="ghost" onClick={() => onAction("edit")}>
                New date
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

const GoalsSection = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const section = useRef(null);
  const [dialog, setDialog] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const close = () => setDialog(null);

  const { data, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => (await axiosInstance.get("/goals")).data,
  });

  useEffect(() => {
    if (data && location.hash === "#goals") section.current?.scrollIntoView({ block: "start" });
  }, [data, location.hash]);

  const act = useMutation({
    mutationFn: async ({ method = "post", path }) => await axiosInstance[method](path),
    onSuccess: ({ data: result }) => {
      toast.success(result.message);
      setDeleting(null);
      refreshMoneyData(queryClient);
    },
    onError: (failure) => toast.error(failure.response?.data?.message || "This could not be saved."),
  });

  if (isLoading) return <Skeleton className="h-40 rounded-xl" />;
  if (!data) return null;
  const { goals, accounts } = data;
  const accountOf = (goal) => accounts.find((account) => account.id === goal.accountId);

  // Money kept in an account is added by recording a move into it.
  const addMoney = (goal) => {
    const account = accountOf(goal);
    if (!account) return setDialog({ type: "money", goal, direction: "add" });
    const from = accounts.find((row) => row.id !== account.id && row.spendable);
    if (!from) return setDialog({ type: "balance", account });
    setDialog({ type: "move", preset: { fromId: from.id, toId: account.id, amount: goal.weekly ?? "" } });
  };

  const onAction = (goal) => (action) => {
    if (action === "add") return addMoney(goal);
    if (action === "take") return setDialog({ type: "money", goal, direction: "take" });
    if (action === "edit") return setDialog({ type: "edit", goal });
    if (action === "archive") return act.mutate({ path: `/goals/${goal.id}/archive` });
    if (action === "delete") return setDeleting(goal);
  };

  return (
    <section ref={section} id="goals" className="scroll-mt-20 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div>
          <h2 className="text-base font-semibold">Savings goals</h2>
          <p className="text-xs text-muted-foreground">Money you're putting aside for something.</p>
        </div>
        {goals.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => setDialog({ type: "new" })}>
            <Plus /> New goal
          </Button>
        )}
      </div>

      {goals.length === 0 ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <PiggyBank className="size-6 shrink-0 text-primary" aria-hidden />
            <p className="text-sm">
              Saving for school fees, rent or a phone? Set a goal and we'll tell you what to put aside each week.
            </p>
          </div>
          <Button onClick={() => setDialog({ type: "new" })}>Set a goal</Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onAction={onAction(goal)} />
          ))}
        </div>
      )}

      {dialog?.type === "new" && <GoalDialog accounts={accounts} onClose={close} />}
      {dialog?.type === "edit" && <GoalDialog goal={dialog.goal} accounts={accounts} onClose={close} />}
      {dialog?.type === "money" && <GoalMoneyDialog goal={dialog.goal} direction={dialog.direction} onClose={close} />}
      {dialog?.type === "move" && <MoveDialog accounts={accounts} preset={dialog.preset} onClose={close} />}
      {dialog?.type === "balance" && <UpdateBalanceDialog account={dialog.account} onClose={close} />}

      <ConfirmDelete
        open={!!deleting}
        title={`Delete ${deleting?.name}?`}
        description="The goal and what you recorded for it are removed. Your accounts don't change."
        confirmLabel="Delete goal"
        loading={act.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => act.mutate({ method: "delete", path: `/goals/${deleting.id}` })}
      />
    </section>
  );
};

export default GoalsSection;
