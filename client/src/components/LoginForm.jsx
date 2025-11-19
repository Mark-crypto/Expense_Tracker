import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { publicAxios } from "@/axiosInstance";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/zodSchemas/schemas.js";
import { motion } from "framer-motion";

const LoginForm = () => {
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await publicAxios.post("/auth/login", data);
      return res.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("user", JSON.stringify(data.info));
      toast.success("Login successful");
      reset();
      navigate("/dashboard");
    },
    onError: () => toast.error("Invalid email or password"),
  });

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const submitForm = (data) => {
    try {
      mutate(data);
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <ToastContainer />
      <form onSubmit={handleSubmit(submitForm)} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <input
            type="email"
            id="email"
            placeholder="Enter email"
            {...register("email")}
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-600 focus:border-purple-600"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            placeholder="Enter password"
            {...register("password")}
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-600 focus:border-purple-600"
          />
          {errors.password && (
            <p className="text-red-600 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800 transition-colors duration-300 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-purple-700 font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </form>
    </motion.div>
  );
};

export default LoginForm;
