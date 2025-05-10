import { useMutation, useQueryClient } from "@tanstack/react-query";
import HistoryTable from "../components/HistoryTable";
import Navbar from "../components/Navbar";
import { MdDelete } from "react-icons/md";
import axiosInstance from "@/axiosInstance";
import { toast } from "react-toastify";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const History = () => {
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      return await axiosInstance.put("/expenses");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      toast.success(data.data.message);
      setOpenModal(false);
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const handleDelete = () => {
    try {
      mutate();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };
  const handleDeleteClick = () => {
    setOpenModal(true);
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        minHeight: "100vh",
      }}
    >
      <div style={{ width: "20%" }}>
        <Navbar />
      </div>
      <div
        style={{
          backgroundColor: "rgb(240, 240, 240)",
          flex: 1,
          padding: "20px",
        }}
      >
        <button
          style={{
            backgroundColor: "#9d00ff",
            color: "white",
            border: "none",
            padding: "10px",
            margin: "40px 0 20px 10px",
            borderRadius: "5px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
          }}
          onClick={handleDeleteClick}
        >
          <MdDelete style={{ marginRight: "10px", fontSize: "20px" }} />
          Clear All History
        </button>
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently clear all
                your past expenses.
              </DialogDescription>
            </DialogHeader>
            <button
              style={{
                backgroundColor: "red",
                color: "white",
                border: "none",
                padding: "10px",
                margin: "40px 0px 20px 10px",
                borderRadius: "5px",
                fontWeight: "bold",
                textAlign: "center",
              }}
              onClick={handleDelete}
              disabled={isPending}
            >
              <MdDelete style={{ marginRight: "10px", fontSize: "20px" }} />
              {isPending ? "Deleting..." : " Clear All History"}
            </button>
          </DialogContent>
        </Dialog>
        <HistoryTable />
      </div>
    </div>
  );
};

export default History;
