import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Minus, Plus } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { chipStyles } from "@/components/accounts/dialogKit";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { dayMonth } from "@/lib/accounts";
import { frequencyLabel } from "@/lib/bills";
import { LIMIT_STEP } from "@/lib/budgets";
import { categoryLabel } from "@/lib/categories";
import { formatKES, localToday } from "@/lib/format";
import { weeklyFor } from "@/lib/goals";
import { refreshMoneyData } from "@/lib/refresh";
import { daysUntil, nextPayday } from "@/lib/setup";
import { cn } from "@/lib/utils";

// Each step opens in a dialog, so its heading is the dialog title.
const Heading = ({ title, children }) => (
  <DialogHeader>
    <DialogTitle>{title}</DialogTitle>
    {children && <DialogDescription>{children}</DialogDescription>}
  </DialogHeader>
);

const Footer = ({ onSkip, skipLabel = "Not now", children }) => (
  <div className="flex items-center justify-between gap-2 pt-2">
    {onSkip ? (
      <Button variant="ghost" onClick={onSkip}>
        {skipLabel}
      </Button>
    ) : (
      <span />
    )}
    {children}
  </div>
);

const Note = ({ children, className }) => (
  <p className={cn("rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground", className)}>{children}</p>
);

const useSaveAll = (onDone) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requests) => {
      for (const send of requests) await send();
    },
    onSuccess: () => {
      refreshMoneyData(queryClient);
      onDone();
    },
    onError: (error) => toast.error(error.response?.data?.message || "This could not be saved."),
  });
};

const useAccounts = () =>
  useQuery({ queryKey: ["accounts", null], queryFn: async () => (await axiosInstance.get("/accounts")).data });

export const PayStep = ({ onNext }) => {
  const { data } = useAccounts();
  const { data: settings } = useQuery({
    queryKey: ["pay-settings"],
    queryFn: async () => (await axiosInstance.get("/accounts/pay-settings")).data,
  });
  const [form, setForm] = useState(null);
  const save = useSaveAll(onNext);

  useEffect(() => {
    if (settings && !form) setForm({ payType: settings.payType, payDay: settings.payDay ?? "", buffer: settings.buffer });
  }, [settings, form]);
  if (!data || !form) return <Skeleton className="h-64 rounded-xl" />;

  const today = localToday();
  const salaried = form.payType === "salary" && Number(form.payDay) >= 1 && Number(form.payDay) <= 31;
  const until = salaried ? nextPayday(today, Number(form.payDay)) : null;
  const days = until ? Math.max(daysUntil(today, until), 1) : 30;
  const spendable = data.accounts.length
    ? data.accounts.filter((account) => account.spendable).reduce((sum, account) => sum + account.balance, 0)
    : data.statement?.balance ?? null;
  const daily = spendable === null ? null : Math.max(spendable - (Number(form.buffer) || 0), 0) / days;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate([
          () =>
            axiosInstance.put("/accounts/pay-settings", {
              payType: form.payType,
              payDay: form.payType === "salary" ? Number(form.payDay) : null,
              buffer: Number(form.buffer) || 0,
            }),
        ]);
      }}
    >
      <Heading title="How do you get paid?">This sets how far your money has to stretch.</Heading>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="How you get paid">
        {[
          ["salary", "Salary, on a set day"],
          ["irregular", "It varies"],
        ].map(([value, label]) => (
          <button key={value} type="button" aria-pressed={form.payType === value} className={chipStyles(form.payType === value)} onClick={() => setForm({ ...form, payType: value })}>
            {label}
          </button>
        ))}
      </div>
      {form.payType === "salary" && (
        <Field label="Pay day of the month" htmlFor="setupPayDay">
          <Input id="setupPayDay" type="number" inputMode="numeric" min="1" max="31" required className="tabular-nums" value={form.payDay} onChange={(e) => setForm({ ...form, payDay: e.target.value })} />
        </Field>
      )}
      <Field label="Safety buffer (KES)" htmlFor="setupBuffer" hint="Kept out of your daily number for surprises.">
        <Input id="setupBuffer" type="number" inputMode="decimal" min="0" required className="tabular-nums" value={form.buffer} onChange={(e) => setForm({ ...form, buffer: e.target.value })} />
      </Field>
      {daily !== null && (
        <div role="status" className="rounded-xl bg-hero p-4 text-white">
          <p className="text-xs text-white/70">Safe to spend today</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatKES(daily)}</p>
          <p className="text-xs text-white/80">
            {until ? `For ${days} ${days === 1 ? "day" : "days"}, until your salary on ${dayMonth(until)}` : "Spread over 30 days, because your income has no set date"}
            . Bills and goals come off next.
          </p>
        </div>
      )}
      <Footer onSkip={onNext}>
        <Button type="submit" loading={save.isPending}>
          Continue
        </Button>
      </Footer>
    </form>
  );
};

