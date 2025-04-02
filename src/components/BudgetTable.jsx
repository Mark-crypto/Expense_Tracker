import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import { useFetch } from "@/hooks/useFetch";

const BudgetTable = () => {
  const url = "http://localhost:5000/api/budget";
  const { data, loading, error } = useFetch(url);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
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
          {data.map((item, index) => {
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
                <td>Calculate exceeding by</td>
                <td>
                  <Button className="" variant="danger">
                    Delete
                  </Button>
                </td>
              </tr>
            );
          })}
          <tr>
            <td>1</td>
            <td>March Shopping</td>
            <td>Utilities</td>
            <td>Sh 4500</td>
            <td style={{ color: "green", fontWeight: "bold" }}>
              Within Budget
            </td>
            <td>Sh 0</td>
            <td>
              <Button className="" variant="danger">
                Delete
              </Button>
            </td>
          </tr>
          <tr>
            <td>1</td>
            <td>January Bills</td>
            <td>Housing</td>
            <td>Sh 20000</td>
            <td style={{ color: "red", fontWeight: "bold" }}>
              Budget exceeded
            </td>
            <td>Sh 1000</td>
            <td>
              <Button className="" variant="danger">
                Delete
              </Button>
            </td>
          </tr>
        </tbody>
      </Table>
    </>
  );
};

export default BudgetTable;
