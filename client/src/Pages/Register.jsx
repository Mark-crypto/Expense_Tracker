import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { publicAxios } from "@/axiosInstance";
import { registerSchema } from "@/zodSchemas/schemas.js";
import AuthLayout from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const Register = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ resolver: zodResolver(registerSchema), mode: "onBlur" });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => await publicAxios.post("/auth/signup", data),
    onSuccess: (data) => {
      reset();
      toast.success(data.data.message);
      setTimeout(() => navigate("/"), 1500);
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Something went wrong. Check your inputs."),
  });

  const submitForm = (data) =>
    mutate({
      ...data,
      name: data.name.trim().toLowerCase(),
      email: data.email.trim().toLowerCase(),
      goal: data.goal.trim(),
      occupation: data.occupation.trim(),
    });

  return (
    <AuthLayout title="Create your account" description="It takes about a minute." wide>
      <form onSubmit={handleSubmit(submitForm)} className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" placeholder="Jane Wanjiku" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Occupation" htmlFor="occupation" error={errors.occupation?.message}>
          <Input id="occupation" placeholder="e.g. Teacher" aria-invalid={!!errors.occupation} {...register("occupation")} />
        </Field>
        <Field label="Age" htmlFor="age" error={errors.age?.message}>
          <Input id="age" type="number" placeholder="e.g. 28" aria-invalid={!!errors.age} {...register("age", { valueAsNumber: true })} />
        </Field>
        <Field label="Your money goal" htmlFor="goal" error={errors.goal?.message} className="sm:col-span-2">
          <Input id="goal" placeholder="e.g. Save for a plot" aria-invalid={!!errors.goal} {...register("goal")} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters">
          <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
        </Field>
        <Button type="submit" loading={isPending} className="w-full sm:col-span-2">
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
