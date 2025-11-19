import { motion } from "framer-motion";
import { FaUsers, FaUserCheck, FaUserClock, FaUserPlus } from "react-icons/fa";

const UserCard = ({ activeUsers, inactiveUsers, newUsers, totalUsers }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const stats = [
    {
      label: "Total Users",
      value: totalUsers[0]?.total_users || 0,
      icon: FaUsers,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      borderColor: "border-blue-200",
      textColor: "text-blue-100",
      delay: 0.1,
    },
    {
      label: "Active Users",
      value: activeUsers[0]?.active_users || 0,
      icon: FaUserCheck,
      color: "bg-gradient-to-r from-green-500 to-green-600",
      borderColor: "border-green-200",
      textColor: "text-green-100",
      delay: 0.2,
    },
    {
      label: "Inactive Users",
      value: inactiveUsers[0]?.inactive_users || 0,
      icon: FaUserClock,
      color: "bg-gradient-to-r from-yellow-500 to-yellow-600",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-100",
      delay: 0.3,
    },
    {
      label: "New Users (Last Week)",
      value: newUsers[0]?.users_last_week || 0,
      icon: FaUserPlus,
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      borderColor: "border-purple-200",
      textColor: "text-purple-100",
      delay: 0.4,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: stat.delay }}
          whileHover={{
            scale: 1.02,
            y: -5,
            transition: { type: "spring", stiffness: 300 },
          }}
          className={`relative overflow-hidden rounded-2xl shadow-lg border ${stat.borderColor} backdrop-blur-sm`}
        >
          <div className={`absolute inset-0 ${stat.color} opacity-90`}></div>

          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white rounded-full"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white rounded-full"></div>
          </div>

          <div className="relative z-10 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p
                  className={`text-sm font-semibold ${stat.textColor} uppercase tracking-wider`}
                >
                  {stat.label}
                </p>
                <motion.p
                  className="text-3xl font-bold mt-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: stat.delay + 0.2, type: "spring" }}
                >
                  {stat.value.toLocaleString()}
                </motion.p>
              </div>

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: stat.delay + 0.1, type: "spring" }}
                className={`p-3 rounded-full bg-white/20 backdrop-blur-sm`}
              >
                <stat.icon className="text-2xl" />
              </motion.div>
            </div>
          </div>

          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: -100 }}
            whileHover={{ x: 400 }}
            transition={{ duration: 0.8 }}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default UserCard;
