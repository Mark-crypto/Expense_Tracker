import { Navigate } from "react-router-dom";
import GoogleSignIn from "@/components/GoogleSignIn";
import RegistrationForm from "@/components/RegistrationForm";
import Banner from "@/components/Banner";

const Register = () => {
  const { userLoggedIn } = useAuth();

  return (
    <>
      {userLoggedIn && <Navigate to={"/"} replace={true} />}
      <div className="login-page">
        {/* purple - #9D00FF, #B069DB, #6E00B3, #3C0061 */}
        <div className="login-form">
          <GoogleSignIn />
          <RegistrationForm />
        </div>
        <Banner />
      </div>
    </>
  );
};

export default Register;
