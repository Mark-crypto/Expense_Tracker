import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import { toast } from "react-toastify";
import Loading from "./Loading";

const HistoryTable = () => {
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());

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

  const toggleRow = (expenseId) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      return newSet;
    });
  };

  if (isLoading) return <Loading />;

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
              <th className="py-3 px-4 border-b"></th>
              <th className="py-3 px-4 border-b">Month</th>
              <th className="py-3 px-4 border-b">Category</th>
              <th colSpan="2" className="py-3 px-4 border-b text-center">
                Subcategory Details
              </th>
              <th className="py-3 px-4 border-b">Date</th>
              <th className="py-3 px-4 border-b">Amount</th>
            </tr>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 border-b"></th>
              <th className="py-2 px-4 border-b"></th>
              <th className="py-2 px-4 border-b"></th>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Amount</th>
              <th className="py-2 px-4 border-b"></th>
              <th className="py-2 px-4 border-b"></th>
            </tr>
          </thead>
          <tbody>
            {expenseData?.data?.data?.length > 0 ? (
              expenseData?.data?.data?.map((item) => (
                <>
                  {/* Main Row */}
                  <tr
                    key={item.expense_id}
                    className="hover:bg-gray-50 transition cursor-pointer bg-gray-50"
                    onClick={() => toggleRow(item.expense_id)}
                  >
                    <td className="py-3 px-4 border-b">
                      <span
                        className={`transform transition-transform ${
                          expandedRows.has(item.expense_id) ? "rotate-90" : ""
                        }`}
                      >
                        ▶
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b font-medium">
                      {month[new Date(item.date_created).getMonth()]}
                    </td>
                    <td className="py-3 px-4 border-b font-medium">
                      {item.category}
                    </td>
                    <td
                      colSpan="2"
                      className="py-3 px-4 border-b text-center text-gray-600"
                    >
                      {item.subcategories?.length || 0} subcategories
                    </td>
                    <td className="py-3 px-4 border-b">
                      {item.date_created.split("T")[0]}
                    </td>
                    <td className="py-3 px-4 border-b text-purple-700 font-semibold">
                      KES {Number(item.amount).toLocaleString()}
                    </td>
                  </tr>

                  {/* Nested Subcategory Rows */}
                  {expandedRows.has(item.expense_id) &&
                    item.subcategories?.map((subcategory, index) => (
                      <tr
                        key={`${item.expense_id}-${index}`}
                        className="bg-white hover:bg-gray-50 transition-all duration-200"
                      >
                        <td className="py-2 px-4 border-b"></td>
                        <td className="py-2 px-4 border-b"></td>
                        <td className="py-2 px-4 border-b"></td>
                        <td className="py-2 px-4 border-b pl-8 border-l-2 border-purple-300">
                          {subcategory.name}
                        </td>
                        <td className="py-2 px-4 border-b border-l-2 border-purple-300">
                          KES {Number(subcategory.amount).toLocaleString()}
                        </td>
                        <td className="py-2 px-4 border-b"></td>
                        <td className="py-2 px-4 border-b"></td>
                      </tr>
                    ))}
                </>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
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
