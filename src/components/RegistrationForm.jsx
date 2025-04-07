import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Link } from "react-router-dom";
import ErrorPage from "./ErrorPage";
import { ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useStoreData } from "@/hooks/useStoreData";
import { useState } from "react";
import { useFormik } from "formik";
import registerValidation from "../schemas/registerValidation";
import { btoa } from "abab";
import { toast } from "react-toastify";

const RegistrationForm = () => {
  const url = "http://localhost:5000/api/register";
  const [registerData, setRegisterData] = useState(null);
  const { fetchData, error } = useStoreData(url, registerData);
  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: registerValidation,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formik.values;
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill all the fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (formik.errors.name || formik.errors.email || formik.errors.password) {
      toast.error("Please fill all the fields");
      return;
    }
    const hashPassword = btoa(password);
    const data = {
      name: name,
      email: email,
      password: hashPassword,
    };
    setRegisterData(data);
    try {
      fetchData();
      toast.success("Registration successful");
      navigate("/login");
    } catch (error) {
      toast.error("Registration failed");
    } finally {
      formik.resetForm();
    }
  };

  if (error) return <ErrorPage />;
  return (
    <>
      <ToastContainer />
      <Form
        onSubmit={handleSubmit}
        style={{
          marginBottom: "20px",
        }}
      >
        <Form.Group className="mb-3">
          <Form.Label>Fullname</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            name="name"
            required
          />
          {formik.errors.name && formik.touched.name && (
            <p style={{ color: "red" }}>{formik.errors.name}</p>
          )}
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            name="email"
            required
          />
          {formik.errors.email && formik.touched.email && (
            <p style={{ color: "red" }}>{formik.errors.email}</p>
          )}
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            name="password"
            required
          />
          {formik.errors.password && formik.touched.password && (
            <p style={{ color: "red" }}>{formik.errors.password}</p>
          )}
          <br />
          <Form.Text className="text-muted">
            The password must contain:
            <ul>
              <li>a lowercase letter</li>
              <li>an uppercase letter</li>
              <li>a number</li>
              <li>a special character</li>
              <li>at least 8 characters long</li>
            </ul>
          </Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Confirm Password"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            name="confirmPassword"
            required
          />
          {formik.errors.confirmPassword && formik.touched.confirmPassword && (
            <p style={{ color: "red" }}>{formik.errors.confirmPassword}</p>
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
          Submit
        </Button>
        <br />
        <Form.Text className="text-muted">
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              textDecoration: "none",
              color: "#9D00FF",
              fontWeight: "bold",
            }}
          >
            Sign in
          </Link>
        </Form.Text>
      </Form>
    </>
  );
};

export default RegistrationForm;
