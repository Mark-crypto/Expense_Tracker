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
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import LimitNotification from "@/components/LimitNotification";
import ExpenseDownloadBtn from "@/components/ExpenseDownloadBtn";

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
    <div className="flex min-h-screen">
      <div className="w-1/5  ">
        <Navbar />
      </div>

      <div className="flex-1  p-6">
        <LimitNotification />

        <div className="flex items-center gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-5 py-2 text-white bg-purple-600 hover:bg-purple-700 font-semibold rounded shadow"
            onClick={handleDeleteClick}
          >
            <MdDelete className="text-xl" />
            Clear All History
          </motion.button>

          <ExpenseDownloadBtn />
        </div>
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Are you absolutely sure?
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently clear all
                your past expenses.
              </DialogDescription>
            </DialogHeader>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-4 py-2 mt-6 text-white bg-red-600 hover:bg-red-700 rounded font-semibold"
              onClick={handleDelete}
              disabled={isPending}
            >
              <MdDelete className="text-xl" />
              {isPending ? "Deleting..." : "Clear All History"}
            </motion.button>
          </DialogContent>
        </Dialog>

        <div className="mt-8">
          <HistoryTable />
        </div>
      </div>
    </div>
  );
};

export default History;
