import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import { useFetch } from "@/hooks/useFetch";
import LoadingSpinner from "./LoadingSpinner";
import ErrorPage from "./ErrorPage";
import { expenseAmount } from "./HistoryTable";

//If budget amount is greater than expense amount then budget is exceeded

const BudgetTable = () => {
  const url = "http://localhost:5000/api/budget";
  const { data, loading, error } = useFetch(url);
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorPage />;
  return (
    <>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Budget Name</th>
            <th>Category</th>
            <th>Budget Amount</th>
            <th>Status</th>
            <th>Budget Exceeded By </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length !== 0 ? (
            data.map((item, index) => {
              return (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.amount}</td>
                  <td
                    style={{
                      color: item.status === "Within Budget" ? "green" : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {item.status}
                  </td>
                  <td>{expenseAmount - item.amount}</td>
                  <td>
                    <Button className="" variant="danger">
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                No budget data available
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
};

export default BudgetTable;
