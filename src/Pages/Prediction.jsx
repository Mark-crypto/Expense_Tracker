import { useQuery } from "@tanstack/react-query";
import Navbar from "./Navbar.jsx";
import axiosInstance from "@/axiosInstance.js";
import LoadingSpinner from "@/components/LoadingSpinner.jsx";
import { toast } from "react-toastify";

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
          backgroundColor: "#9D00FF",
          height: "100vh",

          width: "80%",
        }}
      >
        <p>{data.data.monthlyAverage}</p>
        <p>{data.data.topFiveCategories}</p>
        <p>{data.data.bottomFiveCategories}</p>
        <p>{data.data.budgetCategory}</p>
        <p> {data.data.categoryExpense}</p>
      </div>
    </div>
  );
};

export default Prediction;
