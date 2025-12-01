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
import LimitNotification from "@/components/LimitNotification";

const Dashboard = () => {
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
    console.log(error);
    toast.error("Something went wrong");
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100 text-gray-800 font-sans">
        {/* Navbar - Full width on mobile, sidebar on desktop */}
        <div className="w-full lg:w-64 xl:w-1/5">
          <Navbar />
        </div>

        {/* Main content area */}
        <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-x-hidden">
          <ToastContainer />

          {/* Limit Notification with spacing */}
          <div className="mb-4 md:mb-6">
            {" "}
            {/* ADDED SPACING HERE */}
            <LimitNotification />
          </div>

          {/* Page Title with margin-top removed since we have spacing above */}
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl md:text-3xl font-semibold text-purple-700"
            style={{ fontWeight: "600", color: "#9D00FF" }}
          >
            Dashboard
          </motion.h2>

          {/* Stats Cards - Stack on mobile, grid on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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

          {/* Charts Section - INCREASED HEIGHT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl md:rounded-2xl shadow p-3 md:p-4"
            >
              <h3
                className="text-base md:text-lg font-medium mb-2 text-purple-600"
                style={{
                  fontWeight: "500",
                  color: "#9D00FF",
                  marginBottom: "8px",
                }}
              >
                Monthly Spend
              </h3>
              {/* INCREASED CHART HEIGHT */}
              <div className="h-72 sm:h-80 md:h-96 lg:h-[420px] xl:h-[450px]">
                <BarChart1 data={data?.data?.monthlySum} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl md:rounded-2xl shadow p-3 md:p-4"
            >
              <h3
                className="text-base md:text-lg font-medium mb-2 text-purple-600"
                style={{
                  fontWeight: "500",
                  color: "#9D00FF",
                  marginBottom: "8px",
                }}
              >
                All Categories
              </h3>
              {/* INCREASED CHART HEIGHT */}
              <div className="h-72 sm:h-80 md:h-96 lg:h-[420px] xl:h-[450px]">
                <BarChart2 data={data?.data?.allCategories} />
              </div>
            </motion.div>
          </div>

          {/* Top/Bottom Five Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-xl shadow p-3 md:p-4"
            >
              <TopFiveRolling data={data?.data?.topFive} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-xl shadow p-3 md:p-4"
            >
              <BottomFiveRolling data={data?.data?.bottomFive} />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
