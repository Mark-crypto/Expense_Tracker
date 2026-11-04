import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { publicAxios } from "@/axiosInstance";
import { loginSchema } from "@/zodSchemas/schemas.js";
import { useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [params, setParams] = useSearchParams();

  // Confirms a log-out, once.
  useEffect(() => {
    const ended = params.get("ended");
    if (!params.get("loggedOut") && !ended) return;
    const message =
      ended === "idle"
        ? "You were logged out after an hour without activity. Log in again to carry on."
        : ended
          ? "Your session has ended. Log in again to carry on."
          : "You've been logged out.";
    toast.info(message, { toastId: "logged-out", autoClose: ended ? false : 4000 });
    setParams({}, { replace: true });
  }, [params, setParams]);

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), mode: "onBlur" });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await publicAxios.post("/auth/login", data);
      return res.data;
    },
    onSuccess: (data) => {
      login(data.user);
      toast.success("Login successful");
      reset();
      navigate("/dashboard");
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Can't reach the server. Try again shortly."),
  });

  return (
    <AuthLayout title="Welcome back" description="Log in to see your money.">
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
        <Field
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          action={
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          }
        >
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            aria-invalid={!!errors.password}
            disabled={isPending}
            {...register("password")}
          />
        </Field>
        <Button type="submit" loading={isPending} className="w-full">
          {isPending ? "Logging in..." : "Log in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
