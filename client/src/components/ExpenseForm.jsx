import Form from "react-bootstrap/Form";
import Navbar from "./Navbar.jsx";
import { toast, ToastContainer } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/axiosInstance";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { Card } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema } from "@/zodSchemas/schemas.js";
import { useMemo } from "react";
import LimitNotification from "./LimitNotification.jsx";
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subcategories",
  });

  const selectedCategory = watch("category");
  const subcategories = useWatch({ control, name: "subcategories" });

  const totalAmount = useMemo(() => {
    return subcategories?.reduce((sum, curr) => {
      const value = Number(curr.amount) || 0;
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
  }, [subcategories]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => await axiosInstance.post("/expenses", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      toast.success(data.data.message);
      reset();
      setTimeout(() => navigate("/history"), 3000);
    },
    onError: () => toast.error("Error creating expense"),
  });

  const { data: budgetData, isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      return await axiosInstance.get(`/budget/names`);
    },
    keepPreviousData: true,
  });

  const addExpense = (data) => {
    try {
      const formattedData = {
        ...data,
        amount: totalAmount,
      };
      mutate(formattedData);
    } catch {
      toast.error("Something went wrong. Try again later.");
    }
  };

  return (
    <div className="flex">
      <div className="w-64">
        <Navbar />
      </div>
      <div className="flex-1 min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <LimitNotification />
        <ToastContainer position="top-right" autoClose={3000} theme="light" />
        <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-lg">
          <h3 className="text-center text-2xl font-bold text-purple-700 mb-6">
            Add Expense
          </h3>
          <Form onSubmit={handleSubmit(addExpense)}>
            <Form.Group className="mb-4">
              <Form.Label className="font-medium">Expense Category</Form.Label>
              <Form.Select {...register("category")} required>
                <option value="">Choose a Category</option>
                <option value="housing">Housing</option>
                <option value="utilities">Utilities</option>
                <option value="transportation">Transportation</option>
                <option value="food">Food & Groceries</option>
                <option value="healthcare">Healthcare</option>
                <option value="insurance">Insurance</option>
                <option value="debt">Debt & Loans</option>
                <option value="education">Education</option>
                <option value="savings">Savings & Investments</option>
                <option value="personalCare">Personal Care</option>
                <option value="clothing">Clothing & Accessories</option>
                <option value="entertainment">Entertainment & Leisure</option>
                <option value="gifts">Gifts & Donations</option>
                <option value="householdSupplies">Household Supplies</option>
                <option value="family">Childcare & Family</option>
                <option value="pets">Pets & Pet Care</option>
                <option value="work">Work & Business</option>
                <option value="technology">Technology & Subscriptions</option>
                <option value="travel">Travel & Vacations</option>
                <option value="emergency">
                  Emergency / Unexpected Expenses
                </option>
                <option value="taxes">Taxes & Fees</option>
                <option value="retirement">Retirement</option>
                <option value="miscellaneous">Miscellaneous / Other</option>
              </Form.Select>

              {errors.category && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.category.message}
                </p>
              )}
            </Form.Group>

            <Card className="mb-3 border-0 shadow-sm">
              <Card.Body>
                <h5 className="fw-semibold mb-3">Subcategories</h5>

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

                <Button
                  variant="outline-primary"
                  type="button"
                  onClick={() => append({ name: "", amount: "" })}
                >
                  + Add Subcategory
                </Button>
              </Card.Body>
            </Card>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <h6 className="mb-0 fw-semibold">Total:</h6>
              <h6 className="mb-0 text-success fw-bold">
                KES{" "}
                {(totalAmount || 0).toLocaleString("en-KE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h6>
            </div>

            <Form.Group className="mb-6 mt-6">
              <Form.Label className="font-medium">Date</Form.Label>
              <Form.Control
                type="date"
                {...register("date", { valueAsDate: true })}
              />
              {errors.date && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.date.message}
                </p>
              )}
            </Form.Group>

            <Form.Group className="mb-6">
              {/* Card container with border */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                {/* Checkbox */}
                <div className="flex items-start gap-3 mb-2">
                  <Form.Check
                    type="checkbox"
                    id="budgeted"
                    {...register("budgeted")}
                    isInvalid={!!errors.budgeted}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="budgeted"
                    className="text-gray-800 font-medium cursor-pointer"
                  >
                    Do you want this expense to be tracked against your budget?
                  </label>
                </div>

                {/* Description paragraph */}
                <p className="text-gray-600 text-sm leading-relaxed mb-0">
                  Enabling this option allows the system to monitor your
                  expenses against your set budget limits.
                </p>

                {/* Error message */}
                {errors.budgeted && (
                  <div className="mt-2 text-red-600 text-sm">
                    {errors.budgeted.message}
                  </div>
                )}
              </div>
            </Form.Group>

            {watch("budgeted") && (
              <>
                <Form.Group className="mb-4">
                  <Form.Label className="font-medium">
                    Available Budgets
                  </Form.Label>
                  <Form.Select {...register("budgetNames")} required>
                    <option value="">Choose a Budget</option>
                    {budgetData?.data?.data?.map((budget) => {
                      return (
                        <option key={budget.budget_id} value={budget.name}>
                          {budget.name}
                        </option>
                      );
                    })}
                  </Form.Select>

                  {errors.budgetNames && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.budgetNames.message}
                    </p>
                  )}
                </Form.Group>
              </>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-purple-700 hover:bg-purple-800 transition text-white font-semibold py-2 rounded"
            >
              {isPending ? "Submitting..." : "Submit"}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;
