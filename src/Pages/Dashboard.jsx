import React from "react";
import Navbar from "../components/Navbar";
import revenue from "../assets/revenue.svg";
import debt from "../assets/debt.svg";
import budget from "../assets/budget.svg";
// import BarChart from "../components/BarChart";
import PieChart from "../components/PieChart";
import BarChart from "../components/BarChart";

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
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div>
              <h4 style={{ color: "#9d00ff", fontWeight: "bold" }}>
                Total Spent:
              </h4>{" "}
              <h4 style={{ fontWeight: "bold" }}>Sh 30000</h4>
            </div>
            <img src={revenue} alt="revenue" style={{ width: "100px" }} />
          </div>
          <div className="dashboard-card">
            <div>
              <h4 style={{ color: "#9d00ff", fontWeight: "bold" }}>Debt:</h4>{" "}
              <h4 style={{ fontWeight: "bold" }}>Sh 4000</h4>
            </div>
            <img src={debt} alt="revenue" style={{ width: "100px" }} />
          </div>
          <div className="dashboard-card">
            <div>
              <h4 style={{ color: "#9d00ff", fontWeight: "bold" }}>
                Budgeted:
              </h4>{" "}
              <h4 style={{ fontWeight: "bold" }}>Sh 50000</h4>
            </div>
            <img src={budget} alt="revenue" style={{ width: "100px" }} />
          </div>
        </div>
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
