import Navbar from "../components/Navbar";
import PieChart from "../components/PieChart";
import BarChart from "../components/BarChart";
import Cards from "../components/Cards";
// import BarChart from "../components/BarChart";

const Dashboard = () => {
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
        <h2>Dashboard</h2>
        {/* <Cards /> */}
        <div className="dashboard-graphs">
          <div className="dashboard-graph">{/* <BarChart /> */}</div>
          <div className="dashboard-graph">{/* <PieChart /> */}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
