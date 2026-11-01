import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "@/axiosInstance";
import { profileSchema } from "@/zodSchemas/schemas.js";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const ProfileForm = ({ profile, onSaved }) => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    formState: { errors },
    register,
    reset,
  } = useForm({ resolver: zodResolver(profileSchema), mode: "onBlur" });

  useEffect(() => {
    if (profile) reset(profile);
  }, [profile, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => await axiosInstance.put(`/profile/${id}/edit-form`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(data.data.message);
      onSaved?.();
    },
    onError: () => toast.error("Could not update your profile"),
  });

  return (
    <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
      <Field label="Full name" htmlFor="name" error={errors.name?.message}>
        <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <Field
        label="Email"
        htmlFor="email"
        error={errors.email?.message}
        hint="Your email can't be changed here."
      >
        <Input id="email" type="email" readOnly className="bg-muted" {...register("email")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Occupation" htmlFor="occupation" error={errors.occupation?.message}>
          <Input id="occupation" aria-invalid={!!errors.occupation} {...register("occupation")} />
        </Field>
        <Field label="Age" htmlFor="age" error={errors.age?.message}>
          <Input id="age" type="number" aria-invalid={!!errors.age} {...register("age", { valueAsNumber: true })} />
        </Field>
      </div>
      <Field label="Your money goal" htmlFor="goal" error={errors.goal?.message}>
        <Input id="goal" aria-invalid={!!errors.goal} {...register("goal")} />
      </Field>
      <Button type="submit" loading={isPending} className="w-full">
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
};

export default ProfileForm;
