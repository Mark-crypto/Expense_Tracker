import Navbar from "../components/Navbar";
import BudgetTable from "../components/BudgetTable";
import { useState } from "react";
import BudgetForm from "../components/BudgetForm";
import { FaChartBar } from "react-icons/fa";
import LimitNotification from "../components/LimitNotification";

const Budget = () => {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      {/* Sidebar Navbar - Hidden on mobile, shown on desktop */}
      <div className="w-full lg:w-64 xl:w-1/5">
        <Navbar />
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 flex items-center justify-center overflow-y-auto">
        <div className="bg-white shadow-lg rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8 w-full max-w-4xl text-center">
          {/* Limit Notification */}
          <div className="mb-4 md:mb-6">
            <LimitNotification />
          </div>

          {/* Title */}
          <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-purple-700 mb-3 md:mb-4">
            Budget Management
          </h3>

          {/* Budget Form */}
          <div className="mb-4 md:mb-6">
            <BudgetForm />
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setShow((prev) => !prev)}
            className="flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg transition duration-200 w-full text-sm md:text-base font-medium"
          >
            <FaChartBar className="text-lg md:text-xl" />
            {show ? "Hide Budget Table" : "Show Budget Table"}
          </button>

          {/* Budget Table (Conditional) */}
          {show && (
            <div className="mt-6 md:mt-8 overflow-x-auto">
              <BudgetTable />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Budget;
