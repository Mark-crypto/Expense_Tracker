import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { useFormik } from "formik";
import registerValidation from "../schemas/registerValidation";
import { Link } from "react-router-dom";
import { useStoreData } from "@/hooks/useStoreData";

const RegistrationForm = () => {
  const url = "http://localhost:5000/api/register";
  const { data, setData } = useStoreData(url);
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
  };
  return (
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
  );
};

export default RegistrationForm;
