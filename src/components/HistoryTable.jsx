import Table from "react-bootstrap/Table";
import ErrorPage from "./ErrorPage";
import LoadingSpinner from "./LoadingSpinner";
import { useContext, useState } from "react";
import { ExpenseContext } from "../context/ExpenseContext";
import axios from "axios";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import ExpenseSearchBar from "./ExpenseSearchBar";

const HistoryTable = () => {
  const { expenseAmount, setExpenseAmount } = useContext(ExpenseContext);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});

  const { isLoading, error, data } = useQuery({
    queryKey: ["expense", page],
    queryFn: async () => {
      const resp = await axios.get(
        `http://localhost:5000/api/expenses?_limit=10&_page=${page}`
      );
      setMeta(resp.data.meta);
      return resp.data;
    },
    placeholderData: keepPreviousData,
  });
  const month = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const from = (page - 1) * meta.limit + 1;
  const to = Math.min(page * meta.limit, meta.total);
  if (error) return <ErrorPage />;
  if (isLoading) return <LoadingSpinner />;
  return (
    <>
      <div>
        <strong>
          Showing {from}–{to} of {meta.total} expenses
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
            data.data.map((item, index) => (
              <tr key={item.expense_id}>
                <td>{index + 1}</td>
                <td>{month[new Date(item.date_created).getMonth()]}</td>
                <td>{item.category}</td>
                <td>{item.date_created.split("T")[0]}</td>
                <td>{item.amount}</td>
                <td>{expenseAmount}</td>
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
      <button onClick={() => setPage((prev) => prev - 1)} disabled={page <= 0}>
        Previous Page
      </button>
      <button
        onClick={() => setPage((prev) => prev + 1)}
        disabled={page >= meta.totalPages}
      >
        Next Page
      </button>
    </>
  );
};

export default HistoryTable;
