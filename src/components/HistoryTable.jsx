import Table from "react-bootstrap/Table";
import ErrorPage from "./ErrorPage";
import LoadingSpinner from "./LoadingSpinner";
import { useContext, useEffect, useState } from "react";
import { ExpenseContext } from "../context/ExpenseContext";
import axios from "axios";

const HistoryTable = () => {
  const url = "http://localhost:5000/api/expenses";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState([]);
  const { expenseAmount, setExpenseAmount } = useContext(ExpenseContext);

  // setExpenseAmount((prev) => prev + 1000);
  useEffect(() => {
    try {
      setLoading(true);
      const fetchData = async () => {
        const response = await axios(url);
        if (response.status !== 200) return console.log("An error occurred");
        setData(response.data.data);
      };
      fetchData();
    } catch (error) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [data]);

  if (error) return <ErrorPage />;
  if (loading) return <LoadingSpinner />;
  return (
    <>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Month</th>
            <th>Category</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Total Expenditure(All expenses)</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, index) => (
              <tr key={item.expense_id}>
                <td>{index + 1}</td>
                <td>{item.month}</td>
                <td>{item.category}</td>
                <td>{item.date_created}</td>
                <td>{item.amount}</td>
                <td>{expenseAmount}</td>
                {/* <td>{item.totalAmount}</td> */}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No expenses found</td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
};

export default HistoryTable;
