import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import BarChart1 from "../components/BarChart1";
import BarChart2 from "../components/BarChart2";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import Loading from "@/components/Loading";
import { toast, ToastContainer } from "react-toastify";
import TopFiveRolling from "@/components/TopFiveRolling";
import BottomFiveRolling from "@/components/BottomFiveRolling";
import DashboardCard from "@/components/DashboardCard";

const Dashboard = () => {
  // const user = JSON.parse(localStorage.getItem("user"));
  const { data, error, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      return await axiosInstance.get(`/dashboard`);
    },
  });

  if (isLoading) {
    return <Loading />;
  }
  if (error) {
    toast.error("Something went wrong");
  }
  return (
    <>
      <div className="flex min-h-screen bg-gray-100 text-gray-800 font-sans">
        <div className="w-1/5 ">
          <Navbar />
        </div>

        <div className="w-4/5 p-6 space-y-6">
          <ToastContainer />
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-semibold text-purple-700"
            style={{ fontWeight: "600", color: "#9D00FF", fontSize: "30px" }}
          >
            Dashboard
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard
              title="Debt"
              data={data?.data?.debtAmount[0]?.debt}
            />
            <DashboardCard
              title="Top Category"
              data={data?.data?.topCategory[0]?.category}
            />
            <DashboardCard
              title="Bottom Category"
              data={data?.data?.lastCategory[0]?.category}
            />
            <DashboardCard
              title="Total Spent"
              data={data?.data?.totalExpense[0]?.total}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow p-4"
            >
              <h3
                className="text-lg font-medium mb-2 text-purple-600"
                style={{
                  fontWeight: "500",
                  color: "#9D00FF",
                  fontSize: "18px",
                  marginBottom: "8px",
                }}
              >
                Monthly Spend
              </h3>
              <BarChart1 data={data?.data?.monthlySum} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl shadow p-4"
            >
              <h3
                className="text-lg font-medium mb-2 text-purple-600"
                style={{
                  fontWeight: "500",
                  color: "#9D00FF",
                  fontSize: "18px",
                  marginBottom: "8px",
                }}
              >
                All Categories
              </h3>
              <BarChart2 data={data.data.allCategories} />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-xl shadow p-4"
            >
              <TopFiveRolling data={data.data.topFive} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-xl shadow p-4"
            >
              <BottomFiveRolling data={data.data.bottomFive} />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
