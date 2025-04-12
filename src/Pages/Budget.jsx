import Navbar from "../components/Navbar";
import BudgetTable from "../components/BudgetTable";
import { useState } from "react";
import BudgetForm from "../components/BudgetForm";
import BudgetBtn from "../components/BudgetBtn";

const Budget = () => {
  const [show, setShow] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        maxHeight: "100vh",
      }}
    >
      <div style={{ width: "20%", height: "100%" }}>
        <Navbar />
      </div>
      <div
        style={{
          backgroundColor: "#9D00FF",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "80%",
        }}
      >
        <BudgetForm />
        <BudgetBtn show={show} setShow={setShow} />
        <div>{show && <BudgetTable />}</div>
      </div>
    </div>
  );
};

export default Budget;
