import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, X, CheckCircle2, Trash2 } from "lucide-react";
import axiosInstance from "@/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { Form } from "react-bootstrap";

const LimitNotification = () => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["limit-notification"],
    queryFn: async () => {
      const res = await axiosInstance.get("/notifications");
      return res.data;
    },
    refetchInterval: 30000,
  });

  const notificationsData = data?.data || [];
  const unreadCount = notificationsData.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNotification) return;
    try {
      const payload = {
        action: selectedOption,
        newAmount: selectedOption === "set-custom-limit" ? customAmount : null,
      };
      await axiosInstance.post(
        `/notifications/action/${selectedNotification.id}`,
        payload
      );

      await axiosInstance.patch(
        `/notifications/mark-as-read/${selectedNotification.id}`
      );
      refetch();
    } catch (error) {}
  };
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 right-6 z-50"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setDrawerOpen(true)}
          className="relative w-14 h-14 rounded-full transition-all duration-200 
                     cursor-pointer bg-white/90 backdrop-blur-sm border border-purple-200 
                     hover:bg-purple-50 hover:border-purple-300 hover:shadow-xl
                     shadow-lg group flex items-center justify-center"
        >
          <div className="relative">
            <Bell className="w-5 h-5 text-purple-600 transition-colors group-hover:text-purple-700" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 
                           text-white text-xs font-bold rounded-full w-4 h-4 flex items-center 
                           justify-center shadow-lg border border-white text-[10px]"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </div>
          {unreadCount > 0 && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-red-400"
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: [0, 0.8, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 100 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
              }}
              className="fixed top-20 right-6 w-80 max-h-[calc(100vh-6rem)] bg-white/95 backdrop-blur-xl 
                         shadow-2xl border border-purple-200/50 rounded-2xl z-50 
                         flex flex-col overflow-hidden"
              style={{
                maxWidth: "calc(100vw - 3rem)",
              }}
            >
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-pink-500 border-b border-purple-100">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <p className="text-xs text-white mt-1">
                      {unreadCount} unread{" "}
                      {unreadCount === 1 ? "message" : "messages"}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDrawerOpen(false)}
                    className="p-1.5 hover:bg-white/50 rounded-lg transition-all"
                  >
                    <X className="w-6 h-6 text-white" />
                  </motion.button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-32">
                    <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                    <p className="text-gray-500 text-xs mt-2">
                      Loading notifications...
                    </p>
                  </div>
                ) : error ? (
                  <div className="text-center p-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <X className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-red-500 text-sm font-medium">
                      Failed to load notifications
                    </p>
                    <button
                      onClick={() => refetch()}
                      className="mt-2 px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                    >
                      Try Again
                    </button>
                  </div>
                ) : notificationsData.length === 0 ? (
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">
                      No notifications
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      You're all caught up!
                    </p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {notificationsData.map((notification) => (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        whileHover={{ scale: 1.01 }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all
                                  shadow-sm hover:shadow-md relative group
                                  ${
                                    notification.status === "unread"
                                      ? "border-purple-300 bg-gradient-to-r from-purple-50 to-white border-l-4 border-l-purple-500"
                                      : "border-gray-100 bg-white"
                                  }`}
                        onClick={() => setSelectedNotification(notification)}
                      >
                        {/* Unread indicator */}
                        {notification.status === "unread" && (
                          <div className="absolute top-3 left-2 w-1.5 h-1.5 bg-purple-500 rounded-full" />
                        )}

                        <div className="flex items-start gap-2">
                          <span className={`text-sm flex-shrink-0`}>✉️</span>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 leading-snug">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">
                              {new Date(
                                notification.created_at
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedNotification(null)}
          >
            <motion.div
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence>
                {selectedNotification && (
                  <motion.div
                    className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[60] p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedNotification(null)}
                  >
                    <motion.div
                      className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                      initial={{ scale: 0.9, y: 20, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      exit={{ scale: 0.9, y: 20, opacity: 0 }}
                      transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 200,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 p-6 relative">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm">
                            <span className="text-2xl text-white">✉️</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white">
                              Budget Limit Exceeded Alert
                            </h3>
                            <p className="text-purple-100 text-sm mt-1">
                              Action required for your budget
                            </p>
                          </div>
                        </div>
                        <div className="absolute top-4 right-4">
                          <button
                            onClick={() => setSelectedNotification(null)}
                            className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                          >
                            <X className="w-6 h-6 text-white" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-gray-800 text-sm leading-relaxed font-medium">
                                {selectedNotification.message}
                              </p>
                              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <span>📅</span>
                                  {new Date(
                                    selectedNotification.created_at
                                  ).toLocaleDateString()}
                                </span>
                                {selectedNotification.status === "unread" && (
                                  <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                    Unread
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Card */}
                        <div className="p-6">
                          <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-1">
                              <div className="text-center mb-6 pt-4">
                                <h5 className="text-lg font-bold text-gray-900 mb-2">
                                  Choose Your Action
                                </h5>
                                <p className="text-gray-600 text-sm">
                                  Select how you want to handle this budget
                                  limit
                                </p>
                              </div>

                              <Form onSubmit={handleSubmit}>
                                <div className="space-y-3 px-4 pb-4">
                                  <Form.Check
                                    type="radio"
                                    id="keep-active"
                                    label={
                                      <div className="ms-3 py-1">
                                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          Keep Budget Active
                                        </div>
                                        <div className="text-gray-600 text-xs mt-1 leading-relaxed">
                                          Continue using the current limit and
                                          monitor overspending.
                                        </div>
                                      </div>
                                    }
                                    name="budgetAction"
                                    value="keep-active"
                                    checked={selectedOption === "keep-active"}
                                    onChange={(e) =>
                                      setSelectedOption(e.target.value)
                                    }
                                    className="p-4  mb-4 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-200 cursor-pointer data-[checked]:border-green-500 data-[checked]:bg-green-50"
                                  />

                                  <Form.Check
                                    type="radio"
                                    id="increase-budget"
                                    label={
                                      <div className="ms-3 py-1">
                                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                          Increase Budget Automatically (+15%)
                                        </div>
                                        <div className="text-gray-600 text-xs mt-1 leading-relaxed">
                                          Raise limit by 15% to match your
                                          current spending pattern.
                                        </div>
                                      </div>
                                    }
                                    name="budgetAction"
                                    value="increase-budget"
                                    checked={
                                      selectedOption === "increase-budget"
                                    }
                                    onChange={(e) =>
                                      setSelectedOption(e.target.value)
                                    }
                                    className="p-4 mb-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer data-[checked]:border-blue-500 data-[checked]:bg-blue-50"
                                  />

                                  <Form.Check
                                    type="radio"
                                    id="set-custom-limit"
                                    label={
                                      <div className="ms-3 py-1">
                                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                          Set Custom Budget Limit
                                        </div>
                                        <div className="text-gray-600 text-xs mt-1 leading-relaxed">
                                          Manually choose a new amount that fits
                                          your plan.
                                        </div>
                                      </div>
                                    }
                                    name="budgetAction"
                                    value="set-custom-limit"
                                    checked={
                                      selectedOption === "set-custom-limit"
                                    }
                                    onChange={(e) =>
                                      setSelectedOption(e.target.value)
                                    }
                                    className="p-4 mb-4 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 cursor-pointer data-[checked]:border-purple-500 data-[checked]:bg-purple-50"
                                  />

                                  {selectedOption === "set-custom-limit" && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="mt-4 mx-4 mb-2 p-4 bg-purple-50 border border-purple-200 rounded-xl"
                                    >
                                      <label className="block text-sm font-semibold text-purple-900 mb-3">
                                        Enter New Budget Amount
                                      </label>
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 bg-white px-3 py-2 border border-purple-300 rounded-lg flex-1">
                                          <span className="text-purple-600 font-medium">
                                            KES
                                          </span>
                                          <input
                                            type="number"
                                            value={customAmount}
                                            onChange={(e) =>
                                              setCustomAmount(e.target.value)
                                            }
                                            placeholder="Enter amount..."
                                            className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                                            min="0"
                                            step="100"
                                          />
                                        </div>
                                      </div>
                                      <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                                        Enter the new budget limit you want to
                                        set for this category
                                      </p>
                                    </motion.div>
                                  )}

                                  <Form.Check
                                    type="radio"
                                    id="deactivate-budget"
                                    label={
                                      <div className="ms-3 py-1">
                                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                          Deactivate Budget Tracking
                                        </div>
                                        <div className="text-gray-600 text-xs mt-1 leading-relaxed">
                                          Stop monitoring expenses for this
                                          budget.
                                        </div>
                                      </div>
                                    }
                                    name="budgetAction"
                                    value="deactivate-budget"
                                    checked={
                                      selectedOption === "deactivate-budget"
                                    }
                                    onChange={(e) =>
                                      setSelectedOption(e.target.value)
                                    }
                                    className="p-4 mb-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 cursor-pointer data-[checked]:border-orange-500 data-[checked]:bg-orange-50"
                                  />
                                </div>

                                {/* Confirm Button */}
                                <div className="px-4 pb-6 pt-2">
                                  <div className="flex justify-center">
                                    <button
                                      type="submit"
                                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 
                                 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105
                                 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg
                                 flex items-center gap-2 min-w-[140px] justify-center"
                                      disabled={
                                        !selectedOption ||
                                        (selectedOption ===
                                          "set-custom-limit" &&
                                          !customAmount)
                                      }
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      Confirm Action
                                    </button>
                                  </div>
                                </div>
                              </Form>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LimitNotification;
