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
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <form onSubmit={handleSubmit(submitForm)} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email address
          </label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            {...register("email")}
            disabled={isPending}
            className={`mt-1 w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-offset-1 focus:outline-none transition-all ${
              errors.email
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-purple-600 focus:border-purple-600"
            } ${isPending ? "bg-gray-50 cursor-not-allowed" : "bg-white"}`}
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-purple-700 hover:text-purple-800 font-medium hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            {...register("password")}
            disabled={isPending}
            className={`mt-1 w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-offset-1 focus:outline-none transition-all ${
              errors.password
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-purple-600 focus:border-purple-600"
            } ${isPending ? "bg-gray-50 cursor-not-allowed" : "bg-white"}`}
          />
          {errors.password && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
            isPending
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-700 to-purple-800 rounded-4xl hover:from-purple-800 hover:to-purple-900 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          } text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
        >
          {isPending ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Logging in...
            </div>
          ) : (
            "Login"
          )}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-purple-700 font-semibold hover:text-purple-800 hover:underline transition-colors"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default LoginForm;
