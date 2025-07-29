import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import axiosInstance from "@/axiosInstance.js";
import { toast } from "react-toastify";
import CategoryBudget from "@/components/CategoryBudget.jsx";
import CategoryExpense from "@/components/CategoryExpense.jsx";
import TopFiveCategory from "@/components/TopFiveCategory.jsx";
import BottomFive from "@/components/BottomFive.jsx";
import MonthlyAverage from "@/components/MonthlyAverage.jsx";
import { useState } from "react";
import { motion } from "framer-motion";
import Loading from "@/components/Loading";

const Prediction = () => {
  const [amount, setAmount] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["predictions"],
    queryFn: async () => await axiosInstance("/predictions"),
  });

  const handleInput = (e) => setAmount(e.target.value);

  const avgAmount = Math.max(data?.data?.avgAmount[0]?.avg_amount || 0, 1);
  const isHigh = amount > avgAmount;
  const result = isHigh ? "Unexpectedly High Expense" : "Expense Within Budget";

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
        {/* Prediction Input Box */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-md rounded-xl p-6"
        >
          <h1 className="text-2xl font-semibold mb-4 text-purple-700">
            Expense Prediction
          </h1>

          <form className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="font-medium text-gray-700">
              Enter amount to evaluate:
            </label>
            <input
              type="number"
              placeholder="Enter amount"
              onChange={handleInput}
              className="px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </form>

          {amount > 0 && (
            <motion.p
              key={result}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-lg font-semibold mt-4 ${
                isHigh ? "text-red-600" : "text-green-600"
              }`}
            >
              {result}
            </motion.p>
          )}
        </motion.div>

        {/* Category Budget & Expense */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-white p-4 rounded-lg shadow"
          >
            <CategoryBudget data={data.data.budgetCategory} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-white p-4 rounded-lg shadow"
          >
            <CategoryExpense data={data.data.categoryExpense} />
          </motion.div>
        </section>

        {/* Top & Bottom Categories */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-white p-4 rounded-lg shadow"
          >
            <TopFiveCategory data={data.data.topFiveCategories} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white p-4 rounded-lg shadow"
          >
            <BottomFive data={data.data.bottomFiveCategories} />
          </motion.div>
        </section>

        {/* Monthly Average */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-white p-4 rounded-lg shadow mb-10"
        >
          <MonthlyAverage data={data.data.monthlyAverage} />
        </motion.div>
      </main>
    </div>
  );
};

export default Prediction;
