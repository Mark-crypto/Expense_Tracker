import Table from "react-bootstrap/Table";
import LoadingSpinner from "./LoadingSpinner";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import { toast } from "react-toastify";

const HistoryTable = () => {
  const [page, setPage] = useState(1);
  const {
    isLoading,
    error,
    data: expenseData,
  } = useQuery({
    queryKey: ["expense", page],
    queryFn: async () => {
      return await axiosInstance.get(`/expenses?_limit=10&_page=${page}`);
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
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

  if (isLoading) return <LoadingSpinner />;
  const from = (page - 1) * expenseData?.data?.meta?.limit + 1;
  const to = Math.min(
    page * expenseData?.data?.meta?.limit,
    expenseData?.data?.meta?.total
  );
  return (
    <>
      <div>
        <strong>
          Showing {from}–{to} of {expenseData?.data?.meta?.total} expenses
        </strong>
      </div>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Month</th>
            <th>Category</th>
            <th>Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {expenseData?.data?.data?.length > 0 ? (
            expenseData?.data?.data?.map((item) => (
              <tr key={item.expense_id}>
                <td>{month[new Date(item.date_created).getMonth()]}</td>
                <td>{item.category}</td>
                <td>{item.date_created.split("T")[0]}</td>
                <td>{item.amount}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No expenses found</td>
            </tr>
          )}
        </tbody>
      </Table>
      <button onClick={() => setPage((prev) => prev - 1)} disabled={page <= 1}>
        Previous Page
      </button>
      <button
        onClick={() => setPage((prev) => prev + 1)}
        disabled={
          !expenseData?.data?.meta || page >= expenseData.data.meta.totalPages
        }
      >
        Next Page
      </button>
    </>
  );
};

export default HistoryTable;
