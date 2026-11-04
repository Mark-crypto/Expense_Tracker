import { useState } from "react";
import { Field, Input, Label } from "@/components/ui/field";
import { MoneyInput, Shell } from "@/components/accounts/AccountDialogs";
import { chipStyles, useSave } from "@/components/accounts/dialogKit";
import AccountChips from "@/components/accounts/AccountChips";
import { formatKES, localToday } from "@/lib/format";
import { weeklyFor } from "@/lib/goals";

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toLocaleDateString("en-CA");
};

// Only money kept out of Safe to spend can hold a goal, so it isn't counted twice.
export const GoalDialog = ({ goal, accounts, onClose }) => {
  const save = useSave(onClose);
  const places = accounts.filter((account) => !account.spendable || account.id === goal?.accountId);
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal?.target ?? "");
  const [dueDate, setDueDate] = useState(goal?.dueDate ?? "");
  const [accountId, setAccountId] = useState(goal?.accountId ?? null);
  const [saved, setSaved] = useState("");

  const already = goal ? goal.saved : accountId ? places.find((account) => account.id === accountId)?.balance ?? 0 : Number(saved) || 0;
  const weekly = weeklyFor(Number(target) || 0, already, dueDate, localToday());

  return (
    <Shell
      title={goal ? `Edit ${goal.name}` : "New savings goal"}
      description={goal ? "Changing the amount or date starts the plan again from what you've saved." : "Name it, set the amount, and we'll work out what to put aside each week."}
      label={goal ? "Save changes" : "Add goal"}
      pending={save.isPending}
      onClose={onClose}
      onSubmit={() =>
        save.mutate({
          method: goal ? "patch" : "post",
          path: goal ? `/goals/${goal.id}` : "/goals",
          body: {
            name,
            target: Number(target),
            dueDate: dueDate || null,
            accountId,
            ...(goal ? {} : { saved: accountId ? null : Number(saved) || 0 }),
          },
        })
      }
    >
      <Field label="What are you saving for?" htmlFor="goalName">
        <Input id="goalName" required maxLength={60} autoComplete="off" placeholder="School fees, rent deposit" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <MoneyInput id="goalTarget" label="Amount (KES)" value={target} onChange={setTarget} min="1" />
      <Field label="By when?" htmlFor="goalDate" hint="Leave it empty for an open goal, like an emergency fund.">
        <Input id="goalDate" type="date" min={tomorrow()} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </Field>

      {places.length > 0 && (
        <div className="space-y-1.5">
          <Label>Where is the money kept?</Label>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" aria-pressed={accountId === null} className={chipStyles(accountId === null)} onClick={() => setAccountId(null)}>
              With my spending money
            </button>
            <AccountChips accounts={places} value={accountId} onChange={setAccountId} label="Kept in" />
          </div>
          <p className="text-xs text-muted-foreground">
            {accountId
              ? "The account's balance counts towards the goal."
              : "We'll keep it out of Safe to spend so you don't spend it by mistake."}
          </p>
        </div>
      )}

      {!goal && !accountId && (
        <MoneyInput id="goalSaved" label="Already set aside (KES)" value={saved} onChange={setSaved} min="0" required={false} placeholder="0" />
      )}

      {weekly && (
        <p role="status" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground tabular-nums">
          That's {formatKES(weekly)} a week.
        </p>
      )}
    </Shell>
  );
};

export const GoalMoneyDialog = ({ goal, direction, onClose }) => {
  const save = useSave(onClose);
  const taking = direction === "take";
  const [amount, setAmount] = useState(!taking && goal.weekly ? Math.min(goal.weekly, goal.remaining) : "");

  return (
    <Shell
      title={taking ? `Take money out of ${goal.name}` : `Add to ${goal.name}`}
      description={taking ? `${formatKES(goal.saved)} is set aside.` : "Record money you've put aside for this goal."}
      label={taking ? "Take out" : "Add money"}
      pending={save.isPending}
      onClose={onClose}
      onSubmit={() => save.mutate({ path: `/goals/${goal.id}/money`, body: { amount: Number(amount), direction } })}
    >
      <MoneyInput id="goalAmount" label="Amount (KES)" value={amount} onChange={setAmount} min="1" max={taking ? goal.saved : undefined} />
      {!taking && goal.remaining > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[goal.weekly, goal.remaining]
            .filter((value, index, all) => value && all.indexOf(value) === index && value <= goal.remaining)
            .map((value) => (
              <button key={value} type="button" className={chipStyles(Number(amount) === value)} onClick={() => setAmount(value)}>
                {value === goal.remaining ? `All ${formatKES(value)} left` : `This week's ${formatKES(value)}`}
              </button>
            ))}
        </div>
      )}
    </Shell>
  );
};
