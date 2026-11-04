import { useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { CaretDown } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import AccountChips from "@/components/accounts/AccountChips";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category";
import { CheckboxCard, Field, FieldError, Input, Label } from "@/components/ui/field";
import { CategoryPicker } from "@/components/ui/menu";
import { FREQUENCIES, KINDS, guessKind } from "@/lib/bills";
import { categoryLabel } from "@/lib/categories";
import { formatDate, formatKES, localToday } from "@/lib/format";
import { cn } from "@/lib/utils";
import { billSchema } from "@/zodSchemas/schemas.js";

const segmentStyles = (active) =>
  cn(
    "rounded-md py-1.5 text-xs font-medium transition-colors",
    active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
  );

const BillForm = ({ bill, onDone }) => {
  const editing = !!bill?.id;
  const kindChosen = useRef(!!bill?.kind);
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm({
    resolver: zodResolver(billSchema),
    defaultValues: {
      name: bill?.name ?? "",
      category: bill?.category ?? "",
      amount: bill?.amount ?? "",
      kind: bill?.kind ?? "bill",
      varies: bill?.varies ?? false,
      frequency: bill?.frequency ?? "monthly",
      nextDue: bill?.next_due ?? bill?.nextDue ?? localToday(),
      accountId: bill?.account_id ?? null,
    },
  });
  const [category, frequency, kind, accountId] = useWatch({ control, name: ["category", "frequency", "kind", "accountId"] });
  const { data: quickAdd } = useQuery({
    queryKey: ["quick-add"],
    queryFn: async () => (await axiosInstance.get("/expenses/quick-add")).data,
  });
  const accounts = quickAdd?.accounts ?? [];
  const hint = KINDS.find((row) => row.value === kind)?.hint;

  const save = useMutation({
    mutationFn: async (values) =>
      editing
        ? await axiosInstance.patch(`/bills/${bill.id}`, values)
        : await axiosInstance.post("/bills", values),
    onSuccess: ({ data }) => {
      toast.success(data.message);
      onDone();
    },
    onError: (error) => toast.error(error.response?.data?.message || "This could not be saved."),
  });

  return (
    <form onSubmit={handleSubmit((values) => save.mutate(values))} className="flex flex-1 flex-col gap-5 p-5">
      <h2 className="pr-8 text-lg">{editing ? `Edit ${kind}` : "Track a payment"}</h2>

      <Field label="Name" htmlFor="billName" error={errors.name?.message}>
        <Input id="billName" placeholder="KPLC, Spotify, chama" autoComplete="off" {...register("name")} />
      </Field>

      <Field label="Amount (KES)" htmlFor="billAmount" error={errors.amount?.message}>
        <Input
          id="billAmount"
          type="number"
          inputMode="decimal"
          step="0.01"
          className="tabular-nums"
          {...register("amount", { valueAsNumber: true })}
        />
      </Field>

      <CheckboxCard
        id="billVaries"
        title="The amount changes each time"
        description="We'll add your usual amount as an estimate for you to confirm."
        {...register("varies")}
      />

      <div className="space-y-1.5">
        <Label>Category</Label>
        <CategoryPicker
          modal
          value={category}
          label="Choose a category"
          onChange={(value) => {
            setValue("category", value, { shouldValidate: true });
            if (!kindChosen.current) setValue("kind", guessKind(value));
          }}
          triggerClassName={cn(
            "flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm transition-colors hover:bg-muted",
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

      <div className="space-y-1.5">
        <Label>Type</Label>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {KINDS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={kind === value}
              onClick={() => {
                kindChosen.current = true;
                setValue("kind", value);
              }}
              className={segmentStyles(kind === value)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>

      <div className="space-y-1.5">
        <Label>How often</Label>
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
          {FREQUENCIES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={frequency === value}
              onClick={() => setValue("frequency", value)}
              className={segmentStyles(frequency === value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Field label="Next payment" htmlFor="billDate" error={errors.nextDue?.message}>
        <Input id="billDate" type="date" {...register("nextDue")} />
      </Field>

      {accounts.length > 0 && (
        <div className="space-y-1.5">
          <Label>Pay from</Label>
          <AccountChips
            accounts={accounts}
            label="Pay from"
            value={accountId ?? accounts[0].id}
            onChange={(id) => setValue("accountId", id)}
          />
        </div>
      )}

      {bill?.priceChanges?.length > 0 && (
        <div className="space-y-1.5">
          <Label>Price history</Label>
          <ul className="divide-y divide-border rounded-lg border border-border px-3 text-sm">
            {bill.priceChanges.map(({ date, from, to }) => (
              <li key={`${date}-${to}`} className="flex justify-between gap-3 py-2 tabular-nums">
                <span className="text-muted-foreground">{formatDate(date)}</span>
                <span>
                  {formatKES(from)} to {formatKES(to)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto pt-2">
        <Button type="submit" className="w-full" loading={save.isPending}>
          {save.isPending ? "Saving..." : editing ? "Save changes" : "Start tracking"}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          This only records payments. It never moves your money.
        </p>
      </div>
    </form>
  );
};

export default BillForm;
