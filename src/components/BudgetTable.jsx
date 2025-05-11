import { FaTrashAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import Table from "react-bootstrap/Table";
import debounce from "lodash/debounce";
import { useState, useMemo, useEffect } from "react";
import Button from "react-bootstrap/Button";
import LoadingSpinner from "./LoadingSpinner";
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

const BudgetTable = () => {
  const [openDialogId, setOpenDialogId] = useState(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
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

  if (isLoading || searchLoading) return <LoadingSpinner />;
  if (error) toast.error("Something went wrong.");

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="flex justify-center mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or category..."
          className="px-4 py-2 w-80 rounded-xl border border-gray-300 shadow focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
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
              <th className="px-4 py-3">Budget Amount</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayData?.length !== 0 ? (
              displayData.map((item) => (
                <motion.tr
                  key={item.budget_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="hover:bg-purple-100 transition-all duration-200"
                >
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">{item.category}</td>
                  <td className="px-4 py-2">{item.amount}</td>
                  <td className="px-4 py-2">
                    <Dialog
                      open={openDialogId === item.budget_id}
                      onOpenChange={(open) =>
                        setOpenDialogId(open ? item.budget_id : null)
                      }
                    >
                      <DialogTrigger className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition font-semibold shadow-sm">
                        <FaTrashAlt className="inline-block mr-1" />
                        Delete
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Are you absolutely sure?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently
                            delete your budget.
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
                </motion.tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
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
