import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Minus, Plus } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckboxCard, Field, Input, Label } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALERT_MODES, LIMIT_STEP, movableBudgets } from "@/lib/budgets";
import { formatKES, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const choice = (active) =>
  cn(
    "w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/60",
    active && "border-primary bg-accent/60"
  );

const useSave = (onClose) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ method = "post", path, body }) => await axiosInstance[method](path, body),
    onSuccess: ({ data }) => {
      toast.success(data.message);
      ["budgets", "dashboard-overview", "limit-notification", "forecast"].forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      );
      onClose();
    },
    onError: (error) => toast.error(error.response?.data?.message || "This could not be saved."),
  });
};

const Shell = ({ title, description, onClose, onSubmit, pending, label, disabled, children }) => (
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
        <Button type="submit" className="w-full" loading={pending} disabled={disabled}>
          {label}
        </Button>
      </form>
    </DialogContent>
  </Dialog>
);

const SCOPES = [
  { value: "month", title: "This month only", description: "Goes back to your usual limit next month." },
  { value: "forward", title: "From now on", description: "Past months keep the limit they had." },
];

export const LimitDialog = ({ budget, preset, onClose }) => {
  const save = useSave(onClose);
  const [amount, setAmount] = useState(preset ?? budget.baseLimit);
  const [scope, setScope] = useState(budget.period === "once" ? "forward" : "month");
  const step = (by) => setAmount((value) => Math.max(Number(value) + by, LIMIT_STEP));

  return (
    <Shell
      title={`Change ${titleCase(budget.name)}`}
      description={`The limit is ${formatKES(budget.baseLimit)} and you've spent ${formatKES(budget.spent)}.`}
      label="Save limit"
      pending={save.isPending}
      disabled={!(Number(amount) > 0)}
      onClose={onClose}
      onSubmit={() =>
        save.mutate({ method: "patch", path: `/budget/${budget.budget_id}/limit`, body: { amount: Number(amount), scope } })
      }
    >
      <div className="space-y-1.5">
        <Label htmlFor="newLimit">New limit (KES)</Label>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="icon" aria-label={`Lower by ${LIMIT_STEP}`} onClick={() => step(-LIMIT_STEP)}>
            <Minus />
          </Button>
          <Input
            id="newLimit"
            type="number"
            inputMode="decimal"
            step="any"
            min="1"
            required
            className="text-center tabular-nums"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button variant="secondary" size="icon" aria-label={`Raise by ${LIMIT_STEP}`} onClick={() => step(LIMIT_STEP)}>
            <Plus />
          </Button>
        </div>
      </div>
      {budget.period !== "once" && (
        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-sm font-medium">When should this apply?</legend>
          {SCOPES.map(({ value, title, description }) => (
            <button key={value} type="button" aria-pressed={scope === value} className={choice(scope === value)} onClick={() => setScope(value)}>
              <span className="block text-sm font-medium">{title}</span>
              <span className="block text-xs text-muted-foreground">{description}</span>
            </button>
          ))}
        </fieldset>
      )}
    </Shell>
  );
};

export const MoveMoneyDialog = ({ budgets, to, from, amount: preset, onClose }) => {
  const save = useSave(onClose);
  const options = movableBudgets(budgets);
  const [fromId, setFromId] = useState(from?.budget_id ? String(from.budget_id) : "");
  const [toId, setToId] = useState(to?.budget_id ? String(to.budget_id) : "");
  const [amount, setAmount] = useState(preset ?? "");
  const source = options.find((row) => String(row.budget_id) === fromId);
  const room = source ? Math.max(source.limit - source.spent, 0) : 0;

  const picker = (label, value, onChange, excluded) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="w-full">
          <SelectValue placeholder="Choose a budget" />
        </SelectTrigger>
        <SelectContent>
          {options
            .filter((row) => String(row.budget_id) !== excluded)
            .map((row) => (
              <SelectItem key={row.budget_id} value={String(row.budget_id)}>
                {titleCase(row.name)}, {formatKES(Math.max(row.limit - row.spent, 0))} left
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Shell
      title="Move money between budgets"
      description="For this month only. Your total stays the same."
      label="Move money"
      pending={save.isPending}
      disabled={!fromId || !toId || !(Number(amount) > 0) || Number(amount) > room}
      onClose={onClose}
      onSubmit={() =>
        save.mutate({ path: "/budgets/move", body: { fromId: Number(fromId), toId: Number(toId), amount: Number(amount) } })
      }
    >
      {picker("From", fromId, setFromId, toId)}
      {picker("To", toId, setToId, fromId)}
      <Field label="Amount (KES)" htmlFor="moveBudgetAmount" hint={source ? `Up to ${formatKES(room)}` : undefined}>
        <Input
          id="moveBudgetAmount"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          required
          className="tabular-nums"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
    </Shell>
  );
};

export const AlertSettingsDialog = ({ settings, onClose }) => {
  const save = useSave(onClose);
  const [mode, setMode] = useState(settings.mode);
  const [warnAt, setWarnAt] = useState(settings.warnAt);
  const [emails, setEmails] = useState(settings.emails);

  return (
    <Shell
      title="Budget alerts"
      description="These apply to all your budgets. You can change any budget on its own."
      label="Save"
      pending={save.isPending}
      onClose={onClose}
      onSubmit={() => save.mutate({ method: "put", path: "/budgets/alert-settings", body: { mode, warnAt: Number(warnAt), emails } })}
    >
      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm font-medium">How often should we alert you?</legend>
        {ALERT_MODES.map(({ value, label, hint }) => (
          <button key={value} type="button" aria-pressed={mode === value} className={choice(mode === value)} onClick={() => setMode(value)}>
            <span className="block text-sm font-medium">{label}</span>
            <span className="block text-xs text-muted-foreground">{hint}</span>
          </button>
        ))}
      </fieldset>
      {["balanced", "everything"].includes(mode) && (
        <Field label="Warn me when a budget reaches (%)" htmlFor="warnAtAll">
          <Input id="warnAtAll" type="number" min="1" max="100" required className="tabular-nums" value={warnAt} onChange={(e) => setWarnAt(e.target.value)} />
        </Field>
      )}
      <CheckboxCard
        id="budgetEmails"
        title="Email me"
        description="Right away when you go over, except overnight, plus a summary every Monday."
        checked={emails}
        onChange={(e) => setEmails(e.target.checked)}
      />
    </Shell>
  );
};
