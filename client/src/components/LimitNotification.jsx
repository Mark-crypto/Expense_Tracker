import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, XCircle, CheckCircle } from "lucide-react";

const LimitNotification = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const eventSource = new EventSource(
      "http://localhost:5050/api/notifications",
      {
        withCredentials: true,
      }
    );

    eventSource.addEventListener("notification", (event) => {
      const data = JSON.parse(event.data);
      // If server sends a list, flatten it
      const newItems = Array.isArray(data) ? data : [data];
      setNotifications((prev) => [...newItems, ...prev]);
    });

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  const actions = [
    {
      id: "keep-active",
      label: "Keep budget active",
      description:
        "Continue using the current KES 5,000 limit and monitor overspending",
      badge: "Current",
    },
    {
      id: "increase-budget",
      label: "Increase budget automatically",
      description:
        "Raise limit by 15% to KES 5,750 to match your spending pattern",
      badge: "+15%",
    },
    {
      id: "set-new-limit",
      label: "Set new limit",
      description:
        "Manually choose a custom amount that fits your financial plan",
      badge: "Custom",
    },
    {
      id: "deactivate-budget",
      label: "Deactivate budget",
      description: "Stop tracking expenses for this category",
      badge: "Stop",
    },
  ];

  const handleAction = (actionId, notification) => {
    console.log(
      `Action [${actionId}] selected for notification:`,
      notification
    );
    // TODO: send POST to backend to apply chosen action
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 space-y-4">
      <AnimatePresence>
        {notifications.map((notif, i) => (
          <motion.div
            key={notif.id || i}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                  {notif.title || "Budget Limit Reached"}
                </h4>
              </div>
              <button
                onClick={() =>
                  setNotifications((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={18} />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {notif.message ||
                "Your expenses have exceeded the set budget limit."}
            </p>

            <div className="grid grid-cols-2 gap-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id, notif)}
                  className="group border border-gray-200 rounded-xl p-2 hover:bg-indigo-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">
                      {action.label}
                    </span>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg">
                      {action.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {action.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-3">
              <button
                className="flex items-center space-x-1 text-xs text-green-600 hover:text-green-700"
                onClick={() => {
                  setNotifications((prev) =>
                    prev.filter((_, idx) => idx !== i)
                  );
                }}
              >
                <CheckCircle size={14} /> <span>Mark as read</span>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {notifications.length === 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-2xl shadow-lg p-4 flex items-center justify-center space-x-2">
          <Bell className="text-gray-400" />
          <span className="text-gray-500 text-sm">No new notifications</span>
        </div>
      )}
    </div>
  );
};

export default LimitNotification;
