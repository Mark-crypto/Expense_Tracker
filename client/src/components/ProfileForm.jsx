import Form from "react-bootstrap/Form";
import { toast, ToastContainer } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "@/zodSchemas/schemas.js";

const ProfileForm = (profileData) => {
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    formState: { errors },
    reset,
    register,
  } = useForm({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => await axiosInstance.post("/profile", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(data.data.message);
      reset();
    },
    onError: () => toast.error("Error creating expense"),
  });

  const updateProfile = (data) => {
    try {
      mutate(data);
    } catch (error) {
      toast.error("Something went wrong.");
    }
  };

  return (
    <>
      <ToastContainer />
      <div>
        <Form onSubmit={handleSubmit(updateProfile)}>
          <Form.Group className="mb-4">
            <Form.Label className="font-medium">Full name</Form.Label>
            <Form.Control type="text" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="font-medium">Email </Form.Label>
            <Form.Control type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="font-medium">Occupation</Form.Label>
            <Form.Control type="text" {...register("occupation")} />
            {errors.occupation && (
              <p className="text-sm text-red-600 mt-1">
                {errors.occupation.message}
              </p>
            )}
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="font-medium">Age</Form.Label>
            <Form.Control
              type="number"
              {...register("age", { valueAsNumber: true })}
            />
            {errors.age && (
              <p className="text-sm text-red-600 mt-1">{errors.age.message}</p>
            )}
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="font-medium">Goal</Form.Label>
            <Form.Control type="text" {...register("goal")} />
            {errors.goal && (
              <p className="text-sm text-red-600 mt-1">{errors.goal.message}</p>
            )}
          </Form.Group>
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded transition-all duration-200 shadow-sm"
          >
            {isPending ? "Submitting..." : "Submit"}
          </button>
        </Form>
      </div>
    </>
  );
};
export default ProfileForm;
