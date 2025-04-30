import Table from "react-bootstrap/Table";
import _ from "lodash";
import { useState, useCallback } from "react";
import Button from "react-bootstrap/Button";
import LoadingSpinner from "./LoadingSpinner";
import { useMutation, useQuery } from "@tanstack/react-query";
import axiosInstance from "../axiosInstance";
import { toast, ToastContainer } from "react-toastify";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";

const BudgetTable = () => {
  const [query, setQuery] = useState("");
  const {
    data: budgetData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      return await axiosInstance.get("/budget");
    },
  });

  const fetchData = async ({ searchItem }) => {
    if (!searchItem) return [];
    const response = await axiosInstance.get(`/search2?q=${searchItem}`);
    return response.data.data;
  };
  const debouncedSearch = useCallback(
    _.debounce(({ searchItem, resolve }) => {
      fetchData(searchItem).then(resolve);
    }, 300),
    []
  );

  const queryFn = () => {
    new Promise((resolve) => debouncedSearch({ searchItem: query, resolve }));
  };

  const { data: searchedItems, isLoading: searchLoading } = useQuery({
    queryKey: ["searchBudget", query],
    queryFn,
    enabled: !!query,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (id) => {
      return await axiosInstance.delete(`budget/${id}`);
    },
    onSuccess: (data) => {
      toast.success(data.data.message);
    },
    onError: () => {
      toast.error("Something went wrong.");
    },
  });

  const displayData =
    query.trim() === "" ? budgetData?.data?.data : searchedItems?.data?.data;
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
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.amount}</td>

                  <td>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                    >
                      {isPending ? "Deleting" : "Delete"}
                    </Button>
                    {/* <Dialog>
                      <DialogTrigger>Delete</DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Are you absolutely sure?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently
                            delete your budgets.
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog> */}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                No budget data available
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
};

export default BudgetTable;
