import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { toast } from "react-toastify";
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
    <Form
      onSubmit={handleSubmit(addBudget)}
      className=" p-4  bg-white w-100"
      style={{ maxWidth: "500px" }}
    >
      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold float-left">Budget Name</Form.Label>
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

      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold float-left">Category</Form.Label>
        <Form.Select {...register("category")} isInvalid={!!errors.category}>
          <option>Choose a Category</option>
          <option value="clothing">Clothing</option>
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
        <Form.Control.Feedback type="invalid">
          {errors.category?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3 ">
        <Form.Label className="fw-semibold float-left">
          Budget Amount
        </Form.Label>
        <Form.Control
          type="number"
          placeholder="Enter amount"
          {...register("amount", { valueAsNumber: true })}
          isInvalid={!!errors.amount}
        />
        <Form.Control.Feedback type="invalid">
          {errors.amount?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-4 font-semibold float-left">
        <Form.Check
          type="checkbox"
          label="Receive Email Reminders"
          {...register("email")}
          isInvalid={!!errors.email}
        />
        <Form.Control.Feedback type="invalid">
          {errors.email?.message}
        </Form.Control.Feedback>
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
  );
};

export default BudgetForm;
