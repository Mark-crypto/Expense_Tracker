import * as yup from "yup";

const expenseValidation = yup.object({
  amount: yup
    .number()
    .required("Amount is required")
    .positive("Amount must be a positive number"),
  category: yup.string().required("Category is required"),
  date: yup.string().required("Date is required"),
});

export default expenseValidation;
