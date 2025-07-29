import { FaArrowAltCircleDown } from "react-icons/fa";
import { FaArrowAltCircleUp } from "react-icons/fa";
import { motion } from "framer-motion";

const BudgetBtn = ({ show, setShow }) => {
  return (
    <div className="w-full flex justify-center mt-6">
      <motion.button
        type="button"
        onClick={() => setShow(!show)}
        className="
          flex items-center justify-center 
          bg-black hover:bg-purple-700 text-white font-semibold 
          py-3 px-6 rounded-lg shadow-lg 
          transition-all duration-300 ease-in-out
          transform hover:scale-105"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        {show ? (
          <>
            Hide Previous Budgets{" "}
            <FaArrowAltCircleUp className="ml-2 text-xl" />
          </>
        ) : (
          <>
            Show Previous Budgets{" "}
            <FaArrowAltCircleDown className="ml-2 text-xl" />
          </>
        )}
      </motion.button>
    </div>
  );
};

export default BudgetBtn;
