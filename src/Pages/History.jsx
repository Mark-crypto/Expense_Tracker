import HistoryTable from "../components/HistoryTable";
import Navbar from "../components/Navbar";
import { MdDelete } from "react-icons/md";

const History = () => {
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
        <button
          style={{
            backgroundColor: "#9d00ff",
            color: "white",
            border: "none",
            padding: "10px",
            margin: "40px 0px 20px 10px",
            borderRadius: "5px",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          <MdDelete style={{ marginRight: "10px", fontSize: "20px" }} />
          Clear All History
        </button>
        <HistoryTable />
      </div>
    </div>
  );
};

export default History;
