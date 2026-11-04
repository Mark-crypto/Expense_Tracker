import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ArrowsLeftRight, Bank, DotsThree, LockKey, Plus, Trash } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import {
  AddAccountDialog,
  EditAccountDialog,
  MoneyInDialog,
  MoveDialog,
  UpdateBalanceDialog,
} from "@/components/accounts/AccountDialogs";
import MonthReport from "@/components/accounts/MonthReport";
import GoalsSection from "@/components/goals/GoalsSection";
import PinSuggestion from "@/components/security/PinSuggestion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/common";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { accountColor, balanceNote, dayMonth, signedKES } from "@/lib/accounts";
import { formatKES } from "@/lib/format";
import { refreshMoneyData } from "@/lib/refresh";
import { cn } from "@/lib/utils";
import { usePageTour } from "@/lib/usePageTour";

const AccountCard = ({ account, onUpdate, onEdit, onRemove }) => (
  <Card className="flex flex-col gap-1 p-4 sm:p-5">
    <div className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
        <span className="size-2.5 shrink-0 rounded-sm" style={{ background: accountColor(account.type) }} aria-hidden />
        <span className="truncate">{account.name}</span>
      </span>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7" aria-label={`Actions for ${account.name}`}>
            <DotsThree />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem onSelect={onRemove}>Remove</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <p className={cn("text-xl font-semibold tracking-tight tabular-nums sm:text-2xl", account.balance < 0 && "text-danger")}>
      {signedKES(account.balance)}
    </p>
    <p className="text-xs text-muted-foreground">
      {balanceNote(account)}
      {!account.spendable && " · Not in Safe to spend"}
    </p>
    <div className="pt-2">
      <Button variant="secondary" size="sm" onClick={onUpdate}>
        Update balance
      </Button>
    </div>
  </Card>
);

const Questions = ({ questions, onAnswer, pending }) => (
  <Card>
    <CardHeader
      title={questions.total === 1 ? "Is this a transfer?" : `Are these transfers? (${questions.total})`}
      description="Transfers don't count as spending. We only ask when we can't tell."
    />
    <CardContent className="pt-2">
      <ul className="divide-y divide-border">
        {questions.items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium tabular-nums">
                {formatKES(item.amount)} {item.incoming ? "from" : "to"} {item.name}
              </p>
              <p className="text-xs text-muted-foreground">
                M-Pesa, {dayMonth(item.date)}. {item.reason}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" disabled={pending} onClick={() => onAnswer({ id: item.id, accountId: item.accountId })}>
                Transfer {item.incoming ? "from" : "to"} {item.accountName}
              </Button>
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => onAnswer({ id: item.id })}>
                {item.incoming ? "It's income" : "It's a payment"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const Activity = ({ items, onRemove, pending }) => (
  <Card>
    <CardHeader title="Recorded by you" description="Money in and moves you added. Remove one if it was a mistake." />
    <CardContent className="pt-2">
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.detail}, {dayMonth(item.date)}
              </p>
            </div>
            <span className="flex items-center gap-1">
              <span className="text-sm tabular-nums">{formatKES(item.amount)}</span>
              <Button variant="ghost" size="icon" className="size-7" aria-label={`Remove ${item.title}`} disabled={pending} onClick={() => onRemove(item.path)}>
                <Trash />
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const Accounts = () => {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [removing, setRemoving] = useState(null);
  const close = () => setDialog(null);

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["accounts", month],
    queryFn: async () => (await axiosInstance.get("/accounts", { params: month ? { month } : {} })).data,
    placeholderData: (previous) => previous,
  });

  const act = useMutation({
    mutationFn: async ({ method = "post", path, body }) => await axiosInstance[method](path, body),
    onSuccess: ({ data: result }) => {
      toast.success(result.message);
      setRemoving(null);
      refreshMoneyData(queryClient);
    },
    onError: (failure) => toast.error(failure.response?.data?.message || "This could not be saved."),
  });

  usePageTour("accounts", !!data);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  if (error?.response?.status === 423) {
    return (
      <Card>
        <EmptyState
          icon={LockKey}
          title="Your accounts are locked"
          description="Enter your PIN to see your accounts and balances."
          action={<Button onClick={() => refetch()}>Enter PIN</Button>}
        />
      </Card>
    );
  }
  if (error) return <ErrorState onRetry={refetch} />;

  const { accounts, total, statement, questions, activity, months, report } = data;
  const positive = accounts.filter((account) => account.balance > 0);

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl">Accounts</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Balances you keep up to date. We never connect to your bank or move money.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {accounts.length > 0 && (
            <Button variant="secondary" data-tour="accounts-income" onClick={() => setDialog({ type: "income" })}>
              <Plus /> Money in
            </Button>
          )}
          {accounts.length > 1 && (
            <Button variant="secondary" data-tour="accounts-move" onClick={() => setDialog({ type: "move" })}>
              <ArrowsLeftRight /> Record a move
            </Button>
          )}
          <Button onClick={() => setDialog({ type: "add" })}>
            <Plus /> Add account
          </Button>
        </div>
      </header>

      {accounts.length === 0 ? (
        <>
          <Card>
            <EmptyState
              icon={Bank}
              title="See all your money in one place"
              description="Add M-Pesa, your bank and cash. Expenses then come off the right one, and you can see where your money is going."
              action={<Button onClick={() => setDialog({ type: "add" })}>Add your first account</Button>}
            />
          </Card>
          <GoalsSection />
        </>
      ) : (
        <>
          <Card className="p-4 sm:p-5">
            <p className="text-xs text-muted-foreground">Total across all accounts</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{signedKES(total)}</p>
            {positive.length > 0 && (
              <div className="mt-3 flex h-3 gap-0.5 overflow-hidden rounded-md" aria-hidden>
                {positive.map((account) => (
                  <span key={account.id} style={{ flex: account.balance, background: accountColor(account.type) }} />
                ))}
              </div>
            )}
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onUpdate={() => setDialog({ type: "balance", account })}
                onEdit={() => setDialog({ type: "edit", account })}
                onRemove={() => setRemoving(account)}
              />
            ))}
          </div>

          <PinSuggestion />

          <GoalsSection />

          {questions.total > 0 && (
            <Questions
              questions={questions}
              pending={act.isPending}
              onAnswer={({ id, accountId }) => act.mutate({ path: `/accounts/questions/${id}`, body: { accountId } })}
            />
          )}

          {report && <MonthReport report={report} months={months} onMonth={setMonth} />}

          {activity.length > 0 && (
            <Activity items={activity} pending={act.isPending} onRemove={(path) => act.mutate({ method: "delete", path })} />
          )}
        </>
      )}

      {dialog?.type === "add" && <AddAccountDialog accounts={accounts} statement={statement} onClose={close} />}
      {dialog?.type === "edit" && <EditAccountDialog account={dialog.account} onClose={close} />}
      {dialog?.type === "balance" && <UpdateBalanceDialog account={dialog.account} onClose={close} />}
      {dialog?.type === "income" && <MoneyInDialog accounts={accounts} onClose={close} />}
      {dialog?.type === "move" && <MoveDialog accounts={accounts} onClose={close} />}

      <ConfirmDelete
        open={!!removing}
        title={`Remove ${removing?.name}?`}
        description="Its balance stops being tracked. Your expenses stay."
        confirmLabel="Remove account"
        loading={act.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => act.mutate({ method: "delete", path: `/accounts/${removing.id}` })}
      />
    </div>
  );
};

export default Accounts;
