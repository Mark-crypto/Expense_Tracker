import { motion } from "framer-motion";

const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: "linear",
    },
  },
};

const Loading = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
      <motion.div
        variants={spinnerVariants}
        animate="animate"
        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
      />
    </div>
  );
};

export default Loading;