export const BillsStep = ({ onNext }) => {
  const { data } = useQuery({ queryKey: ["bills"], queryFn: async () => (await axiosInstance.get("/bills")).data });
  const [picked, setPicked] = useState(null);
  const save = useSaveAll(onNext);
  const suggestions = data?.suggestions ?? [];

  useEffect(() => {
    if (data && picked === null) setPicked(new Set(data.suggestions.map((row) => row.key)));
  }, [data, picked]);
  if (!data || !picked) return <Skeleton className="h-64 rounded-xl" />;

  if (suggestions.length === 0) {
    return (
      <div className="space-y-4">
        <Heading title="No regular payments found yet">
          We look for them in your M-Pesa statement. You can also add rent, school fees or subscriptions yourself.
        </Heading>
        <Footer onSkip={onNext} skipLabel="Close">
          <Link to="/bills" onClick={onNext}>
            <Button tabIndex={-1}>Add a bill</Button>
          </Link>
        </Footer>
      </div>
    );
  }

  const toggle = (key) => {
    const next = new Set(picked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setPicked(next);
  };
  const chosen = suggestions.filter((row) => picked.has(row.key));

  return (
    <div className="space-y-4">
      <Heading title={`We found ${suggestions.length} regular ${suggestions.length === 1 ? "payment" : "payments"}`}>
        Tick the ones to track. We'll remind you before they're due.
      </Heading>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {suggestions.map((row) => (
          <li key={row.key}>
            <label className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-sm">
              <input type="checkbox" className="size-4 accent-primary" checked={picked.has(row.key)} onChange={() => toggle(row.key)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{row.name}</span>
                <span className="text-xs text-muted-foreground">
                  {frequencyLabel(row.frequency)}, next {dayMonth(row.nextDue)}
                  {row.varies && ", varies"}
                </span>
              </span>
              <span className="font-medium tabular-nums">
                {row.varies && "≈ "}
                {formatKES(row.amount)}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <Footer onSkip={onNext} skipLabel="Skip">
        <Button
          disabled={chosen.length === 0}
          loading={save.isPending}
          onClick={() =>
            save.mutate(
              chosen.map((row) => () =>
                axiosInstance.post("/bills", {
                  name: row.name,
                  category: row.category,
                  amount: row.amount,
                  frequency: row.frequency,
                  nextDue: row.nextDue,
                  varies: row.varies,
                  kind: row.kind,
                })
              )
            )
          }
        >
          Track {chosen.length} {chosen.length === 1 ? "bill" : "bills"}
        </Button>
      </Footer>
    </div>
  );
};

const STARTER_CATEGORIES = ["food", "transportation", "utilities", "entertainment"];

export const PlanStep = ({ onNext }) => {
  const { data } = useQuery({ queryKey: ["budgets", "plan"], queryFn: async () => (await axiosInstance.get("/budgets/plan")).data });
  const [rows, setRows] = useState(null);
  const save = useSaveAll(onNext);

  useEffect(() => {
    if (!data || rows) return;
    const found = data.rows.filter((row) => row.period === "monthly" && (row.current || row.suggested)).slice(0, 6);
    setRows(
      found.length > 0
        ? found.map((row, index) => ({ category: row.category, amount: row.current ?? row.suggested, on: index < 4 }))
        : STARTER_CATEGORIES.map((category) => ({ category, amount: "", on: false }))
    );
  }, [data, rows]);
  if (!rows) return <Skeleton className="h-64 rounded-xl" />;

  const change = (index, patch) => setRows(rows.map((row, at) => (at === index ? { ...row, ...patch } : row)));
  const chosen = rows.filter((row) => row.on && Number(row.amount) > 0);
  const month = new Date().toLocaleDateString("en-GB", { month: "long" });

  return (
    <div className="space-y-4">
      <Heading title={`Set limits for ${month}`}>
        {data.rows.length > 0 ? "Suggested from your last 3 months. Change any amount." : "Pick a few and set a monthly amount for each."}
      </Heading>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {rows.map((row, index) => {
          const id = `plan-${row.category}`;
          return (
            <li key={row.category} className="flex items-center gap-3 px-3.5 py-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                aria-label={`Budget for ${categoryLabel(row.category)}`}
                checked={row.on}
                onChange={(e) => change(index, { on: e.target.checked })}
              />
              <label htmlFor={id} className="min-w-0 flex-1 truncate">
                {categoryLabel(row.category)}
              </label>
              <span className="flex items-center rounded-lg border border-border">
                <button type="button" aria-label={`Lower ${categoryLabel(row.category)}`} className="p-1.5 text-muted-foreground hover:text-foreground" onClick={() => change(index, { on: true, amount: Math.max((Number(row.amount) || 0) - LIMIT_STEP, LIMIT_STEP) })}>
                  <Minus className="size-3.5" />
                </button>
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="0"
                  className="w-20 bg-transparent text-center tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  value={row.amount}
                  onChange={(e) => change(index, { on: true, amount: e.target.value })}
                />
                <button type="button" aria-label={`Raise ${categoryLabel(row.category)}`} className="p-1.5 text-muted-foreground hover:text-foreground" onClick={() => change(index, { on: true, amount: (Number(row.amount) || 0) + LIMIT_STEP })}>
                  <Plus className="size-3.5" />
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground tabular-nums">
        {chosen.length === 1 ? "1 budget" : `${chosen.length} budgets`}, {formatKES(chosen.reduce((sum, row) => sum + Number(row.amount), 0))} a month
      </p>
      <Footer onSkip={onNext}>
        <Button
          disabled={chosen.length === 0}
          loading={save.isPending}
          onClick={() =>
            save.mutate([
              () =>
                axiosInstance.post("/budgets/plan", {
                  rows: chosen.map((row) => ({ category: row.category, name: categoryLabel(row.category).toLowerCase(), amount: Number(row.amount) })),
                }),
            ])
          }
        >
          Create {chosen.length === 1 ? "1 budget" : `${chosen.length} budgets`}
        </Button>
      </Footer>
    </div>
  );
};

const GOAL_IDEAS = ["School fees", "Emergency fund", "Rent deposit"];

export const GoalStep = ({ onNext }) => {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [dueDate, setDueDate] = useState("");
  const save = useSaveAll(onNext);
  const weekly = weeklyFor(Number(target) || 0, 0, dueDate, localToday());

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate([() => axiosInstance.post("/goals", { name, target: Number(target), dueDate: dueDate || null, saved: 0 })]);
      }}
    >
      <Heading title="Saving for anything?">Set one goal now. You can add more on Accounts.</Heading>
      <div className="flex flex-wrap gap-1.5">
        {GOAL_IDEAS.map((idea) => (
          <button key={idea} type="button" aria-pressed={name === idea} className={chipStyles(name === idea)} onClick={() => setName(idea)}>
            {idea}
          </button>
        ))}
      </div>
      <Field label="What are you saving for?" htmlFor="setupGoalName">
        <Input id="setupGoalName" required maxLength={60} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Amount (KES)" htmlFor="setupGoalTarget">
        <Input id="setupGoalTarget" type="number" inputMode="decimal" min="1" required className="tabular-nums" value={target} onChange={(e) => setTarget(e.target.value)} />
      </Field>
      <Field label="By when?" htmlFor="setupGoalDate" hint="Leave it empty for an open goal, like an emergency fund.">
        <Input id="setupGoalDate" type="date" min={localToday()} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </Field>
      {weekly && <Note className="tabular-nums">That's {formatKES(weekly)} a week. We'll keep it out of Safe to spend.</Note>}
      <Footer onSkip={onNext} skipLabel="Not now">
        <Button type="submit" loading={save.isPending}>
          Add goal
        </Button>
      </Footer>
    </form>
  );
};
