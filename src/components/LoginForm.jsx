import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Link } from "react-router-dom";
import loginValidation from "../schemas/loginValidation";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { btoa } from "btoa";
// import bcrypt from "bcryptjs";

const LoginForm = () => {
  const url = "http://localhost:5000/api/login";
  const navigate = useNavigate();

  // const formik = useFormik({
  //   initialValues: {
  //     email: "",
  //     password: "",
  //   },
  //   validationSchema: loginValidation,
  // });

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   const { email, password } = formik.values;
  //   if (!email || !password) {
  //     toast.error("Please fill all the fields");
  //     return;
  //   }
  //   if (formik.errors.email || formik.errors.password) {
  //     toast.error("Please fill all the fields");
  //     return;
  //   }
  //   // const hashPassword = bcrypt.hashSync(password, 10);
  //   const hashPassword = btoa(password);
  //   const data = {
  //     email: email,
  //     password: hashPassword,
  //   };
  //   const response = await axios.post(url, data);
  //   if (response.data.error) {
  //     toast.error(response.data.error);
  //   }
  //   if (response.data.success) {
  //     toast.success(response.data.message);
  //     navigate("/");
  //   }
  // };
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
    </>
  );
};

export default LoginForm;
