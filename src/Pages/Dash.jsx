import React from "react";
import Navbar from "../components/Navbar";
import { Card, CardContent } from "../components/ui/card";
import BarChart from "../components/BarChart";
import PieChart from "../components/PieChart";
import { TrendingUp, CreditCard, Wallet } from "lucide-react";

const Dash = () => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/5 bg-gray-900 text-white p-4">
        <Navbar />
      </div>

      {/* Main Dashboard */}
      <div className="w-4/5 bg-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

        {/* Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center justify-between shadow-lg">
            <div>
              <h4 className="text-purple-600 font-semibold">Total Spent</h4>
              <p className="text-2xl font-bold">Sh 30,000</p>
            </div>
            <TrendingUp className="text-gray-600 w-12 h-12" />
          </Card>

          <Card className="p-4 flex items-center justify-between shadow-lg">
            <div>
              <h4 className="text-red-600 font-semibold">Debt</h4>
              <p className="text-2xl font-bold">Sh 4,000</p>
            </div>
            <CreditCard className="text-gray-600 w-12 h-12" />
          </Card>

          <Card className="p-4 flex items-center justify-between shadow-lg">
            <div>
              <h4 className="text-green-600 font-semibold">Budgeted</h4>
              <p className="text-2xl font-bold">Sh 50,000</p>
            </div>
            <Wallet className="text-gray-600 w-12 h-12" />
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <Card className="p-4 shadow-lg">
            <BarChart />
          </Card>
          <Card className="p-4 shadow-lg">
            <PieChart />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dash;
