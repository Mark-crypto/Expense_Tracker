import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";

const BudgetTable = () => {
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
