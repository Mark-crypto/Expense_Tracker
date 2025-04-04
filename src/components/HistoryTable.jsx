import Table from "react-bootstrap/Table";
import { useFetch } from "@/hooks/useFetch";
import ErrorPage from "./ErrorPage";
import LoadingSpinner from "./LoadingSpinner";

export const expenseAmount = 0;
const HistoryTable = () => {
  const url = "http://localhost:5000/api/expenses";
  const { data, error, loading } = useFetch(url);

  expenseAmount = data.totalAmount;

  if (error) return <ErrorPage />;
  if (loading) return <LoadingSpinner />;
  return (
    <>
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
          {data.length > 0 ? (
            data.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.amount}</td>
                <td>{item.category}</td>
                <td>{item.date}</td>
                <td>{item.totalAmount}</td>
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
