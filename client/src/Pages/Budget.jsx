import Navbar from "../components/Navbar";
import BudgetTable from "../components/BudgetTable";
import { useState } from "react";
import BudgetForm from "../components/BudgetForm";
import { FaChartBar } from "react-icons/fa";
import LimitNotification from "../components/LimitNotification";

const Budget = () => {
  const [show, setShow] = useState(false);

  return (
    <div className="flex h-full min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-1/5 bg-white shadow-md">
        <Navbar />
      </aside>

      {/* Main content */}
      <main className="w-4/5 flex items-center justify-center p-6 overflow-y-auto">
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-2xl text-center">
          <LimitNotification />
          <h3
            style={{
              fontWeight: "500",
              color: "#9D00FF",
              marginBottom: "8px",
            }}
          >
            Budget Management
          </h3>
          {/* Budget Form */}
          <div className="mb-6 flex items-center justify-center">
            <BudgetForm />
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setShow((prev) => !prev)}
            className="flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-6 py-2 rounded transition duration-200 w-full"
          >
            <FaChartBar className="text-xl" />
            {show ? "Hide Budget Table" : "Show Budget Table"}
          </button>

          {/* Budget Table */}
          {show && (
            <div className="mt-8">
              <BudgetTable />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Budget;
