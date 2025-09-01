import Form from "react-bootstrap/Form";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { publicAxios } from "@/axiosInstance";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/zodSchemas/schemas.js";

const RegistrationForm = () => {
  const navigate = useNavigate();
  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => await publicAxios.post("/auth/signup", data),
    onSuccess: (data) => {
      reset();
      toast.success(data.data.message);
      setTimeout(() => navigate("/"), 3000);
    },
    onError: () => {
      toast.error("Something went wrong. Check your inputs.");
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  const password = watch("password");

  const submitForm = (data) => {
    mutate(data);
  };

  return (
    <>
      <ToastContainer />
      <Form onSubmit={handleSubmit(submitForm)} className="space-y-4">
        {/* Full Name */}
        <Form.Group>
          <Form.Label className="font-semibold text-purple-800">
            Full Name
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter name"
            {...register("name")}
            className="rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </Form.Group>

        {/* Email */}
        <Form.Group>
          <Form.Label className="font-semibold text-purple-800">
            Email address
          </Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            {...register("email")}
            className="rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </Form.Group>

        {/* Password */}
        <Form.Group>
          <Form.Label className="font-semibold text-purple-800">
            Password
          </Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            {...register("password")}
            className="rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
          <Form.Text className="text-gray-600 text-sm block mt-2">
            Password must contain:
            <ul className="list-disc ml-6 mt-1">
              <li>At least one lowercase letter</li>
              <li>At least one uppercase letter</li>
              <li>At least one number</li>
              <li>At least one special character</li>
              <li>Minimum 8 characters</li>
            </ul>
          </Form.Text>
        </Form.Group>

        {/* Confirm Password */}
        <Form.Group>
          <Form.Label className="font-semibold text-purple-800">
            Confirm Password
          </Form.Label>
          <Form.Control
            type="password"
            placeholder="Confirm Password"
            {...register("confirmPassword", {
              validate: (value) =>
                value === password || "Passwords do not match",
            })}
            className="rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </Form.Group>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded transition-all duration-200 shadow-sm"
        >
          {isPending ? "Submitting..." : "Register"}
        </button>

        {/* Already have an account? */}
        <Form.Text className="text-gray-600 text-sm block text-center mt-4">
          Already have an account?{" "}
          <Link
            to="/"
            className="text-purple-700 font-semibold hover:underline"
          >
            Sign in
          </Link>
        </Form.Text>
      </Form>
    </>
  );
};

export default RegistrationForm;
