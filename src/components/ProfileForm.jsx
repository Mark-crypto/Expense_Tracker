import axiosInstance from "@/axiosInstance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "./ProfileForm.jsx";

const ProfileForm = () => {
  const id = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // const { data, isLoading, error } = useQuery({
  //   queryKey: ["profileForm"],
  //   queryFn: async () => {
  //     return await axiosInstance.get(`/profile/${id}`);
  //   },
  // });
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      return await axiosInstance.put(`/profile/${id}`);
    },
    onSuccess: (data) => {
      toast.success(data.data.message);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      navigate("/profile/1");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const {
    handleSubmit,
    formState: { errors },
    register,
  } = useForm({
    mode: "onBlur",
    // defaultValues: {
    //   fullname: data?.data?.fullname,
    //   occupation: data?.data?.occupation,
    //   age: data?.data?.age,
    // },
  });

  const submitForm = (data) => {
    try {
      mutate(data);
    } catch (error) {
      toast.error("Something went wrong");
    }
  };
  // if (isLoading) {
  //   return <h1>Loading....</h1>;
  // }
  // if (error) {
  //   toast.error("Something went wrong");
  // }
  return (
    <>
      <Navbar />
      <Form onSubmit={handleSubmit(submitForm)}>
        <Form.Group className="mb-3">
          <Form.Label>Full Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter Full name"
            {...register("fullname")}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Occupation</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter Occupation"
            {...register("occupation")}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Age</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter Age"
            {...register("age")}
          />
        </Form.Group>
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit"}
        </Button>
      </Form>
    </>
  );
};
export default ProfileForm;
