import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ArrowDown, ArrowUp, Check, Trash, X } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { CategoryIcon, MerchantTile } from "@/components/ui/category";
import { Input } from "@/components/ui/field";
import { CategoryPicker } from "@/components/ui/menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { categoryLabel } from "@/lib/categories";
import { displayName } from "@/lib/dashboard";
import { formatDate, formatKES, localToday, parseItems, titleCase } from "@/lib/format";

const NO_BUDGET = "none";

const Field = ({ label, htmlFor, children }) => (
  <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2">
    <label htmlFor={htmlFor} className="text-xs text-muted-foreground">
      {label}
    </label>
    {children}
  </div>
);

const ExpensePanel = ({ expense, budgets, onClose, onMove, onSaved, onApplyMerchant, onDelete, onConfirm, inSheet }) => {
  const initial = {
    amount: Number(expense.amount),
    category: expense.category,
    date: expense.date,
    merchant: expense.merchant ?? "",
    note: expense.note ?? "",
    budgetId: expense.budget_id ? String(expense.budget_id) : NO_BUDGET,
    accountId: expense.account_id ? String(expense.account_id) : "",
  };
  const [form, setForm] = useState(initial);
  const { data: quickAdd } = useQuery({
    queryKey: ["quick-add"],
    queryFn: async () => (await axiosInstance.get("/expenses/quick-add")).data,
  });
  const accounts = quickAdd?.accounts ?? [];
  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const name = displayName(expense);
  const items = parseItems(expense.subcategories);

  const { data: history } = useQuery({
    queryKey: ["merchant-history", expense.merchant],
    queryFn: async () =>
      (await axiosInstance.get(`/expenses/merchant?name=${encodeURIComponent(expense.merchant)}`)).data,
    enabled: !!expense.merchant,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async () =>
      await axiosInstance.patch(`/expenses/${expense.expense_id}`, {
        ...form,
        amount: Number(form.amount),
        budgetId: form.budgetId === NO_BUDGET ? null : Number(form.budgetId),
        accountId: form.accountId ? Number(form.accountId) : undefined,
      }),
    onSuccess: () => {
      toast.success("Expense updated");
      if (form.category !== expense.category && history?.count > 1) {
        onApplyMerchant(expense.merchant, form.category, history.count);
      }
      onSaved();
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Could not update this expense."),
  });

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        mutate();
      }}
    >
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5 pr-10 lg:pr-2">
        <Button variant="ghost" size="icon" className="size-7" aria-label="Previous expense" onClick={() => onMove(-1)}>
          <ArrowUp />
        </Button>
        <Button variant="ghost" size="icon" className="size-7" aria-label="Next expense" onClick={() => onMove(1)}>
          <ArrowDown />
        </Button>
        <span className="flex-1" />
        {!inSheet && (
          <Button variant="ghost" size="icon" className="size-7" aria-label="Close details" onClick={onClose}>
            <X />
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-4 p-4">
        <div className="flex items-center gap-3">
          <MerchantTile name={name} className="size-11 rounded-xl text-sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">{formatDate(expense.date)}</p>
          </div>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">KES</span>
          <input
            aria-label="Amount in KES"
            type="number"
            step="any"
            required
            value={form.amount}
            onChange={update("amount")}
            className="w-full [appearance:textfield] bg-transparent text-2xl font-semibold tracking-tight tabular-nums outline-none focus:text-primary [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <Separator />

        <div className="space-y-2.5">
          <Field label="Category">
            <CategoryPicker
              modal={inSheet}
              label="Change category"
              value={form.category}
              onChange={(category) => setForm((prev) => ({ ...prev, category }))}
              triggerClassName="inline-flex h-8 min-w-0 items-center gap-1.5 rounded-md border border-input px-2 text-sm font-medium hover:bg-muted"
            >
              <CategoryIcon category={form.category} />
              <span className="truncate">{categoryLabel(form.category)}</span>
            </CategoryPicker>
          </Field>
          <Field label="Date" htmlFor="panelDate">
            <Input id="panelDate" type="date" required max={localToday()} value={form.date} onChange={update("date")} className="h-8" />
          </Field>
          <Field label="Paid to" htmlFor="panelMerchant">
            <Input id="panelMerchant" maxLength={150} placeholder="Add a name" value={form.merchant} onChange={update("merchant")} className="h-8" />
          </Field>
          {accounts.length > 0 && expense.source !== "mpesa" && (
            <Field label="Paid from">
              <Select value={form.accountId} onValueChange={(accountId) => setForm((prev) => ({ ...prev, accountId }))}>
                <SelectTrigger aria-label="Paid from" size="sm" className="w-full">
                  <SelectValue placeholder="Choose an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Budget">
            <Select
              value={form.budgetId}
              onValueChange={(budgetId) => setForm((prev) => ({ ...prev, budgetId }))}
            >
              <SelectTrigger aria-label="Budget" size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_BUDGET}>No budget</SelectItem>
                {budgets.map(({ budget_id, name: budgetName }) => (
                  <SelectItem key={budget_id} value={String(budget_id)}>
                    {titleCase(budgetName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Note" htmlFor="panelNote">
            <Input id="panelNote" maxLength={500} placeholder="Add a note" value={form.note} onChange={update("note")} className="h-8" />
          </Field>
        </div>

        {history?.count > 1 && (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {formatKES(history.total)} across {history.count} payments here
          </p>
        )}

        {items.length > 1 && (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">What you bought</p>
            <ul className="text-sm">
              {items.map((item, index) => (
                <li key={index} className="flex justify-between gap-4 py-1">
                  <span className="min-w-0 truncate">{item.name}</span>
                  <span className="tabular-nums">{formatKES(item.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {expense.description && (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">From your statement</p>
            <p className="rounded-lg bg-muted p-2.5 text-xs break-words text-muted-foreground">{expense.description}</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 space-y-2 border-t border-border bg-card p-3">
        {expense.needs_review === 1 && !dirty && (
          <Button variant="secondary" className="w-full" onClick={() => onConfirm(expense)}>
            <Check /> Looks right
          </Button>
        )}
        <div className="flex gap-2">
          <Button variant="danger-ghost" onClick={() => onDelete([expense.expense_id])}>
            <Trash /> Delete
          </Button>
          <Button type="submit" className="flex-1" loading={isPending} disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ExpensePanel;
