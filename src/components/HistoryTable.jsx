import Table from "react-bootstrap/Table";
import { useFetch } from "@/hooks/useFetch";

const HistoryTable = () => {
  const url = "http://localhost:5000/api/expenses";
  const { data, error, loading } = useFetch(url);

  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (loading) {
    return <div>Loading...</div>;
  }
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
    </>
  );
};

export default HistoryTable;
