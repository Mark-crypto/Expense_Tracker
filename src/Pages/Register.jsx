import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Link } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import { FaFacebook } from "react-icons/fa";
import { useFormik } from "formik";
import registerValidation from "../schemas/registerValidation";

const Register = () => {
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: registerValidation,
  });

  const handleSubmit = (e) => {
    console.log("Form Submitted");
  };
  return (
    <>
      <div className="login-page">
        {/* purple - #9D00FF, #B069DB, #6E00B3, #3C0061 */}
        <div className="login-form">
          <h3 style={{ color: "#9D00FF" }}>Create Your Account</h3>
          <h6>Choose to sign in with:</h6>
          <a href="https://google.com">
            <button type="button" className="auth-btn">
              <FaGoogle
                style={{
                  marginRight: "5px",
                  fontSize: "17px",
                  color: "#9D00FF",
                }}
              />
              Sign in with Google
            </button>
          </a>
          <br />
          <a href="https://facebook.com">
            <button type="button" className="auth-btn">
              <FaFacebook
                style={{
                  marginRight: "5px",
                  fontSize: "17px",
                  color: "#9D00FF",
                }}
              />
              Sign in with Facebook
            </button>
          </a>

          <div
            style={{ margin: "20px", display: "flex", alignItems: "center" }}
          >
            <div
              style={{ flex: "1", height: "1px", backgroundColor: "gray" }}
            ></div>
            <p style={{ margin: "0 10px" }}>OR</p>
            <div
              style={{ flex: "1", height: "1px", backgroundColor: "gray" }}
            ></div>
          </div>
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
              {formik.errors.confirmPassword &&
                formik.touched.confirmPassword && (
                  <p style={{ color: "red" }}>
                    {formik.errors.confirmPassword}
                  </p>
                )}
            </Form.Group>
            <Button
              style={{
                backgroundColor: "#9D00FF",
                marginBottom: "20px",
                width: "100%",
              }}
              type="button"
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
        </div>
        <div className="register-banner">
          <div
            style={{
              marginTop: "40%",
            }}
          >
            <h1 style={{ fontStyle: "italic" }}>Expense Tracker</h1>
            <h6>Keep track of your expenses</h6>
            <h6>
              Spend responsibly today with us at{" "}
              <i style={{ color: "#3C0061" }}>Expense Tracker</i>{" "}
            </h6>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
