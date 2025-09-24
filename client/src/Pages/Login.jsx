import { motion } from "framer-motion";
import LoginForm from "../components/LoginForm";
import Banner from "../components/Banner";
// import GoogleSignIn from "../components/GoogleSignIn";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-white px-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row shadow-2xl rounded-3xl overflow-hidden bg-white border border-gray-100">
        {/* Left: Form Section */}
        <motion.div
          className="w-full lg:w-1/2 p-10 flex flex-col justify-center"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <LoginForm />
        </motion.div>

        {/* Right: Banner Section */}
        <motion.div
          className="w-full lg:w-1/2 bg-purple-50  "
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Banner />
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
