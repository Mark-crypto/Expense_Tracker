import { FaGoogle } from "react-icons/fa";
import { useState } from "react";
import { doSignInWithGoogle } from "../services/auth";

const GoogleSignIn = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState("");

  const onGoogleSignIn = async () => {
    if (!isSigningIn) {
      setIsSigningIn(true);
      doSignInWithGoogle().catch((err) => {
        setIsSigningIn(false);
        setError(err.message);
      });
    }
  };
  if (error) {
    return <div style={{ color: "red" }}>{error.message}</div>;
  }
  return (
    <>
      <h3 style={{ color: "#9D00FF" }}>Welcome Back</h3>
      <h6>Enter your details</h6>

      <button type="button" className="auth-btn" onClick={onGoogleSignIn}>
        <FaGoogle
          style={{
            marginRight: "5px",
            fontSize: "17px",
            color: "#9D00FF",
          }}
        />
        Sign in with Google
      </button>

      <div style={{ margin: "20px", display: "flex", alignItems: "center" }}>
        <div
          style={{ flex: "1", height: "1px", backgroundColor: "gray" }}
        ></div>
        <p style={{ margin: "0 10px" }}>OR</p>
        <div
          style={{ flex: "1", height: "1px", backgroundColor: "gray" }}
        ></div>
      </div>
    </>
  );
};

export default GoogleSignIn;
