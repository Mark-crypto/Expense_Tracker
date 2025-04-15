import Table from "react-bootstrap/Table";
import ErrorPage from "./ErrorPage";
import LoadingSpinner from "./LoadingSpinner";
import { useContext, useState } from "react";
import { ExpenseContext } from "../context/ExpenseContext";
import axios from "axios";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

const HistoryTable = () => {
  const { expenseAmount, setExpenseAmount } = useContext(ExpenseContext);
  const [page, setPage] = useState(1);

  const { isLoading, error, data } = useQuery({
    queryKey: ["expense", page],
    queryFn: async ({ queryKey }) => {
      const [, page] = queryKey;
      const resp = await axios.get(
        `http://localhost:5000/api/expenses?_limit=10&_page=${page}`
      );
      return resp.data;
    },
    placeholderData: keepPreviousData,
  });

  const from = (page - 1) * data.meta.limit + 1;
  const to = Math.min(page * data.meta.limit, data.meta.total);
  if (error) return <ErrorPage />;
  if (isLoading) return <LoadingSpinner />;
  return (
    <>
      <div>
        <strong>
          Showing {from}–{to} of {data.meta.total} expenses
        </strong>
      </div>
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
          {data.data.length > 0 ? (
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
      <button onClick={() => setPage((prev) => prev - 1)} disabled={page <= 0}>
        Previous Page
      </button>
      <button
        onClick={() => setPage((prev) => prev + 1)}
        disabled={page > data.meta.totalPages}
      >
        Next Page
      </button>
    </>
  );
};

export default HistoryTable;
