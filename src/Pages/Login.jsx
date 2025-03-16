import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Link } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import { FaFacebook } from "react-icons/fa";

const Login = () => {
  return (
    <>
      {/* purple - #9D00FF, #B069DB, #6E00B3, #3C0061 */}
      <div className="login-form">
        <h4>Welcome back</h4>
        <h6>Enter your details</h6>
        <a href="https://google.com">
          <button type="button">
            <FaGoogle />
            Sign in with Google
          </button>
        </a>
        <a href="https://facebook.com">
          <button type="button">
            <FaFacebook />
            Sign in with Facebook
          </button>
        </a>

        <div>
          <p>OR</p>
        </div>
        <Form>
          <Form.Group controlId="email">
            <Form.Label>Email address</Form.Label>
            <Form.Control type="email" placeholder="Enter email" />
          </Form.Group>
          <Form.Group controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" placeholder="Password" />
          </Form.Group>
          <Button variant="primary" type="submit">
            Submit
          </Button>
          <Form.Text className="text-muted">
            Don't have an account? <Link to="/register">Register</Link>
          </Form.Text>
        </Form>
      </div>
      <div className="login-banner">
        <h1>Expense Tracker</h1>
        <p>Keep track of your expenses</p>
        <p>Spend responsibly today with us at: Expense Tracker</p>
      </div>
    </>
  );
};

export default Login;
