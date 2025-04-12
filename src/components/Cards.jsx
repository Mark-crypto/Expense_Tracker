import revenue from "../assets/revenue.svg";
import debt from "../assets/debt.svg";
import budget from "../assets/budget.svg";
import { useFetch } from "../hooks/useFetch";
import { useParams } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import ErrorPage from "./ErrorPage";
import { expenseAmount } from "./HistoryTable";

const Cards = () => {
  //get id from url
  const id = useParams().id;
  const url = `http:localhost:5000/api/dashboard/${id}`;
  const { data, loading, error } = useFetch(url);
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorPage />;

  // Add data to cards
  return (
    <>
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div>
            <h4 style={{ color: "#9d00ff", fontWeight: "bold" }}>
              Total Spent:
            </h4>{" "}
            <h4 style={{ fontWeight: "bold" }}>Sh {expenseAmount}</h4>
          </div>
          <img src={revenue} alt="revenue" style={{ width: "100px" }} />
        </div>
        <div className="dashboard-card">
          <div>
            <h4 style={{ color: "#9d00ff", fontWeight: "bold" }}>Debt:</h4>{" "}
            <h4 style={{ fontWeight: "bold" }}>Sh {data.debtData.amount}</h4>
          </div>
          <img src={debt} alt="revenue" style={{ width: "100px" }} />
        </div>
        <div className="dashboard-card">
          <div>
            <h4 style={{ color: "#9d00ff", fontWeight: "bold" }}>Budgeted:</h4>{" "}
            <h4 style={{ fontWeight: "bold" }}>Sh {data.budgetData}</h4>
          </div>
          <img src={budget} alt="revenue" style={{ width: "100px" }} />
        </div>
      </div>
    </>
  );
};

export default Cards;
