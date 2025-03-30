import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Link } from "react-router-dom";
import { useFormik } from "formik";
import loginValidation from "../schemas/loginValidation";

const LoginForm = () => {
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginValidation,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
  };
  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Email address</Form.Label>
        <Form.Control
          type="email"
          placeholder="Enter email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          name="email"
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
        />
        {formik.errors.password && formik.touched.password && (
          <p style={{ color: "red" }}>{formik.errors.password}</p>
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
        Don't have an account?{" "}
        <Link
          to="/register"
          style={{
            textDecoration: "none",
            color: "#9D00FF",
            fontWeight: "bold",
          }}
        >
          Register
        </Link>
      </Form.Text>
    </Form>
  );
};

export default LoginForm;
