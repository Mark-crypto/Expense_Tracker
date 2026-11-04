import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { CaretDown, Plus, Trash } from "@phosphor-icons/react";
import axiosInstance from "../axiosInstance";
import { budgetSchema } from "../zodSchemas/schemas";
import { CategoryIcon } from "@/components/ui/category";
import { CategoryPicker } from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import { CheckboxCard, Field, FieldError, Input, Label } from "@/components/ui/field";
import { ALERT_MODES, PERIODS } from "@/lib/budgets";
import { categoryLabel } from "@/lib/categories";
import { formatKES, parseItems, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const INHERIT = "";

const segment = (active) =>
  cn(
    "rounded-md py-1.5 text-xs font-medium transition-colors",
    active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
  );

const valuesFrom = (budget, category) => ({
  name: budget ? titleCase(budget.name) : "",
  category: budget?.category ?? category ?? "",
  amount: budget?.baseLimit ?? "",
  period: budget?.period ?? "monthly",
  rollover: budget?.rollover ?? false,
  startDate: budget?.startDate ?? "",
  endDate: budget?.endDate ?? "",
  alertMode: budget?.alert_mode ?? INHERIT,
  warnAt: budget?.warn_at ?? "",
  items: parseItems(budget?.subcategories),
});

const BudgetForm = ({ budget, category, onCreated }) => {
  const queryClient = useQueryClient();
  const editing = !!budget;
  const [showMore, setShowMore] = useState(editing);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm({
    resolver: zodResolver(budgetSchema),
    defaultValues: valuesFrom(budget, category),
    context: { editing },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const [chosen, amount, period, items] = useWatch({ control, name: ["category", "amount", "period", "items"] });
  const assigned = items?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) ?? 0;

  const { data: suggestion } = useQuery({
    queryKey: ["budget-suggestion", chosen],
    queryFn: async () => (await axiosInstance.get(`/budgets/suggest?category=${encodeURIComponent(chosen)}`)).data,
    enabled: !!chosen && !editing,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values) => {
      const body = {
        name: (values.name.trim() || categoryLabel(values.category)).toLowerCase(),
        category: values.category,
        period: values.period,
        rollover: values.rollover,
        startDate: values.period === "once" ? values.startDate : null,
        endDate: values.period === "once" ? values.endDate : null,
        alertMode: values.alertMode || null,
        warnAt: values.warnAt ? Number(values.warnAt) : null,
        subcategories: values.items,
      };
      return editing
        ? await axiosInstance.patch(`/budget/${budget.budget_id}`, body)
        : await axiosInstance.post("/budget", { ...body, amount: values.amount });
    },
    onSuccess: ({ data }) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      onCreated?.();
    },
    onError: (error) => toast.error(error.response?.data?.message || "This budget could not be saved."),
  });

  return (
    <form onSubmit={handleSubmit((values) => mutate(values))} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Category</Label>
        <CategoryPicker
          modal
          label="Choose a category"
          value={chosen}
          onChange={(value) => setValue("category", value, { shouldValidate: true })}
          triggerClassName={cn(
            "flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm hover:bg-muted",
            errors.category && "border-danger"
          )}
        >
          {chosen ? (
            <>
              <CategoryIcon category={chosen} />
              <span className="flex-1 truncate">{categoryLabel(chosen)}</span>
            </>
          ) : (
            <span className="flex-1 text-muted-foreground">Choose a category</span>
          )}
          <CaretDown className="size-3.5 text-muted-foreground" aria-hidden />
        </CategoryPicker>
        <FieldError>{errors.category?.message}</FieldError>
      </div>

      {!editing && (
        <div className="space-y-1.5">
          <label htmlFor="budgetAmount" className="text-sm font-medium">
            {period === "weekly" ? "Limit each week" : period === "once" ? "Total limit" : "Limit each month"}
          </label>
          <div className="flex items-baseline gap-2 border-b-2 border-input pb-1 focus-within:border-primary">
            <span className="text-lg font-medium text-muted-foreground">KES</span>
            <input
              id="budgetAmount"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="0"
              aria-invalid={!!errors.amount}
              className="w-full min-w-0 [appearance:textfield] bg-transparent text-3xl font-semibold tracking-tight tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none"
              {...register("amount", { valueAsNumber: true })}
            />
          </div>
          <FieldError>{errors.amount?.message}</FieldError>
          {suggestion?.average > 0 && (
            <button
              type="button"
              className="rounded-lg bg-accent px-3 py-2 text-left text-xs text-accent-foreground tabular-nums hover:opacity-90"
              onClick={() => setValue("amount", suggestion.average, { shouldValidate: true })}
            >
              You usually spend {formatKES(suggestion.average)} a month here. Use this amount.
            </button>
          )}
        </div>
      )}

      {editing && (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground tabular-nums">
          Limit: {formatKES(budget.baseLimit)}. Use Change limit in the budget to adjust it.
        </p>
      )}

      <div className="space-y-1.5">
        <Label>How often</Label>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {PERIODS.map(({ value, label }) => (
            <button key={value} type="button" aria-pressed={period === value} onClick={() => setValue("period", value)} className={segment(period === value)}>
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{PERIODS.find((row) => row.value === period)?.hint}</p>
      </div>

      {period === "once" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" htmlFor="startDate" error={errors.startDate?.message}>
            <Input id="startDate" type="date" {...register("startDate")} />
          </Field>
          <Field label="End date" htmlFor="endDate" error={errors.endDate?.message}>
            <Input id="endDate" type="date" {...register("endDate")} />
          </Field>
        </div>
      )}

      {!showMore ? (
        <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => setShowMore(true)}>
          More options
        </button>
      ) : (
        <div className="space-y-5">
          <Field label="Name (optional)" htmlFor="budgetName" hint="We'll use the category if you leave this blank.">
            <Input id="budgetName" autoComplete="off" maxLength={50} placeholder={chosen ? categoryLabel(chosen) : "Food"} {...register("name")} />
          </Field>

          <div className="space-y-2">
            <Label>Items inside this budget (optional)</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input aria-label={`Item ${index + 1} name`} placeholder="Groceries" {...register(`items.${index}.name`)} />
                <Input
                  aria-label={`Item ${index + 1} amount`}
                  type="number"
                  inputMode="decimal"
                  step="any"
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
            {fields.length > 0 && (
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatKES(assigned)} planned
                {(editing ? budget.baseLimit : Number(amount)) > 0 && ` of ${formatKES(editing ? budget.baseLimit : amount)}`}
              </p>
            )}
            <Button variant="ghost" size="sm" onClick={() => append({ name: "", amount: "" })}>
              <Plus /> Add item
            </Button>
          </div>

          {period === "monthly" && (
            <CheckboxCard
              id="rollover"
              title="Carry unused money into next month"
              description="Off means the budget starts fresh each month."
              {...register("rollover")}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="alertMode" className="text-sm font-medium">
                Alerts for this budget
              </label>
              <select
                id="alertMode"
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                {...register("alertMode")}
              >
                <option value={INHERIT}>Use my alert settings</option>
                {ALERT_MODES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Warn me at (%)" htmlFor="warnAt" error={errors.warnAt?.message}>
              <Input id="warnAt" type="number" min="1" max="100" placeholder="Use my setting" {...register("warnAt")} />
            </Field>
          </div>
        </div>
      )}

      <Button type="submit" loading={isPending} className="w-full">
        {isPending ? "Saving..." : editing ? "Save changes" : "Create budget"}
      </Button>
    </form>
  );
};

export default BudgetForm;
