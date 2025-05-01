import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
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
    mutationFn: async (data) => {
      return await axiosInstance.post("/expenses", data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      toast.success(data.data.message);
      reset();
      setTimeout(() => {
        navigate("/history");
      }, 3000);
    },
    onError: () => {
      toast.error("Error creating expense");
    },
  });

  const addExpense = (data) => {
    try {
      mutate(data);
    } catch (error) {
      toast.error("Something went wrong. Try again later.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <div style={{ width: "20%" }}>
        <Navbar />
      </div>
      <div
        style={{
          backgroundColor: "#9D00FF",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "80%",
        }}
      >
        <div>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          <Form
            onSubmit={handleSubmit(addExpense)}
            style={{
              width: "500px",
              margin: "auto",
              border: "1px solid grey",
              padding: "20px",
              borderRadius: "10px",
              backgroundColor: "white",
            }}
          >
            <h3
              style={{
                color: "#9D00FF",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              Add Expense
            </h3>
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter amount"
                name="amount"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p style={{ color: "red" }}>{errors.amount.message}</p>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select name="category" {...register("category")}>
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
                <p style={{ color: "red" }}>{errors.category.message}</p>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                name="date"
                {...register("date", { valueAsDate: true })}
              />
              {errors.date && (
                <p style={{ color: "red" }}>{errors.date.message}</p>
              )}
            </Form.Group>
            <Button
              style={{
                backgroundColor: "#9D00FF",
                marginBottom: "20px",
                width: "100%",
              }}
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Submitting..." : "Submit"}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;
