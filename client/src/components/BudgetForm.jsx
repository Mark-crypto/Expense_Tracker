import { useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Plus } from "@phosphor-icons/react";
import axiosInstance from "../axiosInstance";
import { budgetSchema } from "../zodSchemas/schemas";
import { CategoryIcon } from "@/components/ui/category";
import { CategoryPicker } from "@/components/ui/menu";
import { categoryLabel } from "@/lib/categories";
import { formatKES, localToday } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CheckboxCard, Field, FieldError, Input, Label } from "@/components/ui/field";
import SubcategoryRow from "./SubcategoryRow";

const BudgetForm = ({ onCreated, category: initialCategory = "" }) => {
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    formState: { errors },
    reset,
    register,
    control,
    clearErrors,
    unregister,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(budgetSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      category: initialCategory,
      subcategories: [{ name: "", amount: "" }],
      email: false,
      timeLimit: false,
      startDate: null,
      endDate: null,
    },
    shouldUnregister: true,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "subcategories" });

  const selectedCategory = watch("category");
  const subcategories = useWatch({ control, name: "subcategories" });

  const totalAmount = useMemo(
    () => subcategories?.reduce((sum, curr) => sum + (Number(curr.amount) || 0), 0),
    [subcategories]
  );

  const { data: suggestion } = useQuery({
    queryKey: ["budget-suggestion", selectedCategory],
    queryFn: async () =>
      (await axiosInstance.get(`/budgets/suggest?category=${encodeURIComponent(selectedCategory)}`)).data,
    enabled: !!selectedCategory,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => await axiosInstance.post("/budget", data),
    onSuccess: (data) => {
      toast.success(data.data.message);
      reset();
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      onCreated?.();
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Error creating budget"),
  });

  const addBudget = (data) =>
    mutate({ ...data, name: data.name.trim().toLowerCase(), amount: totalAmount });

  return (
    <form onSubmit={handleSubmit(addBudget)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Budget name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" placeholder="e.g. November food" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Category" error={errors.category?.message}>
          <input type="hidden" {...register("category")} />
          <CategoryPicker
            modal
            label="Choose a category"
            value={selectedCategory}
            onChange={(value) => setValue("category", value, { shouldValidate: true })}
            triggerClassName="flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm hover:bg-muted"
          >
            {selectedCategory ? (
              <>
                <CategoryIcon category={selectedCategory} />
                <span className="truncate">{categoryLabel(selectedCategory)}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Choose a category</span>
            )}
          </CategoryPicker>
        </Field>
      </div>

      <div className="space-y-2">
        <Label>Budget items</Label>
        <div className="space-y-2">
          {fields.map((item, index) => (
            <SubcategoryRow
              key={item.id}
              index={index}
              register={register}
              errors={errors}
              remove={remove}
              clearErrors={clearErrors}
              unregister={unregister}
              control={control}
              setValue={setValue}
              selectedCategory={selectedCategory}
            />
          ))}
        </div>
        <FieldError>{errors.subcategories?.root?.message || errors.subcategories?.message}</FieldError>
        <Button variant="ghost" size="sm" onClick={() => append({ name: "", amount: "" })}>
          <Plus /> Add item
        </Button>
      </div>

      {suggestion?.average > 0 && (
        <p className="rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
          You usually spend {formatKES(suggestion.average)} a month on {categoryLabel(selectedCategory)}.
        </p>
      )}

      <div className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3">
        <span className="text-sm text-muted-foreground">Budget total</span>
        <span className="text-lg font-semibold tabular-nums">{formatKES(totalAmount, 2)}</span>
      </div>

      <CheckboxCard
        id="timeLimit"
        title="One-off budget with dates"
        description="Leave off for a budget that resets every month."
        {...register("timeLimit")}
      />

      {watch("timeLimit") && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" htmlFor="startDate" error={errors.startDate?.message}>
            <Input id="startDate" type="date" min={localToday()} {...register("startDate", { valueAsDate: true })} />
          </Field>
          <Field label="End date" htmlFor="endDate" error={errors.endDate?.message}>
            <Input id="endDate" type="date" min={localToday()} {...register("endDate", { valueAsDate: true })} />
          </Field>
        </div>
      )}

      <CheckboxCard
        id="emailReminders"
        title="Email me about this budget"
        description="Sends an alert when spending goes over the limit."
        {...register("email")}
      />

      <Button type="submit" loading={isPending} className="w-full">
        {isPending ? "Creating..." : "Create budget"}
      </Button>
    </form>
  );
};

export default BudgetForm;
