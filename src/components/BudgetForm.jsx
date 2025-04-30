import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { toast, ToastContainer } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { budgetSchema } from "../zodSchemas/schemas";
import axiosInstance from "../axiosInstance";

const BudgetForm = () => {
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(budgetSchema),
    mode: "onBlur",
  });
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
      mutate(data);
    } catch (error) {
      toast.error("Error creating budget");
    }
  };
  return (
    <>
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
        onSubmit={handleSubmit(addBudget)}
        style={{
          width: "500px",
          marginBottom: "20px",
          marginTop: "100px",
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
          Create a Budget
        </h3>
        <Form.Group className="mb-3">
          <Form.Label>Budget name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter budget name"
            name="amount"
            {...register("name")}
          />
          {errors.name && <p style={{ color: "red" }}>{errors.name.message}</p>}
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
          <Form.Label>Budget Amount</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter amount"
            name="amount"
            {...register("amount")}
          />
          {errors.amount && (
            <p style={{ color: "red" }}>{errors.amount.message}</p>
          )}
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            label="Receive Email Reminders"
            name="email"
            {...register("email")}
          />
          {errors.email && (
            <p style={{ color: "red" }}>{errors.email.message}</p>
          )}
        </Form.Group>
        <Button
          style={{
            backgroundColor: "#9D00FF",
            marginBottom: "20px",
            width: "100%",
            fontWeight: "bold",
          }}
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Creating..." : "Create Budget"}
        </Button>
      </Form>
    </>
  );
};

export default BudgetForm;
