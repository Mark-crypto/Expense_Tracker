import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useFormik } from "formik";
import budgetValidation from "../schemas/budgetValidation";
import { useStoreData } from "@/hooks/useStoreData";
import ErrorPage from "./ErrorPage";
import { toast, ToastContainer } from "react-toastify";

const BudgetForm = () => {
  const url = "http://localhost:5000/api/budget";
  const { error, fetchData } = useStoreData(url, { ...formik.values });
  const [loading, setLoading] = useState(false);
  const formik = useFormik({
    initialValues: {
      name: "",
      category: "",
      amount: "",
      email: true,
    },
    validationSchema: budgetValidation,
    enableReinitialize: true,
  });
  //look for checked
  const addBudget = (e) => {
    e.preventDefault();
    formik.values.email = formik.values.email ? "checked" : "unchecked";
    const { name, category, amount } = formik.values;

    if (!name || !category || !amount) {
      toast.error("Please fill in all fields");
      return;
    }
    if (formik.errors.name || formik.errors.category || formik.errors.amount) {
      toast.error("Please correct the errors in the form");
      return;
    }
    try {
      setLoading(true);
      fetchData();
    } catch (error) {
      toast.error("Error creating budget");
    } finally {
      setLoading(false);
      formik.resetForm();
      toast.success("Budget created successfully");
    }
  };
  if (error) return <ErrorPage />;
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Form
        onSubmit={addBudget}
        style={{
          width: "500px",
          marginBottom: "20px",
          marginTop: "100px",
          border: "1px solid grey",
          padding: "20px",
          borderRadius: "10px",
          backgroundColor: "white",
        }}
      >
        <h3
          style={{
            color: "#9D00FF",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          Create a Budget
        </h3>
        <Form.Group className="mb-3">
          <Form.Label>Budget name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            name="amount"
            required
          />
          {formik.errors.name && formik.touched.name && (
            <p style={{ color: "red" }}>{formik.errors.name}</p>
          )}
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Category</Form.Label>
          <Form.Select
            value={formik.values.category}
            onChange={formik.handleChange}
            name="category"
            onBlur={formik.handleBlur}
            required
          >
            <option>Choose a Category</option>
            <option value="clothing">Clothing</option>
            <option value="debt">Debt</option>
            <option value="education">Education</option>
            <option value="entertainment">Entertainment</option>
            <option value="food">Food</option>
            <option value="gifts">Gifts</option>
            <option value="healthcare">Healthcare</option>
            <option value="housing">Housing</option>
            <option value="householdSupplies">Household Supplies</option>
            <option value="insurance">Insurance</option>
            <option value="personal">Personal</option>
            <option value="retirement">Retirement</option>
            <option value="transportation">Transportation</option>
            <option value="utilities">Utilities</option>
          </Form.Select>
          {formik.errors.category && formik.touched.category && (
            <p style={{ color: "red" }}>{formik.errors.category}</p>
          )}
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Budget Amount</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter amount"
            value={formik.values.amount}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            name="amount"
            required
          />
          {formik.errors.amount && formik.touched.amount && (
            <p style={{ color: "red" }}>{formik.errors.amount}</p>
          )}
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicCheckbox">
          <Form.Check
            type="checkbox"
            label="Receive Email Reminders"
            checked={formik.values.email}
            onChange={formik.handleChange}
            onClick={() => formik.setFieldValue("email", !formik.values.email)}
            name="email"
          />
        </Form.Group>
        <Button
          style={{
            backgroundColor: "#9D00FF",
            marginBottom: "20px",
            width: "100%",
            fontWeight: "bold",
          }}
          type="submit"
          disabled={loading}
        >
          Create Budget
        </Button>
      </Form>
    </>
  );
};

export default BudgetForm;
