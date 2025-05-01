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
  //ADD PAGINATION
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
  if (error) {
    toast.error("Something went wrong.");
  }
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
      <div>
        <input
          type="text"
          name=""
          id=""
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or category..."
        />
      </div>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Budget Name</th>
            <th>Category</th>
            <th>Budget Amount</th>

            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayData?.length !== 0 ? (
            displayData.map((item) => {
              return (
                <tr key={item.budget_id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.amount}</td>

                  <td>
                    <Dialog
                      open={openDialogId === item.budget_id}
                      onOpenChange={(open) =>
                        setOpenDialogId(open ? item.budget_id : null)
                      }
                    >
                      <DialogTrigger
                        style={{ color: "red", fontWeight: "bold" }}
                      >
                        Delete
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Are you absolutely sure?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently
                            delete your budgets.
                          </DialogDescription>
                        </DialogHeader>
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(item.budget_id)}
                          disabled={isPending}
                        >
                          {isPending ? "Deleting" : "Delete"}
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                No budgets to display
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      <button
        onClick={() => setPage((prev) => prev - 1)}
        disabled={page <= 1 || 1}
      >
        Previous Page
      </button>
      <p>
        Page{page} of {budgetData?.data?.meta?.totalPages}
      </p>
      <button
        onClick={() => setPage((prev) => prev + 1)}
        disabled={page >= budgetData?.data?.meta?.total || 1}
      >
        Next Page
      </button>
    </>
  );
};

export default BudgetTable;
