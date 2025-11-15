import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import axiosInstance from "@/axiosInstance.js";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import Loading from "@/components/Loading";
import LimitNotification from "@/components/LimitNotification";

const Prediction = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["predictions"],
    queryFn: async () => await axiosInstance("/predictions"),
  });

  const percentChange = data?.data?.percentChange;
  const avgDailyExpense = data?.data?.avgDailyExpense;
  const timePassedPercent = data?.data?.timePassedPercent;
  const budgetUsedPercent = data?.data?.budgetUsedPercent;
  const categoryPercent = data?.data?.categoryPercent;
  const weeklyChange = data?.data?.weeklyChange;
  const monthlyTotal = data?.data?.monthlyTotal;
  const projectedExpense = data?.data?.projectedExpense;
  const budgetProgressMessage = data?.data?.budgetProgressMessage;
  const projectionMessage = data?.data?.projectionMessage;

  if (isLoading) return <Loading />;
  if (error) toast.error("Something went wrong");

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md fixed h-full z-10">
        <Navbar />
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-6 space-y-6 overflow-auto">
        <LimitNotification />
        <p>Predictions page</p>
      </main>
    </div>
  );
};

export default Prediction;
