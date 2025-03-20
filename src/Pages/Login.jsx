import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Link, Navigate } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import { FaFacebook } from "react-icons/fa";
import { useFormik } from "formik";
import loginValidation from "../schemas/loginValidation";
import {
  doSignInWithEmailAndPassword,
  doSignInWithGoogle,
} from "../services/auth";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const Login = () => {
  const { userLoggedIn } = useAuth();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState("");

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginValidation,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSigningIn) {
      setIsSigningIn(true);
    }
    await doSignInWithEmailAndPassword(
      formik.values.email,
      formik.values.password
    );
  };

  const onGoogleSignIn = async () => {
    if (!isSigningIn) {
      setIsSigningIn(true);
      doSignInWithGoogle().catch((err) => {
        setIsSigningIn(false);
        // setError(err.message);
      });
    }
  };
  return (
    <>
      {userLoggedIn && <Navigate to={"/"} replace={true} />}
      <div className="login-page">
        {/* purple - #9D00FF, #B069DB, #6E00B3, #3C0061 */}
        <div className="login-form">
          <h3 style={{ color: "#9D00FF" }}>Welcome Back</h3>
          <h6>Enter your details</h6>
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
        </div>
        <div className="login-banner">
          <div>
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

export default Login;
