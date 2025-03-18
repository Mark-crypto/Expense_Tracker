import Navbar from "./Navbar";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useFormik } from "formik";
import budgetValidation from "../schemas/budgetValidation";

const Budget = () => {
  const formik = useFormik({
    initialValues: {
      name: "",
      category: "",
      amount: "",
      date: "",
    },
    validationSchema: budgetValidation,
  });

  const addBudget = (e) => {
    console.log("Budget added");
  };
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
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "80%",
        }}
      >
        <Form
          onSubmit={addBudget}
          style={{
            width: "500px",
            marginBottom: "60px",
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
            />
            {formik.errors.amount && formik.touched.amount && (
              <p style={{ color: "red" }}>{formik.errors.amount}</p>
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
            Create Budget
          </Button>
        </Form>
        <div className="btn-budget">
          <button type="button">Show Previous Budgets</button>
        </div>
      </div>
    </div>
  );
};

export default Budget;
