import Navbar from "../components/Navbar";
import PieChart from "../components/PieChart";
import BarChart from "../components/BarChart";
import Cards from "../components/Cards";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast, ToastContainer } from "react-toastify";
import TopFiveRolling from "@/components/TopFiveRolling";
import BottomFiveRolling from "@/components/BottomFiveRolling";
import Rolling from "@/components/Rolling";

const Dashboard = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      return await axiosInstance.get("/dashboard");
    },
  });
  console.log(data.data);
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
        <TopFiveRolling data={data.data.topFive} />
        <BottomFiveRolling data={data.data.bottomFive} />
        <Rolling data={data.data.rollingSum} />
        <p>Debt : {data.data.debtAmount[0].debt}</p>
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
