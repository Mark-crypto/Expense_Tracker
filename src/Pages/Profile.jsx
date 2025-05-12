import { FaUserCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import { toast } from "react-toastify";

const Profile = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      return await axiosInstance.get("/profile");
    },
  });
  if (isLoading) {
    return <h1>Loading....</h1>;
  }
  if (error) {
    toast.error("SOmething went wrong");
  }
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
          <h2 className="text-xl font-semibold text-gray-800">Mark Abong'o</h2>
          <p className="text-gray-500">Occupation: Web Developer</p>
          <p className="text-gray-500">Age: 29</p>
          <div className="flex justify-center space-x-4">
            <a href={`/profile-form/${data?.data?.profile_id}`}>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-purple-700 transition">
                Edit Profile
              </button>
            </a>
            <a href="/history">
              <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm hover:bg-gray-300 transition">
                View Expenses
              </button>
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
