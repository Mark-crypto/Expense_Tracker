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
      <ToastContainer />

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or category..."
            className="px-4 py-2 w-full rounded-xl border border-gray-300 shadow focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <BudgetDownloadBtn />
      </div>
      <div className="overflow-x-auto shadow-xl rounded-xl">
        <Table
          responsive
          className="w-full text-sm text-left text-gray-700 bg-white"
        >
          <thead className="bg-gradient-to-r from-purple-600 to-purple-500 text-white uppercase text-sm tracking-wide">
            <tr>
              <th className="px-4 py-3">Budget Name</th>
              <th className="px-4 py-3">Category</th>
              <th colSpan="2" className="px-4 py-3 text-center">
                Subcategory Details
              </th>
              <th className="px-4 py-3">Actions</th>
              <th> Total</th>
            </tr>
            <tr className="bg-gradient-to-r from-purple-500 to-purple-400">
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayData?.length !== 0 ? (
              displayData.map((item) => (
                <>
                  <motion.tr
                    key={item.budget_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="hover:bg-purple-100 transition-all duration-200 cursor-pointer bg-purple-50"
                    onClick={() => toggleRow(item.budget_id)}
                  >
                    <td className="px-4 py-2 font-semibold">
                      <div className="flex items-center">
                        <span
                          className={`transform transition-transform ${
                            expandedRows.has(item.budget_id) ? "rotate-90" : ""
                          }`}
                        >
                          ▶
                        </span>
                        <span className="ml-2">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 font-semibold">{item.category}</td>
                    <td
                      colSpan="2"
                      className="px-4 py-2 text-center text-gray-600"
                    >
                      {item.subcategories?.length || 0} subcategories
                    </td>
                    <td className="px-4 py-2">
                      <Dialog
                        open={openDialogId === item.budget_id}
                        onOpenChange={(open) =>
                          setOpenDialogId(open ? item.budget_id : null)
                        }
                      >
                        <DialogTrigger
                          className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition font-semibold shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FaTrashAlt className="inline-block mr-1" />
                          Delete
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Are you absolutely sure?</DialogTitle>
                            <DialogDescription>
                              This action cannot be undone. This will
                              permanently delete your budget.
                            </DialogDescription>
                          </DialogHeader>
                          <Button
                            variant="danger"
                            onClick={() => handleDelete(item.budget_id)}
                            disabled={isPending}
                          >
                            {isPending ? "Deleting..." : "Delete"}
                          </Button>
                        </DialogContent>
                      </Dialog>
                    </td>
                    <td className="px-4 py-2 font-semibold">{item.amount}</td>
                  </motion.tr>

                  {expandedRows.has(item.budget_id) &&
                    item.subcategories?.map((subcategory, index) => (
                      <motion.tr
                        key={`${item.budget_id}-${index}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50 hover:bg-gray-100 transition-all duration-200"
                      >
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2 pl-8 border-l-2 border-purple-300">
                          {subcategory.name}
                        </td>
                        <td className="px-4 py-2 border-l-2 border-purple-300">
                          KES {Number(subcategory.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-2"></td>
                      </motion.tr>
                    ))}
                </>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-4 text-gray-500 italic"
                >
                  No budgets to display
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <div className="flex justify-between items-center my-6">
        <motion.button
          onClick={() => setPage((prev) => prev - 1)}
          disabled={page <= 1}
          className="bg-purple-600 text-white py-2 px-4 rounded shadow hover:bg-purple-700 disabled:bg-gray-300 transition"
          whileHover={{ scale: 1.05 }}
        >
          Previous Page
        </motion.button>

        <p className="text-center text-base text-gray-800 font-medium">
          Page {page} of {budgetData?.data?.meta?.totalPages}
        </p>

        <motion.button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={page >= budgetData?.data?.meta?.totalPages}
          className="bg-purple-600 text-white py-2 px-4 rounded shadow hover:bg-purple-700 disabled:bg-gray-300 transition"
          whileHover={{ scale: 1.05 }}
        >
          Next Page
        </motion.button>
      </div>
    </>
  );
};

export default BudgetTable;
