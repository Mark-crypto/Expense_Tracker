import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import axiosInstance from "@/axiosInstance";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/schemas/zodSchemas";

const LoginForm = () => {
  const navigate = useNavigate();
  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      return await axiosInstance.post("/auth/login", { data });
    },
    onSuccess: () => {
      reset();
      navigate("/dashboard");
    },
    onError: () => {
      toast.error("Invalid email or password");
    },
  });
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), mode: "onBlur" });
  const submitForm = (data) => {
    try {
      mutate(data);
    } catch (error) {
      toast.error("Something went wrong");
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
      <Form onSubmit={handleSubmit(submitForm)}>
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
          {isPending ? "Logging in..." : "Login"}
        </Button>
        <br />
        <Form.Text className="text-muted">
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{
              textDecoration: "none",
              color: "#9D00FF",
              fontWeight: "bold",
            }}
          >
            Register
          </Link>
        </Form.Text>
      </Form>
    </>
  );
};

export default LoginForm;
