import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/schemas/zodSchemas";

const RegistrationForm = () => {
  const navigate = useNavigate();
  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      return await axiosInstance.post("/auth/signup", data);
    },
    onSuccess: (data) => {
      reset();
      toast.success(data.data.message);
      setTimeout(() => {
        navigate("/");
      }, 3000);
    },
    onError: () => {
      toast.error("Something went wrong. Check you provided correct inputs.");
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });
  const password = watch("password");
  const submitForm = (data) => {
    try {
      mutate(data);
    } catch (error) {
      toast.error("Something went wrong");
    }
  };
  return (
    <>
      <ToastContainer />
      <Form
        onSubmit={handleSubmit(submitForm)}
        style={{
          marginBottom: "20px",
        }}
      >
        <Form.Group className="mb-3">
          <Form.Label>Fullname</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter name"
            {...register("name")}
            name="name"
          />
          {errors.name && <p style={{ color: "red" }}>{errors.name.message}</p>}
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            {...register("email")}
            name="email"
          />
          {errors.email && (
            <p style={{ color: "red" }}>{errors.email.message}</p>
          )}
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            {...register("password")}
            name="password"
          />
          {errors.password && (
            <p style={{ color: "red" }}>{errors.password.message}</p>
          )}
          <br />
          <Form.Text className="text-muted">
            The password must contain:
            <ul>
              <li>a lowercase letter</li>
              <li>an uppercase letter</li>
              <li>a number</li>
              <li>a special character</li>
              <li>at least 8 characters long</li>
            </ul>
          </Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Confirm Password"
            name="confirmPassword"
            {...register("confirmPassword", {
              validate: (value) =>
                value === password || "Passwords do not match",
            })}
          />
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
        <br />
        <Form.Text className="text-muted">
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              textDecoration: "none",
              color: "#9D00FF",
              fontWeight: "bold",
            }}
          >
            Sign in
          </Link>
        </Form.Text>
      </Form>
    </>
  );
};

export default RegistrationForm;
