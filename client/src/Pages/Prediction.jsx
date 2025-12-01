import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import axiosInstance from "@/axiosInstance.js";
import { toast, ToastContainer } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import Loading from "@/components/Loading";
import LimitNotification from "@/components/LimitNotification";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "backOut",
    },
  },
  hover: {
    y: -4,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

const progressVariants = {
  hidden: { width: 0 },
  visible: (width) => ({
    width: `${width}%`,
    transition: {
      duration: 1.5,
      ease: "circOut",
      delay: 0.5,
    },
  }),
};

const Prediction = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["predictions"],
    queryFn: async () => await axiosInstance("/predictions"),
  });

  const predictionData = data?.data || {};
  const percentChange = parseFloat(predictionData.percentChange) || 0;
  const avgDailyExpense = parseFloat(predictionData.avgDailyExpense) || 0;
  const timePassedPercent = parseFloat(predictionData.timePassedPercent) || 0;
  const budgetUsedPercent = parseFloat(predictionData.budgetUsedPercent) || 0;
  const categoryPercent = predictionData.categoryPercent || [];
  const weeklyChange = parseFloat(predictionData.weeklyChange) || 0;
  const monthlyTotal = predictionData.monthlyTotal || [];
  const projectedExpense = parseFloat(predictionData.projectedExpense) || 0;
  const budgetProgressMessage = predictionData.budgetProgressMessage || "";
  const projectionMessage = predictionData.projectionMessage || "";

  const currentMonthTotal = monthlyTotal?.[1]?.monthly_total || 0;

  if (isLoading) return <Loading />;
  if (error) {
    toast.error("Failed to load predictions");
    return (
      <div className="flex items-center justify-center min-h-screen">
        Error loading data
      </div>
    );
  }

  const getTrendColor = (value) => {
    if (value > 0) return "text-red-500";
    if (value < 0) return "text-green-600";
    return "text-gray-600";
  };

  const getTrendBg = (value) => {
    if (value > 0) return "bg-red-50 border-red-100";
    if (value < 0) return "bg-green-50 border-green-100";
    return "bg-gray-50 border-gray-100";
  };

  const getProgressColor = (used, time) => {
    if (used > time + 15) return "bg-red-500";
    if (used > time + 5) return "bg-amber-500";
    return "bg-green-500";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Responsive Navbar */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar - Hidden on mobile, shown on desktop */}
        <div className="w-full lg:w-64 lg:fixed lg:h-full lg:z-30 lg:border-r lg:border-gray-200 lg:bg-white lg:shadow-sm">
          <Navbar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-0 xl:ml-64 w-full">
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            <ToastContainer
              position="top-right"
              autoClose={3000}
              theme="light"
              className="!w-[90vw] sm:!w-auto"
            />

            {/* Limit Notification with spacing */}
            <div className="mb-4 md:mb-6">
              <LimitNotification />
            </div>

            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 md:mb-8"
            >
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                Financial Dashboard
              </h1>
              <p className="text-gray-600 text-sm md:text-base mt-1">
                AI-powered spending insights and predictions
              </p>
            </motion.div>

            {/* Top Stats Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            >
              {/* This Month Card */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600">
                      This Month
                    </p>
                    <motion.p
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mt-1"
                    >
                      {formatCurrency(currentMonthTotal)}
                    </motion.p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm md:text-base">💰</span>
                  </div>
                </div>
              </motion.div>

              {/* Monthly Change Card */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className={`bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border ${getTrendBg(
                  percentChange
                )}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600">
                      Monthly Change
                    </p>
                    <motion.p
                      key={percentChange}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className={`text-lg md:text-xl lg:text-2xl font-bold mt-1 ${getTrendColor(
                        percentChange
                      )}`}
                    >
                      {percentChange > 0
                        ? `+${percentChange}%`
                        : `${percentChange}%`}
                    </motion.p>
                  </div>
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      percentChange < 0 ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <span className="text-sm md:text-base">
                      {percentChange < 0 ? "📉" : "📈"}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Projected Month End Card */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600">
                      Projected Month End
                    </p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-lg md:text-xl lg:text-2xl font-bold text-purple-600 mt-1"
                    >
                      {formatCurrency(projectedExpense)}
                    </motion.p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm md:text-base">🔮</span>
                  </div>
                </div>
              </motion.div>

              {/* Daily Average Card */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600">
                      Daily Average
                    </p>
                    <motion.p
                      key={avgDailyExpense}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mt-1"
                    >
                      {formatCurrency(avgDailyExpense)}
                    </motion.p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm md:text-base">📅</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Middle Section - Progress and Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Spending Progress Card */}
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="lg:col-span-2 bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200"
              >
                <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">
                  Spending Progress
                </h2>

                <div className="space-y-4 md:space-y-6">
                  {/* Budget Used Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2 md:mb-3">
                      <span className="text-xs md:text-sm font-medium text-gray-700">
                        Budget Used
                      </span>
                      <motion.span
                        key={budgetUsedPercent}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-xs md:text-sm font-semibold text-gray-900"
                      >
                        {budgetUsedPercent}%
                      </motion.span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 md:h-3 overflow-hidden">
                      <motion.div
                        custom={budgetUsedPercent}
                        variants={progressVariants}
                        initial="hidden"
                        animate="visible"
                        className={`h-2 md:h-3 rounded-full ${getProgressColor(
                          budgetUsedPercent,
                          timePassedPercent
                        )}`}
                      />
                    </div>
                  </div>

                  {/* Month Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2 md:mb-3">
                      <span className="text-xs md:text-sm font-medium text-gray-700">
                        Month Progress
                      </span>
                      <motion.span
                        key={timePassedPercent}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-xs md:text-sm font-semibold text-gray-900"
                      >
                        {timePassedPercent}%
                      </motion.span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 md:h-3 overflow-hidden">
                      <motion.div
                        custom={timePassedPercent}
                        variants={progressVariants}
                        initial="hidden"
                        animate="visible"
                        className="h-2 md:h-3 rounded-full bg-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <p className="text-xs md:text-sm text-blue-800 leading-relaxed">
                    {budgetProgressMessage}
                  </p>
                </motion.div>
              </motion.div>

              {/* Right Side Metrics */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4 md:space-y-6"
              >
                {/* Weekly Change Card */}
                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-600">
                        Weekly Change
                      </p>
                      <motion.p
                        key={weeklyChange}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        className={`text-base md:text-lg lg:text-xl font-bold mt-1 ${getTrendColor(
                          weeklyChange
                        )}`}
                      >
                        {weeklyChange > 0
                          ? `+${weeklyChange}%`
                          : `${weeklyChange}%`}
                      </motion.p>
                    </div>
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs md:text-sm">🔄</span>
                    </div>
                  </div>
                </motion.div>

                {/* Top Category Card */}
                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200"
                >
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600 mb-2">
                      Top Category
                    </p>
                    <AnimatePresence mode="wait">
                      {categoryPercent?.length > 0 ? (
                        <motion.div
                          key="has-data"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <p className="text-sm md:text-base lg:text-lg font-bold text-gray-900 truncate">
                            {categoryPercent[0].category}
                          </p>
                          <p className="text-xs md:text-sm text-purple-600 font-medium">
                            {categoryPercent[0].percent}% of total
                          </p>
                        </motion.div>
                      ) : (
                        <motion.p
                          key="no-data"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-gray-500 text-xs md:text-sm"
                        >
                          No category data
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Spending by Category */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-2">
                <h2 className="text-base md:text-lg font-semibold text-gray-900">
                  Spending by Category
                </h2>
                <span className="text-xs md:text-sm text-gray-500">
                  {categoryPercent.length} categories
                </span>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                <AnimatePresence>
                  {categoryPercent?.length > 0 ? (
                    categoryPercent.map((cat, idx) => (
                      <motion.div
                        key={cat.category}
                        variants={cardVariants}
                        whileHover="hover"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        custom={idx}
                        className="p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[70px] md:min-h-[80px]"
                      >
                        <div className="flex justify-between items-start mb-1 md:mb-2 gap-1">
                          <span className="font-medium text-gray-700 text-[10px] xs:text-xs leading-tight flex-1 pr-1 line-clamp-2">
                            {cat.category}
                          </span>
                          <motion.span
                            key={cat.percent}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="font-semibold text-blue-600 text-[10px] xs:text-xs whitespace-nowrap flex-shrink-0"
                          >
                            {cat.percent}%
                          </motion.span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1 md:h-1.5 overflow-hidden mt-1">
                          <motion.div
                            custom={cat.percent}
                            variants={progressVariants}
                            initial="hidden"
                            animate="visible"
                            className="h-1 md:h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                          />
                        </div>
                        <div className="mt-1 text-[8px] xs:text-[9px] md:text-[10px] text-gray-500 truncate">
                          {formatCurrency(cat.total)}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="col-span-full text-center py-6 md:py-8"
                    >
                      <p className="text-gray-500 text-sm md:text-base">
                        No category data available
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Monthly Comparison */}
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-2">
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">
                      Monthly Comparison
                    </h2>
                    <p className="text-gray-600 text-xs md:text-sm">
                      Current vs. Last Month Performance
                    </p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm md:text-base">📊</span>
                  </div>
                </div>

                {monthlyTotal?.length >= 2 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {/* Current Month */}
                    <motion.div
                      variants={cardVariants}
                      whileHover="hover"
                      className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg md:rounded-xl border border-blue-200"
                    >
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div>
                          <p className="text-blue-700 font-semibold text-xs md:text-sm">
                            CURRENT MONTH
                          </p>
                          <p className="text-gray-600 text-xs">Active period</p>
                        </div>
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs">🔥</span>
                        </div>
                      </div>

                      <motion.p
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2"
                      >
                        {formatCurrency(monthlyTotal[1]?.monthly_total || 0)}
                      </motion.p>

                      <div className="flex items-center gap-1 md:gap-2">
                        <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full"></div>
                        <p className="text-blue-700 text-xs md:text-sm font-medium">
                          Live tracking
                        </p>
                      </div>
                    </motion.div>

                    {/* Last Month */}
                    <motion.div
                      variants={cardVariants}
                      whileHover="hover"
                      className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-lg md:rounded-xl border border-gray-300"
                    >
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div>
                          <p className="text-gray-700 font-semibold text-xs md:text-sm">
                            LAST MONTH
                          </p>
                          <p className="text-gray-600 text-xs">
                            Previous period
                          </p>
                        </div>
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs">📅</span>
                        </div>
                      </div>

                      <motion.p
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2"
                      >
                        {formatCurrency(monthlyTotal[0]?.monthly_total || 0)}
                      </motion.p>

                      <div className="flex items-center gap-1 md:gap-2">
                        <div className="w-2 h-2 md:w-3 md:h-3 bg-gray-500 rounded-full"></div>
                        <p className="text-gray-600 text-xs md:text-sm">
                          Completed period
                        </p>
                      </div>
                    </motion.div>
                  </div>
                ) : monthlyTotal?.length === 1 ? (
                  <div className="grid grid-cols-1 gap-4 md:gap-6">
                    <motion.div
                      variants={cardVariants}
                      whileHover="hover"
                      className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg md:rounded-xl border border-blue-200"
                    >
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div>
                          <p className="text-blue-700 font-semibold text-xs md:text-sm">
                            CURRENT MONTH
                          </p>
                          <p className="text-gray-600 text-xs">
                            Active spending period
                          </p>
                        </div>
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs">🔥</span>
                        </div>
                      </div>

                      <motion.p
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2"
                      >
                        {formatCurrency(monthlyTotal[0]?.monthly_total || 0)}
                      </motion.p>

                      <div className="flex items-center gap-1 md:gap-2">
                        <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <p className="text-blue-700 text-xs md:text-sm font-medium">
                          Live - More data coming soon
                        </p>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 md:py-12"
                  >
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                      <span className="text-gray-400 text-xl md:text-2xl">
                        📊
                      </span>
                    </div>
                    <p className="text-gray-500 font-medium text-sm md:text-base">
                      No monthly data available yet
                    </p>
                    <p className="text-gray-400 text-xs md:text-sm mt-1">
                      Your spending trends will appear here
                    </p>
                  </motion.div>
                )}

                {monthlyTotal?.length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 md:mt-6 p-3 md:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs md:text-sm">
                          💡
                        </span>
                      </div>
                      <div>
                        <p className="text-green-800 font-medium text-xs md:text-sm">
                          {percentChange < 0 ? "Great job! " : "Watch out: "}
                          You're spending {Math.abs(percentChange)}%{" "}
                          {percentChange < 0 ? "less" : "more"} than last month
                        </p>
                        <p className="text-green-600 text-xs mt-1">
                          {percentChange < 0
                            ? "Keep up the good financial habits!"
                            : "Consider reviewing your recent expenses"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* AI Insights Card */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg md:rounded-2xl p-4 md:p-6 shadow-md border border-purple-100"
              >
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                  >
                    <span className="text-white text-base md:text-lg">🤖</span>
                  </motion.div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">
                      AI Insights
                    </h2>
                    <p className="text-purple-600 text-xs md:text-sm font-medium">
                      Smart predictions
                    </p>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/80 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-5 border border-purple-200/50 shadow-sm"
                >
                  <motion.div
                    key={projectionMessage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-2 md:gap-3"
                  >
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-purple-600 text-xs">💡</span>
                    </div>
                    <p className="text-gray-800 leading-relaxed text-sm md:text-base font-medium">
                      {projectionMessage ||
                        "Analyzing your spending patterns to provide personalized insights..."}
                    </p>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-4 md:mt-5 flex items-center gap-2 md:gap-3 text-xs md:text-sm text-purple-700/80"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-5 h-5 md:w-6 md:h-6 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <span className="text-xs">⚡</span>
                  </motion.div>
                  <span className="font-medium truncate">
                    Powered by advanced AI
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Prediction;
