import React from "react";
import Navbar from "../components/Navbar";
import revenue from "../assets/revenue.svg";
import debt from "../assets/debt.svg";
import budget from "../assets/budget.svg";

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
        <h1>
          Dashboard - cards(total spent, debt, budgeted), graph bottom (category
          vs amount), pie side(month vs expenditure)
        </h1>
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
      </div>
    </div>
  );
};

export default Dashboard;
