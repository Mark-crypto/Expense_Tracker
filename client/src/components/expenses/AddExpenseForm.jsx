import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Camera, CaretDown, CheckCircle, Plus, Star, Trash, Warning, X } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import AccountChips from "@/components/accounts/AccountChips";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryIcon, MerchantTile } from "@/components/ui/category";
import { Confirm } from "@/components/ui/confirm";
import { Dropzone } from "@/components/ui/dropzone";
import { CheckboxCard, Field, FieldError, Input, Label } from "@/components/ui/field";
import { CategoryPicker } from "@/components/ui/menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoryLabel } from "@/lib/categories";
import { impactsOf } from "@/lib/expenseImpact";
import { formatDate, formatKES, localToday, titleCase } from "@/lib/format";
import { refreshMoneyData } from "@/lib/refresh";
import { cn } from "@/lib/utils";
import { quickExpenseSchema } from "@/zodSchemas/schemas.js";
import { ImpactCard, ImpactLine } from "./ExpenseImpact";

const RECENT_MERCHANTS = 6;

const yesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toLocaleDateString("en-CA");
};

const blankForm = (date = localToday()) => ({ amount: "", merchant: "", category: "", date, items: [] });

const chipStyles =
  "inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium transition-colors hover:bg-muted";

const ShortcutPill = ({ shortcut, onPick, onRemove }) => (
  <span className="inline-flex h-8 items-center rounded-full border border-primary/40 bg-accent/60 text-accent-foreground">
    <button type="button" className="inline-flex h-full items-center gap-1.5 pl-3 text-xs font-medium" onClick={() => onPick(shortcut)}>
      <Star weight="fill" className="size-3" aria-hidden />
      <span className="max-w-32 truncate">{shortcut.merchant}</span>
    </button>
    <button
      type="button"
      aria-label={`Remove shortcut ${shortcut.merchant}`}
      className="flex h-full items-center pr-2 pl-1 opacity-70 hover:opacity-100"
      onClick={() => onRemove(shortcut.id)}
    >
      <X className="size-3" aria-hidden />
    </button>
  </span>
);

/*
 * The Add expense page body. `way` is "type", "sms" or "scan"; reading an SMS or a receipt
 * fills in Type it, so every expense is checked in one place before it's saved.
 */
