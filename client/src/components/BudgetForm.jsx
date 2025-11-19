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
      <ToastContainer />
      <Form
        onSubmit={handleSubmit(addBudget)}
        className=" p-4  bg-white w-100"
        style={{ maxWidth: "500px" }}
      >
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold float-left">
            Budget Name
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter budget name"
            {...register("name")}
            isInvalid={!!errors.name}
          />
          <Form.Control.Feedback type="invalid">
            {errors.name?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label className="font-medium">Category</Form.Label>
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
            <option value="emergency">Emergency / Unexpected Expenses</option>
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

        <Form.Group className="mb-6">
          <div className="space-y-3">
            <div>
              <Form.Label className="font-semibold text-gray-800 text-base block mb-2">
                Budget Duration
              </Form.Label>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
              <Form.Check
                type="checkbox"
                id="timeLimit"
                {...register("timeLimit")}
                isInvalid={!!errors.timeLimit}
                className="mt-0.5"
              />
              <div>
                <label
                  htmlFor="timeLimit"
                  className="text-gray-700 font-medium cursor-pointer"
                >
                  Set specific start and end dates
                </label>
                <p className="text-gray-500 text-sm mt-1">
                  Uncheck for ongoing budget
                </p>
              </div>
            </div>

            <Form.Control.Feedback type="invalid" className="d-block">
              {errors.timeLimit?.message}
            </Form.Control.Feedback>
          </div>
        </Form.Group>

        {watch("timeLimit") && (
          <div className="mt-4 mb-4">
            <div className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <i className="bi bi-calendar-check text-blue-600"></i>
                <span className="font-semibold text-gray-800">
                  Set Time Period
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Group>
                  <Form.Label className="font-medium text-sm text-gray-700 mb-2">
                    Start Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    {...register("startDate", { valueAsDate: true })}
                    className="border-gray-300 rounded-lg"
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.startDate.message}
                    </p>
                  )}
                </Form.Group>

                <Form.Group>
                  <Form.Label className="font-medium text-sm text-gray-700 mb-2">
                    End Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    {...register("endDate", { valueAsDate: true })}
                    className="border-gray-300 rounded-lg"
                  />
                  {errors.endDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.endDate.message}
                    </p>
                  )}
                </Form.Group>
              </div>
            </div>
          </div>
        )}

        <Form.Group className="mb-6">
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-start gap-3 mb-2">
              <Form.Check
                type="checkbox"
                id="emailReminders"
                {...register("email")}
                isInvalid={!!errors.email}
                className="mt-0.5"
              />
              <label
                htmlFor="emailReminders"
                className="text-gray-800 font-medium cursor-pointer"
              >
                Receive email reminders
              </label>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-0">
              Get notified via email when your expenses are approaching or
              exceed your budget limits.
            </p>

            {errors.email && (
              <div className="mt-2 text-red-600 text-sm">
                {errors.email.message}
              </div>
            )}
          </div>
        </Form.Group>

        <Button
          type="submit"
          disabled={isPending}
          className="w-100 fw-bold"
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
