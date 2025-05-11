import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import { toast } from "react-toastify";
import LoadingSpinner from "./LoadingSpinner";

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
    <div className="mt-6">
      <p className="text-sm text-gray-600 mb-2 font-medium">
        Showing {from}–{to} of {expenseData?.data?.meta?.total} expenses
      </p>

      <div className="overflow-x-auto rounded shadow-sm">
        <table className="min-w-full bg-white border border-gray-200 text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-xs uppercase font-semibold text-gray-600">
            <tr>
              <th className="py-3 px-4 border-b">Month</th>
              <th className="py-3 px-4 border-b">Category</th>
              <th className="py-3 px-4 border-b">Date</th>
              <th className="py-3 px-4 border-b">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenseData?.data?.data?.length > 0 ? (
              expenseData.data.data.map((item) => (
                <tr
                  key={item.expense_id}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="py-3 px-4 border-b">
                    {month[new Date(item.date_created).getMonth()]}
                  </td>
                  <td className="py-3 px-4 border-b">{item.category}</td>
                  <td className="py-3 px-4 border-b">
                    {item.date_created.split("T")[0]}
                  </td>
                  <td className="py-3 px-4 border-b text-purple-700 font-semibold">
                    KES {Number(item.amount).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-4 px-4 text-center text-gray-500">
                  No expenses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={() => setPage((prev) => prev - 1)}
          disabled={page <= 1}
          className={`px-4 py-2 rounded text-sm font-medium transition ${
            page <= 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          Previous
        </button>
        <span className="text-sm text-gray-600 mt-2">Page {page}</span>
        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={
            !expenseData?.data?.meta || page >= expenseData.data.meta.totalPages
          }
          className={`px-4 py-2 rounded text-sm font-medium transition ${
            page >= expenseData?.data?.meta?.totalPages
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default HistoryTable;
