import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { DollarSign, TrendingDown, TrendingUp, PieChart } from "lucide-react";

const iconMap = {
  Debt: <TrendingDown className="text-red-500 w-6 h-6" />,
  "Top Category": <TrendingUp className="text-green-500 w-6 h-6" />,
  "Bottom Category": <PieChart className="text-yellow-500 w-6 h-6" />,
  "Total Spent": <DollarSign className="text-purple-500 w-6 h-6" />,
};

const DashboardCard = ({ title, data }) => {
  const icon = iconMap[title] || <PieChart className="text-gray-500 w-6 h-6" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Card className="bg-white rounded-2xl shadow hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            {title}
          </CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <p
            className="text-2xl font-bold text-purple-700 "
            style={{ textTransform: "capitalize" }}
          >
            {title === "Total Spent" || title === "Debt" ? (
              <CountUp end={parseFloat(data)} duration={1.8} separator="," />
            ) : (
              data || "N/A"
            )}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardCard;
