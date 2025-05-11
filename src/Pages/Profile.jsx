import { FaUserCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

const Profile = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-8">
        <motion.div
          className="max-w-md mx-auto bg-white  shadow-2xl rounded-2xl p-6 text-center space-y-4 border border-gray-100"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center">
            <FaUserCircle className="text-gray-400 text-7xl" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Mark Abongo</h2>
          <p className="text-gray-500">Full Stack Developer | IT Specialist</p>
          <div className="flex justify-center space-x-4">
            <button className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-purple-700 transition">
              Edit Profile
            </button>
            <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm hover:bg-gray-300 transition">
              View Expenses
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
