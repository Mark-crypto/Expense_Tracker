import { FaGoogle } from "react-icons/fa";
import { useState } from "react";
import { doSignInWithGoogle } from "../services/auth";
import { motion } from "framer-motion";

const GoogleSignIn = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState("");

  const onGoogleSignIn = async () => {
    if (!isSigningIn) {
      setIsSigningIn(true);
      try {
        await doSignInWithGoogle();
      } catch (err) {
        setError(err.message);
        setIsSigningIn(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <h3 className="text-2xl font-semibold text-purple-700 mb-1">
        Welcome Back
      </h3>
      <h6 className="text-sm text-gray-600 mb-6">
        Enter your details to continue
      </h6>

      {error && (
        <div className="mb-4 text-red-600 text-sm bg-red-100 border border-red-200 p-2 rounded">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onGoogleSignIn}
        disabled={isSigningIn}
        className={`w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition duration-300 shadow-sm ${
          isSigningIn ? "cursor-not-allowed opacity-60" : ""
        }`}
      >
        <FaGoogle className="text-purple-600 text-lg" />
        {isSigningIn ? "Signing in..." : "Sign in with Google"}
      </button>

      {/* <div className="flex items-center my-6">
        <div className="flex-grow h-px bg-gray-300"></div>
        <span className="px-3 text-gray-400 text-sm">OR</span>
        <div className="flex-grow h-px bg-gray-300"></div>
      </div> */}
    </motion.div>
  );
};

export default GoogleSignIn;
