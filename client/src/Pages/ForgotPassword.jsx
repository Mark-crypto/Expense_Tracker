import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axiosInstance from "@/axiosInstance";
import AuthLayout from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const ForgotPassword = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ resolver: zodResolver(schema), mode: "onBlur" });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => await axiosInstance.post("/auth/forgot-password", data),
    onSuccess: () => {
      reset();
      navigate("/check-email");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to send the reset link. Please try again."
      );
    },
  });

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            disabled={isPending}
            {...register("email")}
          />
        </Field>
        <Button type="submit" loading={isPending} className="w-full">
          {isPending ? "Sending..." : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link to="/" className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
