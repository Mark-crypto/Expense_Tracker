import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeSlash, LinkBreak } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import AuthLayout from "@/components/layout/AuthLayout";
import StatusPage from "@/components/layout/StatusPage";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const passwordResetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [visible, setVisible] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.post("/auth/reset-password", {
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Password reset successfully!");
      setTimeout(() => navigate("/"), 1500);
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to reset password"),
  });

  if (!token) {
    return (
      <StatusPage
        icon={LinkBreak}
        code="Invalid link"
        title="This reset link doesn't work"
        message="It's missing its security token. Request a new link to continue."
        actionLabel="Request a new link"
        onAction={() => navigate("/forgot-password")}
      />
    );
  }

  const inputType = visible ? "text" : "password";

  return (
    <AuthLayout title="Set a new password" description="Use at least 8 characters.">
      <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
        <Field
          label="New password"
          htmlFor="password"
          error={errors.password?.message}
          action={
            <button
              type="button"
              onClick={() => setVisible((prev) => !prev)}
              aria-label={visible ? "Hide passwords" : "Show passwords"}
              className="text-muted-foreground hover:text-foreground"
            >
              {visible ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
        >
          <Input
            id="password"
            type={inputType}
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            disabled={isPending}
            {...register("password")}
          />
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <Input
            id="confirmPassword"
            type={inputType}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            disabled={isPending}
            {...register("confirmPassword")}
          />
        </Field>
        <Button type="submit" loading={isPending} className="w-full">
          {isPending ? "Resetting..." : "Reset password"}
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

export default ResetPassword;
