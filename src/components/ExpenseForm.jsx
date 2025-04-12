import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useFormik } from "formik";
import expenseValidation from "../schemas/expenseValidation";
import Navbar from "./Navbar.jsx";
import { useStoreData } from "../hooks/useStoreData";
import ErrorPage from "./ErrorPage";
import { toast, ToastContainer } from "react-toastify";

const ExpenseForm = () => {
  const url = "http://localhost:5000/api/expenses";
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      amount: "",
      category: "",
      date: "",
    },
    validationSchema: expenseValidation,
  });
  const { fetchData, error } = useStoreData(url, { ...formik.values });

  const addExpense = async (e) => {
    e.preventDefault();
    const { amount, category, date } = formik.values;
    if (!amount || !category || !date) {
      toast.error("Please fill all fields");
      return;
    }
    if (formik.errors.amount || formik.errors.category || formik.errors.date) {
      toast.error("Please fill all fields correctly");
      return;
    }
    try {
      setLoading(true);
      await fetchData();
      toast.success("Expense added successfully");
    } catch (error) {
      toast.error("Error creating expense");
    } finally {
      setLoading(false);
      formik.resetForm();
    }
  };
  if (error) return <ErrorPage />;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <div style={{ width: "20%" }}>
        <Navbar />
      </div>
      <div
        style={{
          backgroundColor: "#9D00FF",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "80%",
        }}
      >
        <div>
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
            onSubmit={addExpense}
            style={{
              width: "500px",
              margin: "auto",
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
              Add Expense
            </h3>
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
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
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                placeholder=""
                value={formik.values.date}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                name="date"
                required
              />
              {formik.errors.date && formik.touched.date && (
                <p style={{ color: "red" }}>{formik.errors.date}</p>
              )}
            </Form.Group>
            <Button
              style={{
                backgroundColor: "#9D00FF",
                marginBottom: "20px",
                width: "100%",
              }}
              type="submit"
              disabled={loading}
            >
              Add Expense
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;
