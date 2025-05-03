import Navbar from "../components/Navbar";
import PieChart from "../components/PieChart";
import BarChart from "../components/BarChart";
import Cards from "../components/Cards";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast, ToastContainer } from "react-toastify";

const Dashboard = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      return await axiosInstance.get("/dashboard");
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
          backgroundColor: "rgb(240, 240, 240)",
          height: "100vh",
          width: "80%",
        }}
      >
        <ToastContainer />
        <h2>Dashboard</h2>
        <p>{data.topFive}</p>
        <p>{data.debtAmount}</p>
        <p>{data.bottomFive}</p>
        <p>{data.rollingSum}</p>
        <Cards />
        <div className="dashboard-graphs">
          <div className="dashboard-graph">
            <BarChart />
          </div>
          <div className="dashboard-graph">
            <PieChart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
