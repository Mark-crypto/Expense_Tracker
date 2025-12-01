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
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar Navbar */}
      <div className="w-full lg:w-64 xl:w-1/5">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6">
        {/* Limit Notification */}
        <div className="mb-4 md:mb-6">
          <LimitNotification />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 mb-4 md:mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-white bg-purple-600 hover:bg-purple-700 font-semibold rounded-lg shadow text-sm md:text-base w-full sm:w-auto"
            onClick={handleDeleteClick}
          >
            <MdDelete className="text-lg md:text-xl" />
            Clear All History
          </motion.button>

          <div className="w-full sm:w-auto">
            <ExpenseDownloadBtn />
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent className="max-w-[95vw] sm:max-w-md p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg font-semibold">
                Clear All Expense History?
              </DialogTitle>
              <DialogDescription className="text-sm md:text-base mt-2">
                This action cannot be undone. This will permanently clear all
                your past expenses from the system.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 md:mt-6 flex flex-col sm:flex-row gap-3">
              <button
                className="px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm md:text-base transition-colors w-full sm:w-auto"
                onClick={() => setOpenModal(false)}
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm md:text-base w-full sm:w-auto"
                onClick={handleDelete}
                disabled={isPending}
              >
                <MdDelete className="text-lg md:text-xl" />
                {isPending ? "Clearing..." : "Clear All History"}
              </motion.button>
            </div>
          </DialogContent>
        </Dialog>

        {/* History Table */}
        <div className="mt-6 md:mt-8">
          <HistoryTable />
        </div>
      </div>
    </div>
  );
};

export default History;
