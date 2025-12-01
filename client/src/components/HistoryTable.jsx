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

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="mt-4 md:mt-6">
      {/* Results Count */}
      <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3 font-medium">
        Showing {from}–{to} of {expenseData?.data?.meta?.total || 0} expenses
      </p>

      {/* Table Container */}
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
        <table className="min-w-full bg-white text-xs md:text-sm text-left text-gray-700">
          {/* Desktop Headers */}
          <thead className="bg-gray-100 uppercase font-semibold text-gray-600 hidden md:table-header-group">
            <tr>
              <th className="py-2 md:py-3 px-3 md:px-4 border-b"></th>
              <th className="py-2 md:py-3 px-3 md:px-4 border-b">Month</th>
              <th className="py-2 md:py-3 px-3 md:px-4 border-b">Category</th>
              <th
                colSpan="2"
                className="py-2 md:py-3 px-3 md:px-4 border-b text-center"
              >
                Subcategory Details
              </th>
              <th className="py-2 md:py-3 px-3 md:px-4 border-b">Date</th>
              <th className="py-2 md:py-3 px-3 md:px-4 border-b">Amount</th>
            </tr>
            <tr className="bg-gray-50">
              <th className="py-2 px-3 md:px-4 border-b"></th>
              <th className="py-2 px-3 md:px-4 border-b"></th>
              <th className="py-2 px-3 md:px-4 border-b"></th>
              <th className="py-2 px-3 md:px-4 border-b text-center">Name</th>
              <th className="py-2 px-3 md:px-4 border-b text-center">Amount</th>
              <th className="py-2 px-3 md:px-4 border-b"></th>
              <th className="py-2 px-3 md:px-4 border-b text-center">Total</th>
            </tr>
          </thead>

          {/* Mobile Header */}
          <thead className="md:hidden bg-gray-100">
            <tr>
              <th
                colSpan="3"
                className="py-2 px-3 text-center text-xs font-semibold text-gray-600"
              >
                Expense History
              </th>
            </tr>
          </thead>

          <tbody>
            {expenseData?.data?.data?.length > 0 ? (
              expenseData?.data?.data?.map((item) => (
                <>
                  {/* Desktop Row */}
                  <tr
                    key={item.expense_id}
                    className="hidden md:table-row hover:bg-gray-50 transition cursor-pointer bg-gray-50"
                    onClick={() => toggleRow(item.expense_id)}
                  >
                    <td className="py-2 md:py-3 px-3 md:px-4 border-b">
                      <span
                        className={`transform transition-transform ${
                          expandedRows.has(item.expense_id) ? "rotate-90" : ""
                        }`}
                      >
                        ▶
                      </span>
                    </td>
                    <td className="py-2 md:py-3 px-3 md:px-4 border-b font-medium">
                      {month[new Date(item.date_created).getMonth()]}
                    </td>
                    <td className="py-2 md:py-3 px-3 md:px-4 border-b font-medium">
                      <span className="capitalize bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                        {item.category}
                      </span>
                    </td>
                    <td
                      colSpan="2"
                      className="py-2 md:py-3 px-3 md:px-4 border-b text-center text-gray-600"
                    >
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {item.subcategories?.length || 0} items
                      </span>
                    </td>
                    <td className="py-2 md:py-3 px-3 md:px-4 border-b text-gray-600">
                      {formatDate(item.date_created)}
                    </td>
                    <td className="py-2 md:py-3 px-3 md:px-4 border-b">
                      <div className="font-bold text-base md:text-lg text-purple-700">
                        KES {Number(item.amount).toLocaleString()}
                      </div>
                    </td>
                  </tr>

                  {/* Mobile Row */}
                  <tr
                    key={`mobile-${item.expense_id}`}
                    className="md:hidden hover:bg-gray-50 transition cursor-pointer bg-white border-b"
                    onClick={() => toggleRow(item.expense_id)}
                  >
                    <td colSpan="3" className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-2">
                          <span
                            className={`transform transition-transform mt-1 ${
                              expandedRows.has(item.expense_id)
                                ? "rotate-90"
                                : ""
                            }`}
                          >
                            ▶
                          </span>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">
                                {month[
                                  new Date(item.date_created).getMonth()
                                ].substring(0, 3)}
                              </span>
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full capitalize">
                                {item.category}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              {formatDate(item.date_created)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {item.subcategories?.length || 0} items
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm text-purple-700">
                            KES {Number(item.amount).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Desktop Expanded Subcategories */}
                  {expandedRows.has(item.expense_id) &&
                    item.subcategories?.map((subcategory, index) => (
                      <tr
                        key={`${item.expense_id}-${index}`}
                        className="hidden md:table-row bg-white hover:bg-gray-50 transition-all duration-200"
                      >
                        <td className="py-2 px-3 md:px-4 border-b"></td>
                        <td className="py-2 px-3 md:px-4 border-b"></td>
                        <td className="py-2 px-3 md:px-4 border-b"></td>
                        <td className="py-2 px-3 md:px-4 border-b pl-6 md:pl-8 border-l-2 border-purple-300">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                            <span>{subcategory.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 md:px-4 border-b border-l-2 border-purple-300 text-right">
                          <span className="font-medium bg-white px-2 py-1 rounded shadow-sm">
                            KES {Number(subcategory.amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-2 px-3 md:px-4 border-b"></td>
                        <td className="py-2 px-3 md:px-4 border-b"></td>
                      </tr>
                    ))}

                  {/* Mobile Expanded Subcategories */}
                  {expandedRows.has(item.expense_id) && (
                    <tr className="md:hidden bg-gray-50">
                      <td colSpan="3" className="p-3">
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-600 mb-1">
                            Subcategories:
                          </div>
                          {item.subcategories?.map((subcategory, index) => (
                            <div
                              key={`${item.expense_id}-mobile-${index}`}
                              className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border-l-4 border-purple-400 shadow-sm"
                            >
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                                <span className="text-xs font-medium">
                                  {subcategory.name}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                KES{" "}
                                {Number(subcategory.amount).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="py-6 md:py-8 text-center text-gray-500 text-sm md:text-base"
                >
                  No expenses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 md:mt-6 gap-3 md:gap-0">
        <button
          onClick={() => setPage((prev) => prev - 1)}
          disabled={page <= 1}
          className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition ${
            page <= 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          Previous
        </button>

        <span className="text-xs md:text-sm text-gray-600 font-medium">
          Page {page} of {expenseData?.data?.meta?.totalPages || 1}
        </span>

        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={
            !expenseData?.data?.meta || page >= expenseData.data.meta.totalPages
          }
          className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition ${
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
