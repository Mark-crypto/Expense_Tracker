import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import axiosInstance from "@/axiosInstance.js";
import LoadingSpinner from "@/components/LoadingSpinner.jsx";
import { toast } from "react-toastify";
import CategoryBudget from "@/components/CategoryBudget.jsx";
import CategoryExpense from "@/components/CategoryExpense.jsx";
import TopFiveCategory from "@/components/TopFiveCategory.jsx";
import BottomFive from "@/components/BottomFive.jsx";
import MonthlyAverage from "@/components/MonthlyAverage.jsx";

const Prediction = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["predictions"],
    queryFn: async () => {
      return await axiosInstance("/predictions");
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }
  if (error) {
    toast.error("Something went wrong");
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <div style={{ width: "20%" }}>
        <Navbar />
      </div>
      <div
        style={{
          height: "100vh",

          width: "80%",
        }}
      >
        <CategoryBudget data={data.data.budgetCategory} />
        <CategoryExpense data={data.data.categoryExpense} />
        <TopFiveCategory data={data.data.topFiveCategories} />
        <BottomFive data={data.data.bottomFiveCategories} />
        <MonthlyAverage data={data.data.monthlyAverage} />
      </div>
    </div>
  );
};

export default Prediction;
