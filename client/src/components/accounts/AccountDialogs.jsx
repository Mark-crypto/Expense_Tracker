import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckboxCard, Field, Input, Label } from "@/components/ui/field";
import { ACCOUNT_TYPES, dayMonth } from "@/lib/accounts";
import { formatKES, localToday } from "@/lib/format";
import AccountChips from "./AccountChips";
import { chipStyles, useSave } from "./dialogKit";

export const Shell = ({ title, description, onClose, onSubmit, pending, label, children }) => (
  <Dialog open onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {children}
        <Button type="submit" className="w-full" loading={pending}>
          {label}
        </Button>
      </form>
    </DialogContent>
  </Dialog>
);

export const MoneyInput = ({ id, label, value, onChange, hint, ...props }) => (
  <Field label={label} htmlFor={id} hint={hint}>
    <Input
      id={id}
      type="number"
      inputMode="decimal"
      step="0.01"
      required
      className="tabular-nums"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
  </Field>
);

export const AddAccountDialog = ({ accounts, statement, onClose }) => {
  const hasMpesa = accounts.some((account) => account.type === "mpesa");
  const choices = ACCOUNT_TYPES.filter((type) => !(type.value === "mpesa" && hasMpesa));
  const save = useSave(onClose);
  const [type, setType] = useState(choices[0].value);
  const [name, setName] = useState(choices[0].name);
  const [spendable, setSpendable] = useState(true);
  const fromStatement = type === "mpesa" && statement;
  const [balance, setBalance] = useState(!hasMpesa && statement ? statement.balance : "");

  const pick = ({ value, name: suggested }) => {
    setType(value);
    setName(suggested);
    setSpendable(value !== "savings");
    setBalance(value === "mpesa" && statement ? statement.balance : "");
  };

  return (
    <Shell
      title="Add an account"
      description="Add a place you keep money. We never connect to it or ask for its login."
      label="Add account"
      pending={save.isPending}
      onClose={onClose}
      onSubmit={() => save.mutate({ path: "/accounts", body: { name, type, balance: Number(balance), spendable } })}
    >
      <div className="space-y-1.5">
        <Label>Type</Label>
        <div className="flex flex-wrap gap-1.5">
          {choices.map((choice) => (
            <button key={choice.value} type="button" aria-pressed={type === choice.value} className={chipStyles(type === choice.value)} onClick={() => pick(choice)}>
              {choice.label}
            </button>
          ))}
        </div>
      </div>
      <Field label="Name" htmlFor="accountName">
        <Input id="accountName" required maxLength={60} autoComplete="off" placeholder="Equity, Sacco" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <MoneyInput
        id="accountBalance"
        label="Balance now (KES)"
        value={balance}
        onChange={setBalance}
        hint={fromStatement ? `From your statement on ${dayMonth(statement.date)}. Change it if it's moved since.` : undefined}
      />
      <CheckboxCard
        id="accountSpendable"
        title="Count this as money I can spend"
        description="Leave this off for savings you don't want in Safe to spend."
        checked={spendable}
        onChange={(e) => setSpendable(e.target.checked)}
      />
    </Shell>
  );
};

export const EditAccountDialog = ({ account, onClose }) => {
  const save = useSave(onClose);
  const [name, setName] = useState(account.name);
  const [spendable, setSpendable] = useState(account.spendable);

  return (
    <Shell
      title={`Edit ${account.name}`}
      label="Save changes"
      pending={save.isPending}
      onClose={onClose}
      onSubmit={() => save.mutate({ method: "patch", path: `/accounts/${account.id}`, body: { name, spendable } })}
    >
      <Field label="Name" htmlFor="editAccountName">
        <Input id="editAccountName" required maxLength={60} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <CheckboxCard
        id="editAccountSpendable"
        title="Count this as money I can spend"
        checked={spendable}
        onChange={(e) => setSpendable(e.target.checked)}
      />
    </Shell>
  );
};