const AddExpenseForm = ({ way, onWay, onDone }) => {
  const queryClient = useQueryClient();
  const amountRef = useRef(null);
  const fileRef = useRef(null);
  const smsRef = useRef(null);
  const categoryChosen = useRef(false);
  const [receipt, setReceipt] = useState(null);
  const [pickingDate, setPickingDate] = useState(false);
  const [pickedAccount, setPickedAccount] = useState(null);
  const [pickedBudget, setPickedBudget] = useState(null);
  const [keepShortcut, setKeepShortcut] = useState(false);
  const [sms, setSms] = useState(null);
  const [updateBalance, setUpdateBalance] = useState(true);
  const [saved, setSaved] = useState(null);
  const [leaving, setLeaving] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm({ resolver: zodResolver(quickExpenseSchema), defaultValues: blankForm() });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "items" });
  const [amount, merchant, category, date, items] = useWatch({
    control,
    name: ["amount", "merchant", "category", "date", "items"],
  });
  const splitting = fields.length > 0;
  const itemsTotal = items?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) ?? 0;
  const dirty = Number(amount) > 0 || !!merchant?.trim() || !!receipt || !!sms;

  useEffect(() => {
    if (splitting) setValue("amount", itemsTotal);
  }, [splitting, itemsTotal, setValue]);

  // Closing the tab with something typed asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (way === "type") amountRef.current?.focus();
  }, [way]);

  const { data: quickAdd } = useQuery({
    queryKey: ["quick-add"],
    queryFn: async () => (await axiosInstance.get("/expenses/quick-add")).data,
  });
  const known = quickAdd?.merchants ?? [];
  const accounts = quickAdd?.accounts ?? [];
  const shortcuts = quickAdd?.shortcuts ?? [];
  const recentMerchants = known.filter((row) => !shortcuts.some((item) => item.merchant === row.merchant));
  const remembered = quickAdd?.lastAccounts?.[merchant?.trim().toLowerCase()];
  const accountId = [pickedAccount, remembered, accounts[0]?.id].find((id) => accounts.some((account) => account.id === id));
  const isShortcut = shortcuts.some((item) => item.merchant.toLowerCase() === merchant?.trim().toLowerCase());
  const mpesaAccount = accounts.find((account) => account.type === "mpesa");
  // Expenses count toward their category's budget unless another one is picked.
  const budgetList = quickAdd?.budgetList ?? [];
  const autoBudget = quickAdd?.budgets?.[category];
  const chosenBudget = budgetList.find((budget) => budget.id === pickedBudget) ?? null;
  const impacts = impactsOf({
    amount,
    date,
    budget: chosenBudget ?? autoBudget,
    safe: quickAdd?.safe,
    account: accounts.find((account) => account.id === accountId),
  });

  const fillCategory = (name) => {
    if (categoryChosen.current) return;
    const match = known.find((row) => row.merchant.toLowerCase() === name.trim().toLowerCase());
    if (match) setValue("category", match.category, { shouldValidate: true });
  };

  const pickMerchant = ({ merchant: name, category: rememberedCategory }) => {
    setValue("merchant", name, { shouldValidate: true });
    if (!categoryChosen.current) setValue("category", rememberedCategory, { shouldValidate: true });
  };

  const pickShortcut = (shortcut) => {
    setSaved(null);
    setValue("merchant", shortcut.merchant, { shouldValidate: true });
    setValue("category", shortcut.category, { shouldValidate: true });
    categoryChosen.current = true;
    setPickedAccount(shortcut.account_id);
    onWay("type");
    amountRef.current?.focus();
  };

  const addAgain = (row) => {
    setSaved(null);
    setValue("amount", row.amount, { shouldValidate: true });
    setValue("merchant", row.merchant, { shouldValidate: true });
    setValue("category", row.category, { shouldValidate: true });
    categoryChosen.current = true;
    setPickedAccount(row.account_id);
    onWay("type");
  };

  const readSms = useMutation({
    mutationFn: async (text) => (await axiosInstance.post("/expenses/parse-sms", { text })).data,
    onSuccess: (found) => {
      if (!found.isSpend) {
        toast.info("That's money you received, not an expense. Record it under Accounts as money in.");
        return;
      }
      setSaved(null);
      setSms(found);
      setValue("amount", found.amount, { shouldValidate: true });
      setValue("merchant", found.merchant, { shouldValidate: true });
      if (!categoryChosen.current) setValue("category", found.category, { shouldValidate: true });
      if (found.date && found.date <= localToday()) {
        setValue("date", found.date, { shouldValidate: true });
        setPickingDate(![localToday(), yesterday()].includes(found.date));
      }
      if (mpesaAccount) setPickedAccount(mpesaAccount.id);
      onWay("type");
    },
    onError: (error) => toast.error(error.response?.data?.message || "We couldn't read that message."),
  });

  const removeShortcut = useMutation({
    mutationFn: async (id) => await axiosInstance.delete(`/expenses/shortcuts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quick-add"] }),
    onError: () => toast.error("This shortcut could not be removed."),
  });

  const readReceipt = useMutation({
    mutationFn: async (file) => {
      const body = new FormData();
      body.append("receiptImage", file);
      const response = await axiosInstance.post("/upload/receipt", body, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 45000,
      });
      return response.data.extractedData;
    },
    onSuccess: (found) => {
      if (found.amount) setValue("amount", Number(found.amount));
      if (found.date && found.date <= localToday()) {
        setValue("date", found.date);
        setPickingDate(![localToday(), yesterday()].includes(found.date));
      }
      if (found.merchant) {
        setValue("merchant", found.merchant);
        fillCategory(found.merchant);
      }
      toast.success("Receipt read. Check the details.");
      onWay("type");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "We couldn't read that receipt. Enter it by hand.");
      onWay("type");
    },
  });

  const chooseFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setSaved(null);
    setReceipt(URL.createObjectURL(file));
    readReceipt.mutate(file);
  };

  const removeReceipt = () => {
    setReceipt(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = useMutation({
    mutationFn: async (values) => {
      if (keepShortcut && !isShortcut) {
        await axiosInstance.post("/expenses/shortcuts", { merchant: values.merchant, category: values.category, accountId });
      }
      if (receipt) {
        return await axiosInstance.post("/expenses/save", {
          accountId,
          budgetId: pickedBudget ?? undefined,
          amount: values.amount,
          date: values.date,
          category: values.category,
          merchant: values.merchant,
          description: values.merchant.slice(0, 100),
          budgeted: false,
        });
      }
      const result = await axiosInstance.post("/expenses", {
        receiptNo: sms?.receiptNo,
        budgetId: pickedBudget ?? undefined,
        accountId,
        amount: values.amount,
        date: values.date,
        category: values.category,
        merchant: values.merchant,
        subcategories: values.items.length ? values.items : [{ name: values.merchant, amount: values.amount }],
      });
      // After the expense, so the new balance already includes it.
      if (sms?.balance !== null && sms?.balance !== undefined && updateBalance && mpesaAccount && accountId === mpesaAccount.id) {
        await axiosInstance.post(`/accounts/${mpesaAccount.id}/balance`, { balance: sms.balance });
      }
      return result;
    },
    // The form clears for the next one, keeping the date and "Paid from".
    onSuccess: (_, values) => {
      const budgetRow = impacts.find((row) => row.key === "budget");
      setSaved({
        text: `Saved ${formatKES(values.amount)} to ${values.merchant}.`,
        detail: budgetRow ? `${budgetRow.short} has ${formatKES(Math.max(budgetRow.after, 0))} left this month.` : null,
      });
      refreshMoneyData(queryClient);
      reset(blankForm(values.date));
      categoryChosen.current = false;
      setPickedAccount(accountId ?? null);
      setPickedBudget(null);
      setKeepShortcut(false);
      setSms(null);
      removeReceipt();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error) => toast.error(error.response?.data?.message || "This expense couldn't be saved."),
  });

  const { ref: amountField, ...amountProps } = register("amount", { valueAsNumber: true });
  const leave = () => (dirty ? setLeaving(true) : onDone());

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-3">
        {saved && (
          <Card role="status" className="flex flex-wrap items-center justify-between gap-3 border-l-[3px] border-l-success p-3.5">
            <div className="flex min-w-0 items-start gap-2.5">
              <CheckCircle className="mt-0.5 size-5 shrink-0 text-success" weight="fill" aria-hidden />
              <div>
                <p className="text-sm font-semibold tabular-nums">{saved.text}</p>
                {saved.detail && <p className="text-xs text-muted-foreground tabular-nums">{saved.detail}</p>}
              </div>
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSaved(null);
                  onWay("type");
                  amountRef.current?.focus();
                }}
              >
                Add another
              </Button>
              <Button size="sm" onClick={onDone}>
                Done
              </Button>
            </div>
          </Card>
        )}

        {way === "sms" && (
          <Card className="space-y-3 p-4 sm:p-5">
            <label htmlFor="mpesaSms" className="text-sm font-medium">
              Paste your M-Pesa message
            </label>
            <textarea
              id="mpesaSms"
              ref={smsRef}
              rows={5}
              autoFocus
              placeholder="TK12AB34CD Confirmed. Ksh500.00 sent to..."
              className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
              onPaste={(e) => readSms.mutate(e.clipboardData.getData("text"))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  readSms.mutate(e.currentTarget.value);
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Copy the whole message from Safaricom. We fill in the amount, who you paid and the date for you to check.
            </p>
            <div className="flex justify-end">
              <Button loading={readSms.isPending} onClick={() => readSms.mutate(smsRef.current.value)}>
                Read message
              </Button>
            </div>
          </Card>
        )}

        {way === "scan" && (
          <Card className="space-y-3 p-4 sm:p-5">
            {readReceipt.isPending ? (
              <div className="flex items-center gap-3 py-6">
                {receipt && <img src={receipt} alt="Your receipt" className="size-14 rounded-md object-cover" />}
                <p className="text-sm font-medium">Reading your receipt...</p>
              </div>
            ) : (
              <Dropzone
                inputRef={fileRef}
                accept="image/*"
                onFile={chooseFile}
                icon={Camera}
                title="Take a photo of the receipt"
                hint="Or choose one from your phone. PNG or JPG, up to 10 MB."
                buttonLabel="Choose image"
              />
            )}
            <p className="text-xs text-muted-foreground">
              We read the total and the shop, then show them on Type it for you to check. The photo isn't kept.
            </p>
          </Card>
        )}

        {way === "type" && (
          <form onSubmit={handleSubmit((values) => save.mutate(values))} onInput={() => setSaved(null)}>
            <Card className="space-y-5 p-4 sm:p-5">
              {sms && (
                <div className="space-y-2 rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
                  <div className="flex items-start justify-between gap-2">
                    <p>
                      From your M-Pesa SMS, receipt {sms.receiptNo}
                      {sms.account ? `, account ${sms.account}` : ""}.
                    </p>
                    <button type="button" aria-label="Stop using this SMS" className="opacity-70 hover:opacity-100" onClick={() => setSms(null)}>
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </div>
                  {sms.duplicate && (
                    <p className="flex items-center gap-1.5 font-medium text-warning">
                      <Warning className="size-3.5 shrink-0" aria-hidden /> You already added this payment on {formatDate(sms.duplicate)}.
                    </p>
                  )}
                  {mpesaAccount && sms.balance !== null && accountId === mpesaAccount.id && (
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="size-3.5" checked={updateBalance} onChange={(e) => setUpdateBalance(e.target.checked)} />
                      Update {mpesaAccount.name} to {formatKES(sms.balance)}
                    </label>
                  )}
                </div>
              )}

              {receipt && (
                <div className="flex items-center gap-3 rounded-lg border border-border p-2">
                  <img src={receipt} alt="Your receipt" className="size-12 rounded-md object-cover" />
                  <p className="min-w-0 flex-1 text-sm font-medium">Details from your receipt</p>
                  <Button variant="ghost" size="icon" aria-label="Remove receipt" className="size-7" onClick={removeReceipt}>
                    <X />
                  </Button>
                </div>
              )}

              {shortcuts.length > 0 && !merchant && (
                <div className="flex flex-wrap gap-1.5 lg:hidden">
                  {shortcuts.map((item) => (
                    <ShortcutPill key={item.id} shortcut={item} onPick={pickShortcut} onRemove={(id) => removeShortcut.mutate(id)} />
                  ))}
                </div>
              )}

              <div>
                <label htmlFor="quickAmount" className="text-sm font-medium">
                  Amount
                </label>
                <div className="mt-1 flex items-baseline gap-2 border-b-2 border-input pb-1 focus-within:border-primary">
                  <span className="text-lg font-medium text-muted-foreground">KES</span>
                  <input
                    id="quickAmount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    readOnly={splitting}
                    aria-invalid={!!errors.amount}
                    className="w-full min-w-0 [appearance:textfield] bg-transparent text-3xl font-semibold tracking-tight tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none sm:text-4xl"
                    {...amountProps}
                    ref={(element) => {
                      amountField(element);
                      amountRef.current = element;
                    }}
                  />
                </div>
                <FieldError className="mt-1">{errors.amount?.message}</FieldError>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Paid to" htmlFor="quickMerchant" error={errors.merchant?.message}>
                  <Input
                    id="quickMerchant"
                    list="knownMerchants"
                    autoComplete="off"
                    placeholder="Naivas, Mama Mboga, KPLC"
                    aria-invalid={!!errors.merchant}
                    {...register("merchant", { onChange: (e) => fillCategory(e.target.value) })}
                  />
                  <datalist id="knownMerchants">
                    {known.map((row) => (
                      <option key={row.merchant} value={row.merchant} />
                    ))}
                  </datalist>
                  {!merchant && recentMerchants.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {recentMerchants.slice(0, RECENT_MERCHANTS).map((row) => (
                        <button key={row.merchant} type="button" className={cn(chipStyles, "pl-1")} onClick={() => pickMerchant(row)}>
                          <MerchantTile name={row.merchant} className="size-6 rounded-full text-[10px]" />
                          <span className="max-w-32 truncate">{row.merchant}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </Field>

                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <CategoryPicker
                    modal
                    value={category}
                    label="Choose a category"
                    onChange={(value) => {
                      categoryChosen.current = true;
                      setValue("category", value, { shouldValidate: true });
                    }}
                    triggerClassName={cn(
                      "flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none",
                      errors.category && "border-danger"
                    )}
                  >
                    {category ? (
                      <>
                        <CategoryIcon category={category} />
                        <span className="flex-1 truncate">{categoryLabel(category)}</span>
                      </>
                    ) : (
                      <span className="flex-1 text-muted-foreground">Choose a category</span>
                    )}
                    <CaretDown className="size-3.5 text-muted-foreground" aria-hidden />
                  </CategoryPicker>
                  <FieldError>{errors.category?.message}</FieldError>
                </div>
              </div>

              {budgetList.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="countsToward">Counts toward</Label>
                  <Select value={pickedBudget ? String(pickedBudget) : "auto"} onValueChange={(value) => setPickedBudget(value === "auto" ? null : Number(value))}>
                    <SelectTrigger id="countsToward" className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        {autoBudget ? `${titleCase(autoBudget.name)} (matches the category)` : category ? "No budget (none for this category)" : "The budget for its category"}
                      </SelectItem>
                      {budgetList
                        .filter((budget) => budget.id !== autoBudget?.id)
                        .map((budget) => (
                          <SelectItem key={budget.id} value={String(budget.id)}>
                            {titleCase(budget.name)} · {formatKES(Math.max(budget.left, 0))} left
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Expenses count toward the budget for their category. Pick another to count this one there instead, like a trip budget.
                  </p>
                </div>
              )}

              {accounts.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Paid from</Label>
                  <AccountChips accounts={accounts} value={accountId} onChange={setPickedAccount} />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Date</Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ["Today", localToday()],
                    ["Yesterday", yesterday()],
                  ].map(([label, value]) => (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={!pickingDate && date === value}
                      className={cn(chipStyles, !pickingDate && date === value && "border-primary bg-accent text-accent-foreground")}
                      onClick={() => {
                        setPickingDate(false);
                        setValue("date", value, { shouldValidate: true });
                      }}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-pressed={pickingDate}
                    className={cn(chipStyles, pickingDate && "border-primary bg-accent text-accent-foreground")}
                    onClick={() => setPickingDate(true)}
                  >
                    Other date
                  </button>
                </div>
                {pickingDate && <Input type="date" aria-label="Date" max={localToday()} {...register("date")} />}
                <FieldError>{errors.date?.message}</FieldError>
              </div>

              {!receipt &&
                (splitting ? (
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Label>What you bought</Label>
                        <p className="text-xs text-muted-foreground">The amount above is the total of these.</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => replace([])}>
                        Remove list
                      </Button>
                    </div>
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <Input aria-label={`Item ${index + 1} name`} placeholder={index === 0 ? "e.g. Bread" : "Item"} {...register(`items.${index}.name`)} />
                        <Input
                          aria-label={`Item ${index + 1} amount`}
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          placeholder="0"
                          className="w-28 shrink-0 tabular-nums"
                          {...register(`items.${index}.amount`, { valueAsNumber: true })}
                        />
                        <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label={`Remove item ${index + 1}`} onClick={() => remove(index)}>
                          <Trash />
                        </Button>
                      </div>
                    ))}
                    <FieldError>{errors.items?.message || errors.items?.root?.message}</FieldError>
                    <Button variant="ghost" size="sm" onClick={() => append({ name: "", amount: "" })}>
                      <Plus /> Add item
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      onClick={() => append({ name: "", amount: Number.isFinite(amount) ? amount : "" })}
                    >
                      <Plus className="size-4" aria-hidden /> List what you bought
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </button>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Add each item and its price, like bread 120 and milk 65. We add them up, so you can see later what the money went on.
                    </p>
                  </div>
                ))}

              {merchant?.trim() && !isShortcut && (
                <CheckboxCard
                  id="keepShortcut"
                  title={`Save ${merchant.trim()} as a shortcut`}
                  description="Next time, tap it and just enter the amount."
                  checked={keepShortcut}
                  onChange={(e) => setKeepShortcut(e.target.checked)}
                />
              )}

              {/* Pinned above the phone's tab bar, so Save is always in reach. */}
              <div className="sticky bottom-16 z-10 -mx-4 -mb-4 space-y-2 border-t border-border bg-card px-4 py-3 sm:-mx-5 sm:-mb-5 sm:px-5 lg:static lg:mx-0 lg:mb-0 lg:border-0 lg:bg-transparent lg:p-0">
                <ImpactLine rows={impacts} className="lg:hidden" />
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" className="hidden lg:inline-flex" onClick={leave}>
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full lg:w-auto" loading={save.isPending}>
                    {save.isPending ? "Saving..." : "Save expense"}
                  </Button>
                </div>
              </div>
            </Card>
          </form>
        )}
      </div>

      <aside className="hidden space-y-3 lg:block" aria-label="Help with this expense">
        <ImpactCard rows={impacts} />
        {shortcuts.length > 0 && (
          <Card className="space-y-2.5 p-4">
            <h2 className="text-sm font-semibold">Shortcuts</h2>
            <div className="flex flex-wrap gap-1.5">
              {shortcuts.map((item) => (
                <ShortcutPill key={item.id} shortcut={item} onPick={pickShortcut} onRemove={(id) => removeShortcut.mutate(id)} />
              ))}
            </div>
          </Card>
        )}
        {quickAdd?.recent?.length > 0 && (
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Recent</h2>
            <ul className="mt-1 divide-y divide-border">
              {quickAdd.recent.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate">{titleCase(row.merchant)}</span>
                    <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => addAgain(row)}>
                      Add again
                    </button>
                  </span>
                  <span className="shrink-0 tabular-nums">{formatKES(row.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </aside>

      <Confirm
        open={leaving}
        danger
        title="Discard this expense?"
        description="What you've typed hasn't been saved."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onCancel={() => setLeaving(false)}
        onConfirm={onDone}
      />
    </div>
  );
};

export default AddExpenseForm;
