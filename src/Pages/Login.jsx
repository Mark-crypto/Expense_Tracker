import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginForm from "../components/LoginForm";
import Banner from "../components/Banner";
import GoogleSignIn from "../components/GoogleSignIn";

const Login = () => {
  // /auth/login
  return (
    <>
      <div className="login-page">
        {/* purple - #9D00FF, #B069DB, #6E00B3, #3C0061 */}
        <div className="login-form">
          <GoogleSignIn />
          <LoginForm />
        </div>
        <Banner />
      </div>
    </>
  );
};

export default Login;
