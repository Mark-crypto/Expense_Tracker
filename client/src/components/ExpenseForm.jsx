import Form from "react-bootstrap/Form";
import Navbar from "./Navbar.jsx";
import { toast, ToastContainer } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/axiosInstance";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema } from "@/zodSchemas/schemas.js";

const ExpenseForm = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    handleSubmit,
    formState: { errors },
    reset,
    register,
  } = useForm({
    resolver: zodResolver(expenseSchema),
    mode: "onBlur",
  });

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

  const addExpense = (data) => {
    try {
      mutate(data);
    } catch {
      toast.error("Something went wrong. Try again later.");
    }
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-64">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <ToastContainer position="top-right" autoClose={3000} theme="light" />

        <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-lg">
          <h3 className="text-center text-2xl font-bold text-purple-700 mb-6">
            Add Expense
          </h3>

          <Form onSubmit={handleSubmit(addExpense)}>
            {/* Amount */}
            <Form.Group className="mb-4">
              <Form.Label className="font-medium">Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter amount"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.amount.message}
                </p>
              )}
            </Form.Group>

            {/* Category */}
            <Form.Group className="mb-4">
              <Form.Label className="font-medium">Category</Form.Label>
              <Form.Select {...register("category")}>
                <option>Choose a Category</option>
                <option value="clothing">Clothing</option>
                <option value="debt">Debt</option>
                <option value="education">Education</option>
                <option value="entertainment">Entertainment</option>
                <option value="food">Food</option>
                <option value="gifts">Gifts</option>
                <option value="healthcare">Healthcare</option>
                <option value="housing">Housing</option>
                <option value="householdSupplies">Household Supplies</option>
                <option value="insurance">Insurance</option>
                <option value="personal">Personal</option>
                <option value="retirement">Retirement</option>
                <option value="transportation">Transportation</option>
                <option value="utilities">Utilities</option>
              </Form.Select>
              {errors.category && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.category.message}
                </p>
              )}
            </Form.Group>

            {/* Date */}
            <Form.Group className="mb-6">
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

            {/* Submit Button */}
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
