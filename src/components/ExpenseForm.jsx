import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useFormik } from "formik";
import expenseValidation from "../schemas/expenseValidation";
import Navbar from "./Navbar.jsx";

const ExpenseForm = () => {
  const [expense, setExpense] = useState({
    amount: "",
    category: "",
    date: "",
  });
  const formik = useFormik({
    initialValues: {
      amount: "",
      category: "",
      date: "",
    },
    validationSchema: expenseValidation,
  });

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
                value={expense.amount}
                onChange={(e) =>
                  setExpense({ ...expense, amount: e.target.value })
                }
                onBlur={formik.handleBlur}
                name="amount"
              />
              {formik.errors.amount && formik.touched.amount && (
                <p style={{ color: "red" }}>{formik.errors.amount}</p>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={expense.category}
                onChange={(e) =>
                  setExpense({ ...expense, category: e.target.value })
                }
                name="category"
                onBlur={formik.handleBlur}
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
                value={expense.date}
                onChange={(e) =>
                  setExpense({ ...expense, date: e.target.value })
                }
                onBlur={formik.handleBlur}
                name="date"
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
