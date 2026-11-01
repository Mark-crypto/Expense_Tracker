import { useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";
import axiosInstance from "../axiosInstance";
import { budgetSchema } from "../zodSchemas/schemas";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { formatKES, localToday } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CheckboxCard, Field, FieldError, Input, Label, Select } from "@/components/ui/field";
import SubcategoryRow from "./SubcategoryRow";

const BudgetForm = ({ onCreated }) => {
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
      category: "",
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
        <Field label="Category" htmlFor="category" error={errors.category?.message}>
          <Select id="category" required {...register("category")}>
            <option value="">Choose a category</option>
            {EXPENSE_CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
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

      <div className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3">
        <span className="text-sm text-muted-foreground">Budget total</span>
        <span className="text-lg font-semibold tabular-nums">{formatKES(totalAmount, 2)}</span>
      </div>

      <CheckboxCard
        id="timeLimit"
        title="Set start and end dates"
        description="Leave off for an ongoing budget."
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
