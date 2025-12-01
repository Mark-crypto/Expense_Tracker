import { FaTrashAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import Table from "react-bootstrap/Table";
import debounce from "lodash/debounce";
import { useState, useMemo, useEffect } from "react";
import Button from "react-bootstrap/Button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../axiosInstance";
import { toast, ToastContainer } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Loading from "./Loading";
import BudgetDownloadBtn from "./BudgetDownloadBtn";

const BudgetTable = () => {
  const [openDialogId, setOpenDialogId] = useState(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const queryClient = useQueryClient();

  const {
    data: budgetData,
    error,
    isLoading,
    refetch: refetchAll,
  } = useQuery({
    queryKey: ["budgets", page],
    queryFn: async () => {
      return await axiosInstance.get(`/budget?_page=${page}&_limit=10`);
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const {
    data: searchedItems,
    isLoading: searchLoading,
    refetch: refetchSearch,
  } = useQuery({
    queryKey: ["searchBudget", query],
    queryFn: async () => {
      return await axiosInstance.get(`/budgets/search?q=${query}`);
    },
    enabled: false,
    keepPreviousData: true,
  });

  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        if (value.trim() === "") {
          refetchAll();
        } else {
          refetchSearch();
        }
      }, 300),
    [refetchAll, refetchSearch]
  );

  useEffect(() => {
    debouncedSearch(query);
    return () => debouncedSearch.cancel();
  }, [query]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (id) => {
      return await axiosInstance.delete(`budget/${id}`);
    },
    onSuccess: (data) => {
      toast.success(data.data.message);
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setOpenDialogId(null);
    },
    onError: () => {
      toast.error("Something went wrong.");
    },
  });

  const displayData =
    query.trim() === ""
      ? budgetData?.data?.data ?? []
      : searchedItems?.data?.data ?? [];

  const handleDelete = (id) => {
    try {
      mutate(id);
    } catch (error) {
      toast.error("Something went wrong.");
    }
  };

  const toggleRow = (budgetId) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(budgetId)) {
        newSet.delete(budgetId);
      } else {
        newSet.add(budgetId);
      }
      return newSet;
    });
  };

  if (isLoading || searchLoading) return <Loading />;
  if (error) toast.error("Something went wrong.");

  return (
    <>
      <ToastContainer className="!w-[90vw] sm:!w-auto" />

      {/* Search and Download Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="w-full sm:flex-1 sm:max-w-md">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or category..."
            className="px-3 md:px-4 py-2 w-full rounded-lg md:rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm md:text-base"
          />
        </div>

        <div className="w-full sm:w-auto mt-3 sm:mt-0">
          <BudgetDownloadBtn />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto shadow-md md:shadow-xl rounded-lg md:rounded-xl">
        <Table
          responsive
          className="w-full text-xs md:text-sm text-left text-gray-700 bg-white"
        >
          <thead className="bg-gradient-to-r from-purple-600 to-purple-500 text-white uppercase tracking-wide">
            {/* Main Header Row */}
            <tr className="hidden md:table-row">
              <th className="px-3 md:px-4 py-2 md:py-3 font-semibold">
                Budget Name
              </th>
              <th className="px-3 md:px-4 py-2 md:py-3 font-semibold">
                Category
              </th>
              <th
                colSpan="2"
                className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold"
              >
                Subcategory Details
              </th>
              <th className="px-3 md:px-4 py-2 md:py-3 font-semibold text-center">
                Total Amount
              </th>
              <th className="px-3 md:px-4 py-2 md:py-3 font-semibold text-center">
                Actions
              </th>
            </tr>

            {/* Sub-header Row */}
            <tr className="hidden md:table-row bg-gradient-to-r from-purple-500 to-purple-400">
              <th className="px-3 md:px-4 py-2"></th>
              <th className="px-3 md:px-4 py-2"></th>
              <th className="px-3 md:px-4 py-2 text-center">Name</th>
              <th className="px-3 md:px-4 py-2 text-center">Amount</th>
              <th className="px-3 md:px-4 py-2 text-center"></th>
              <th className="px-3 md:px-4 py-2 text-center"></th>
            </tr>

            {/* Mobile Header Row */}
            <tr className="md:hidden bg-gradient-to-r from-purple-600 to-purple-500">
              <th colSpan="3" className="px-3 py-2 text-center font-semibold">
                Budgets List
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {displayData?.length !== 0 ? (
              displayData.map((item) => (
                <>
                  {/* Main Row - Desktop & Mobile */}
                  <motion.tr
                    key={item.budget_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="hover:bg-purple-50 transition-all duration-200 cursor-pointer bg-white"
                    onClick={() => toggleRow(item.budget_id)}
                  >
                    {/* Desktop View */}
                    <td className="hidden md:table-cell px-3 md:px-4 py-2 md:py-3 font-semibold">
                      <div className="flex items-center">
                        <span
                          className={`transform transition-transform ${
                            expandedRows.has(item.budget_id) ? "rotate-90" : ""
                          } text-xs md:text-sm`}
                        >
                          ▶
                        </span>
                        <span className="ml-1 md:ml-2 text-xs md:text-sm truncate max-w-[120px] md:max-w-none">
                          {item.name.toUpperCase()}
                        </span>
                      </div>
                    </td>

                    <td className="hidden md:table-cell px-3 md:px-4 py-2 md:py-3 font-semibold text-xs md:text-sm">
                      <span className="capitalize bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                        {item.category}
                      </span>
                    </td>

                    <td
                      className="hidden md:table-cell px-3 md:px-4 py-2 md:py-3 text-center text-gray-600 text-xs md:text-sm"
                      colSpan="2"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {item.subcategories?.length || 0} items
                        </span>
                      </div>
                    </td>

                    {/* Total Amount Column - IMPROVED STYLING */}
                    <td className="hidden md:table-cell px-3 md:px-4 py-2 md:py-3 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-bold text-lg md:text-xl text-gray-900">
                          KES {Number(item.amount).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          Total Budget
                        </span>
                      </div>
                    </td>

                    <td className="hidden md:table-cell px-3 md:px-4 py-2 md:py-3 text-center">
                      <Dialog
                        open={openDialogId === item.budget_id}
                        onOpenChange={(open) =>
                          setOpenDialogId(open ? item.budget_id : null)
                        }
                      >
                        <DialogTrigger
                          className="bg-red-100 text-red-700 px-2 md:px-3 py-1 rounded-lg hover:bg-red-200 transition font-semibold shadow-sm text-xs md:text-sm flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FaTrashAlt className="text-xs md:text-sm" />
                          <span>Delete</span>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-base md:text-lg">
                              Delete Budget?
                            </DialogTitle>
                            <DialogDescription className="text-sm md:text-base">
                              Are you sure you want to delete "{item.name}"?
                              This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Total Amount:</span>
                              <span className="font-bold text-red-600">
                                KES {Number(item.amount).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="danger"
                            onClick={() => handleDelete(item.budget_id)}
                            disabled={isPending}
                            size="sm"
                            className="mt-4 text-xs md:text-sm"
                          >
                            {isPending ? "Deleting..." : "Delete Budget"}
                          </Button>
                        </DialogContent>
                      </Dialog>
                    </td>

                    {/* Mobile View */}
                    <td className="md:hidden px-3 py-2" colSpan="3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span
                            className={`transform transition-transform ${
                              expandedRows.has(item.budget_id)
                                ? "rotate-90"
                                : ""
                            } text-xs mr-2`}
                          >
                            ▶
                          </span>
                          <div>
                            <div className="font-semibold text-xs truncate max-w-[100px]">
                              {item.name.toUpperCase()}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full capitalize">
                                {item.category}
                              </span>
                              <span className="text-xs text-gray-600">
                                {item.subcategories?.length || 0} items
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-bold text-sm text-gray-900">
                            KES {Number(item.amount).toLocaleString()}
                          </span>
                          <Dialog
                            open={openDialogId === item.budget_id}
                            onOpenChange={(open) =>
                              setOpenDialogId(open ? item.budget_id : null)
                            }
                          >
                            <DialogTrigger
                              className="bg-red-100 text-red-700 p-1.5 rounded-lg hover:bg-red-200 transition shadow-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FaTrashAlt className="text-xs" />
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-base">
                                  Delete Budget?
                                </DialogTitle>
                                <DialogDescription className="text-sm">
                                  This will permanently delete "{item.name}"
                                  budget.
                                </DialogDescription>
                              </DialogHeader>
                              <Button
                                variant="danger"
                                onClick={() => handleDelete(item.budget_id)}
                                disabled={isPending}
                                size="sm"
                              >
                                {isPending ? "Deleting..." : "Delete"}
                              </Button>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </td>
                  </motion.tr>

                  {/* Expanded Subcategories - Desktop */}
                  {expandedRows.has(item.budget_id) &&
                    item.subcategories?.map((subcategory, index) => (
                      <motion.tr
                        key={`${item.budget_id}-${index}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="hidden md:table-row bg-gray-50 hover:bg-gray-100 transition-all duration-200"
                      >
                        <td className="px-3 md:px-4 py-2"></td>
                        <td className="px-3 md:px-4 py-2"></td>
                        <td className="px-3 md:px-4 py-2 pl-6 md:pl-8 border-l-2 border-purple-300 text-xs md:text-sm">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                            <span>{subcategory.name}</span>
                          </div>
                        </td>
                        <td className="px-3 md:px-4 py-2 border-l-2 border-purple-300 text-xs md:text-sm text-right">
                          <span className="font-medium bg-white px-3 py-1 rounded-lg shadow-sm">
                            KES {Number(subcategory.amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-3 md:px-4 py-2"></td>
                        <td className="px-3 md:px-4 py-2"></td>
                      </motion.tr>
                    ))}

                  {/* Expanded Subcategories - Mobile */}
                  {expandedRows.has(item.budget_id) && (
                    <motion.tr
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="md:hidden bg-gray-50"
                    >
                      <td colSpan="3" className="px-3 py-2">
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-600 mb-1">
                            Subcategories:
                          </div>
                          {item.subcategories?.map((subcategory, index) => (
                            <div
                              key={`${item.budget_id}-${index}`}
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
                    </motion.tr>
                  )}
                </>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-6 md:py-8 text-gray-500 text-sm md:text-base"
                >
                  No budgets to display
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center my-4 md:my-6 gap-3 md:gap-0">
        <motion.button
          onClick={() => setPage((prev) => prev - 1)}
          disabled={page <= 1}
          className="w-full sm:w-auto bg-purple-600 text-white py-2 px-3 md:px-4 rounded-lg shadow hover:bg-purple-700 disabled:bg-gray-300 transition text-xs md:text-sm font-medium"
          whileHover={{ scale: 1.05 }}
        >
          Previous Page
        </motion.button>

        <p className="text-center text-xs md:text-sm text-gray-800 font-medium">
          Page {page} of {budgetData?.data?.meta?.totalPages || 1}
        </p>

        <motion.button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={page >= (budgetData?.data?.meta?.totalPages || 1)}
          className="w-full sm:w-auto bg-purple-600 text-white py-2 px-3 md:px-4 rounded-lg shadow hover:bg-purple-700 disabled:bg-gray-300 transition text-xs md:text-sm font-medium"
          whileHover={{ scale: 1.05 }}
        >
          Next Page
        </motion.button>
      </div>
    </>
  );
};

export default BudgetTable;
