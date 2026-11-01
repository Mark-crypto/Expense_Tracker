import { useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";
import axiosInstance from "@/axiosInstance";
import { expenseSchema } from "@/zodSchemas/schemas.js";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { formatKES, localToday, titleCase } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CheckboxCard, Field, FieldError, Select, Input, Label } from "@/components/ui/field";
import SubcategoryRow from "./SubcategoryRow.jsx";

const ExpenseForm = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
    resolver: zodResolver(expenseSchema),
    mode: "onSubmit",
    defaultValues: {
      category: "",
      subcategories: [{ name: "", amount: "" }],
      date: "",
      budgetNames: "",
      budgeted: false,
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
    mutationFn: async (data) => await axiosInstance.post("/expenses", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(data.data.message);
      reset();
      navigate("/history");
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Error creating expense"),
  });

  const { data: budgetData } = useQuery({
    queryKey: ["budgets", "names"],
    queryFn: async () => await axiosInstance.get("/budget/names"),
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutate({ ...data, amount: totalAmount }))}
      className="space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
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
        <Field label="Date" htmlFor="date" error={errors.date?.message}>
          <Input id="date" type="date" max={localToday()} {...register("date", { valueAsDate: true })} />
        </Field>
      </div>

      <div className="space-y-2">
        <Label>What did you pay for?</Label>
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
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-lg font-semibold tabular-nums">{formatKES(totalAmount, 2)}</span>
      </div>

      <CheckboxCard
        id="budgeted"
        title="Track against a budget"
        description="Counts this expense toward a budget's limit."
        {...register("budgeted")}
      />

      {watch("budgeted") && (
        <Field label="Budget" htmlFor="budgetNames" error={errors.budgetNames?.message}>
          <Select id="budgetNames" required {...register("budgetNames")}>
            <option value="">Choose a budget</option>
            {budgetData?.data?.data?.map((budget) => (
              <option key={budget.budget_id} value={budget.name}>
                {titleCase(budget.name)}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Button type="submit" loading={isPending} className="w-full">
        {isPending ? "Saving..." : "Save expense"}
      </Button>
    </form>
  );
};

export default ExpenseForm;
