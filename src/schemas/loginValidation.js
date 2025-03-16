import * as yup from "yup";

const loginValidation = yup.object({
  email: yup
    .string()
    .email("Invalid email")
    .required("Email is required")
    .min(3),
  password: yup.string().required("Password is required").min(8),
});

export default loginValidation;