export const UpdateBalanceDialog = ({ account, onClose }) => {
  const save = useSave(onClose);
  const [balance, setBalance] = useState(account.balance);

  return (
    <Shell
      title={`Update ${account.name}`}
      description={`We have ${formatKES(account.balance)}. Enter what the account shows now.`}
      label="Update balance"
      pending={save.isPending}
      onClose={onClose}
      onSubmit={() => save.mutate({ path: `/accounts/${account.id}/balance`, body: { balance: Number(balance) } })}
    >
      <MoneyInput id="newBalance" label="Balance now (KES)" value={balance} onChange={setBalance} />
    </Shell>
  );
};

export const MoneyInDialog = ({ accounts, onClose }) => {
  const save = useSave(onClose);
  const [accountId, setAccountId] = useState(accounts[0].id);
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState(localToday());

  return (
    <Shell
      title="Record money in"
      description="For money your statement won't show, like a salary paid into your bank."
      label="Record money in"
      pending={save.isPending}
      onClose={onClose}
      onSubmit={() => save.mutate({ path: "/accounts/income", body: { accountId, amount: Number(amount), name, date } })}
    >
      <MoneyInput id="incomeAmount" label="Amount (KES)" value={amount} onChange={setAmount} min="0" />
      <Field label="From" htmlFor="incomeName">
        <Input id="incomeName" required maxLength={150} autoComplete="off" placeholder="Salary, client, side hustle" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="space-y-1.5">
        <Label>Into</Label>
        <AccountChips accounts={accounts} value={accountId} onChange={setAccountId} label="Into" />
      </div>
      <Field label="Date" htmlFor="incomeDate">
        <Input id="incomeDate" type="date" required max={localToday()} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
    </Shell>
  );
};

export const MoveDialog = ({ accounts, preset, onClose }) => {
  const save = useSave(onClose);
  const [fromId, setFromId] = useState(preset?.fromId ?? accounts[0].id);
  const [toId, setToId] = useState(preset?.toId ?? accounts[1].id);
  const [amount, setAmount] = useState(preset?.amount ?? "");
  const [date, setDate] = useState(localToday());

  return (
    <Shell
      title="Record a move"
      description="Records money you've already moved between accounts. We can't move money for you."
      label="Record move"
      pending={save.isPending}
      onClose={onClose}
      onSubmit={() => save.mutate({ path: "/accounts/transfers", body: { fromId, toId, amount: Number(amount), date } })}
    >
      <div className="space-y-1.5">
        <Label>From</Label>
        <AccountChips accounts={accounts} value={fromId} onChange={setFromId} label="From" />
      </div>
      <div className="space-y-1.5">
        <Label>To</Label>
        <AccountChips accounts={accounts} value={toId} onChange={setToId} label="To" />
      </div>
      <MoneyInput id="moveAmount" label="Amount (KES)" value={amount} onChange={setAmount} min="0" />
      <Field label="Date" htmlFor="moveDate">
        <Input id="moveDate" type="date" required max={localToday()} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
    </Shell>
  );
};

export const PaySettingsDialog = ({ settings, onClose }) => {
  const save = useSave(onClose);
  const [payType, setPayType] = useState(settings.payType);
  const [payDay, setPayDay] = useState(settings.payDay ?? "");
  const [buffer, setBuffer] = useState(settings.buffer);

  return (
    <Shell
      title="How Safe to spend works for you"
      description="This sets how far your money has to stretch."
      label="Save"
      pending={save.isPending}
      onClose={onClose}
      onSubmit={() =>
        save.mutate({
          method: "put",
          path: "/accounts/pay-settings",
          body: { payType, payDay: payType === "salary" ? Number(payDay) : null, buffer: Number(buffer) },
        })
      }
    >
      <div className="space-y-1.5">
        <Label>How do you get paid?</Label>
        <div className="flex flex-wrap gap-1.5">
          {[
            ["salary", "Salary, on a set day"],
            ["irregular", "It varies"],
          ].map(([value, label]) => (
            <button key={value} type="button" aria-pressed={payType === value} className={chipStyles(payType === value)} onClick={() => setPayType(value)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {payType === "salary" && (
        <MoneyInput id="payDay" label="Pay day of the month" value={payDay} onChange={setPayDay} min="1" max="31" step="1" />
      )}
      <MoneyInput
        id="safetyBuffer"
        label="Safety buffer (KES)"
        value={buffer}
        onChange={setBuffer}
        min="0"
        hint="Kept out of your daily number for surprises."
      />
    </Shell>
  );
};
