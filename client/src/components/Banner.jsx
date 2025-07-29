import { motion } from "framer-motion";

const Banner = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7 }}
      className="w-full rounded h-full bg-gradient-to-br from-purple-700 to-purple-900 text-white p-10 flex flex-col justify-center items-start"
    >
      <h1 className="text-5xl font-extrabold italic mb-4 leading-tight">
        Expense Tracker
      </h1>
      <p className="text-lg mb-2">Keep track of your expenses</p>
      <p className="text-base text-purple-200">
        Spend responsibly today with us at{" "}
        <span className="text-white font-semibold italic">Expense Tracker</span>
        .
      </p>
    </motion.div>
  );
};

export default Banner;
