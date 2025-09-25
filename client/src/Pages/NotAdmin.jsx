import { motion } from "framer-motion";
import { FaLock, FaArrowLeft, FaExclamationTriangle } from "react-icons/fa";

const NotAdmin = () => {
  const containerVariants = {
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

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
        delay: 0.2,
      },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      backgroundColor: "#3b82f6",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.95,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 text-center"
      >
        {/* Animated Lock Icon */}
        <motion.div
          variants={iconVariants}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center">
              <FaLock className="text-4xl text-red-400" />
            </div>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 w-24 h-24 border-2 border-red-400 rounded-full"
            />
          </div>
        </motion.div>

        {/* Warning Icon */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mb-4"
        >
          <FaExclamationTriangle className="text-yellow-400 text-xl" />
        </motion.div>

        {/* Content */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-3"
        >
          Unauthorized Access
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-gray-300 mb-8 text-lg leading-relaxed"
        >
          You do not have permission to view this page. Please contact an
          administrator if you believe this is an error.
        </motion.p>

        {/* Action Button */}
        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => window.history.back()}
          className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold flex items-center justify-center gap-3 mx-auto transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
        >
          <FaArrowLeft className="text-sm" />
          Go Back
        </motion.button>
      </motion.div>
    </div>
  );
};

export default NotAdmin;
