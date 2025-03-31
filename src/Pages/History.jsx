import Navbar from "../components/Navbar";
import Table from "react-bootstrap/Table";
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
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Date</th>
              <th>Total Expenditure(All expenses)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Sh 3000</td>
              <td>Utilities</td>
              <td>12/12/24</td>
              <td>Sh 3000</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Sh 24000</td>
              <td>Housing</td>
              <td>01/01/25</td>
              <td>Sh 27000</td>
            </tr>
            <tr>
              <td>3</td>
              <td>Sh 2000</td>
              <td>Transportation</td>
              <td>31/01/25</td>
              <td>Sh 29000</td>
            </tr>
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default History;
