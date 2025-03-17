import React from "react";
import Navbar from "../components/Navbar";

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
          backgroundColor: "#9D00FF",
          height: "100vh",

          width: "80%",
        }}
      >
        <h1>
          Dashboard - cards(total spent, debt, budgeted), graph bottom (category
          vs amount), pie side(month vs expenditure)
        </h1>
      </div>
    </div>
  );
};

export default Dashboard;
