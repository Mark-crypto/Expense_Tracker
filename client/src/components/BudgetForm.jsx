import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { Card } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { budgetSchema } from "../zodSchemas/schemas";
import axiosInstance from "../axiosInstance";
import { useMemo } from "react";
import SubcategoryRow from "./SubcategoryRow";

const BudgetForm = () => {
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
    mutationFn: async (data) => {
      return await axiosInstance.post("/budget", data);
    },
    onSuccess: (data) => {
      toast.success(data.data.message, "Scroll to view list of all budgets.");
      reset();
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: () => {
      toast.error("Error creating budget");
    },
  });

  const addBudget = (data) => {
    try {
      const formattedData = {
        ...data,
        name: data.name.trim().toLowerCase(),
        amount: totalAmount,
      };
      mutate(formattedData);
    } catch (error) {
      toast.error("Error creating budget");
    }
  };

  return (
    <>
      <ToastContainer className="!w-[90vw] sm:!w-auto" />
      <Form
        onSubmit={handleSubmit(addBudget)}
        className="bg-white w-full max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto"
      >
        {/* Budget Name */}
        <Form.Group className="mb-3 md:mb-4">
          <Form.Label className="fw-semibold text-sm md:text-base">
            Budget Name
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter budget name"
            {...register("name")}
            isInvalid={!!errors.name}
            size="sm"
            className="text-sm md:text-base"
          />
          <Form.Control.Feedback type="invalid" className="text-xs md:text-sm">
            {errors.name?.message}
          </Form.Control.Feedback>
        </Form.Group>

        {/* Category Selection */}
        <Form.Group className="mb-3 md:mb-4">
          <Form.Label className="font-medium text-sm md:text-base">
            Category
          </Form.Label>
          <Form.Select
            {...register("category")}
            required
            size="sm"
            className="text-sm md:text-base"
          >
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
            <option value="emergency">Emergency / Unexpected Expenses</option>
            <option value="taxes">Taxes & Fees</option>
            <option value="retirement">Retirement</option>
            <option value="miscellaneous">Miscellaneous / Other</option>
          </Form.Select>

          {errors.category && (
            <p className="text-xs md:text-sm text-red-600 mt-1">
              {errors.category.message}
            </p>
          )}
        </Form.Group>

        {/* Subcategories Card */}
        <Card className="mb-3 md:mb-4 border-0 shadow-sm">
          <Card.Body className="p-3 md:p-4">
            <h5 className="fw-semibold mb-2 md:mb-3 text-sm md:text-base">
              Subcategories
            </h5>

            {fields.map((item, index) => (
              <div key={item.id} className="mb-2 md:mb-3 last:mb-0">
                <SubcategoryRow
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
              </div>
            ))}

            <Button
              variant="outline-primary"
              type="button"
              onClick={() => append({ name: "", amount: "" })}
              className="w-full text-sm md:text-base py-1.5 md:py-2"
              size="sm"
            >
              + Add Subcategory
            </Button>
          </Card.Body>
        </Card>

        {/* Total Amount */}
        <div className="flex justify-between items-center mt-3 md:mt-4 p-2 md:p-3 bg-gray-50 rounded-lg">
          <h6 className="mb-0 fw-semibold text-sm md:text-base">Total:</h6>
          <h6 className="mb-0 text-success fw-bold text-sm md:text-base">
            KES{" "}
            {(totalAmount || 0).toLocaleString("en-KE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h6>
        </div>

        {/* Budget Duration */}
        <Form.Group className="mt-4 md:mt-6">
          <div className="space-y-2 md:space-y-3">
            <Form.Label className="font-semibold text-gray-800 text-sm md:text-base block">
              Budget Duration
            </Form.Label>

            <div className="flex items-start gap-2 md:gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
              <Form.Check
                type="checkbox"
                id="timeLimit"
                {...register("timeLimit")}
                isInvalid={!!errors.timeLimit}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label
                  htmlFor="timeLimit"
                  className="text-gray-700 font-medium cursor-pointer text-sm md:text-base"
                >
                  Set specific start and end dates
                </label>
                <p className="text-gray-500 text-xs md:text-sm mt-1">
                  Uncheck for ongoing budget
                </p>
              </div>
            </div>

            <Form.Control.Feedback
              type="invalid"
              className="d-block text-xs md:text-sm"
            >
              {errors.timeLimit?.message}
            </Form.Control.Feedback>
          </div>
        </Form.Group>

        {/* Time Limit Dates (Conditional) */}
        {watch("timeLimit") && (
          <div className="mt-3 md:mt-4 mb-3 md:mb-4">
            <div className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <i className="bi bi-calendar-check text-blue-600"></i>
                <span className="font-semibold text-gray-800 text-sm md:text-base">
                  Set Time Period
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <Form.Group>
                  <Form.Label className="font-medium text-xs md:text-sm text-gray-700 mb-1 md:mb-2">
                    Start Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    {...register("startDate", { valueAsDate: true })}
                    className="border-gray-300 rounded-lg text-sm md:text-base"
                    size="sm"
                  />
                  {errors.startDate && (
                    <p className="text-xs md:text-sm text-red-600 mt-1">
                      {errors.startDate.message}
                    </p>
                  )}
                </Form.Group>

                <Form.Group>
                  <Form.Label className="font-medium text-xs md:text-sm text-gray-700 mb-1 md:mb-2">
                    End Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    {...register("endDate", { valueAsDate: true })}
                    className="border-gray-300 rounded-lg text-sm md:text-base"
                    size="sm"
                  />
                  {errors.endDate && (
                    <p className="text-xs md:text-sm text-red-600 mt-1">
                      {errors.endDate.message}
                    </p>
                  )}
                </Form.Group>
              </div>
            </div>
          </div>
        )}

        {/* Email Reminders */}
        <Form.Group className="mt-4 md:mt-6">
          <div className="border border-gray-200 rounded-lg p-3 md:p-4 bg-white">
            <div className="flex items-start gap-2 md:gap-3 mb-2">
              <Form.Check
                type="checkbox"
                id="emailReminders"
                {...register("email")}
                isInvalid={!!errors.email}
                className="mt-0.5"
              />
              <label
                htmlFor="emailReminders"
                className="text-gray-800 font-medium cursor-pointer text-sm md:text-base flex-1"
              >
                Receive email reminders
              </label>
            </div>

            <p className="text-gray-600 text-xs md:text-sm leading-relaxed mb-0">
              Get notified via email when your expenses are approaching or
              exceed your budget limits.
            </p>

            {errors.email && (
              <div className="mt-2 text-red-600 text-xs md:text-sm">
                {errors.email.message}
              </div>
            )}
          </div>
        </Form.Group>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full fw-bold mt-4 md:mt-6 py-2 md:py-3 text-sm md:text-base"
          style={{
            backgroundColor: "#9D00FF",
            borderColor: "#9D00FF",
          }}
        >
          {isPending ? "Creating..." : "Create Budget"}
        </Button>
      </Form>
    </>
  );
};

export default BudgetForm;
