import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Trash2 } from "lucide-react";
import axiosInstance from "@/axiosInstance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/common";
import DownloadButton from "@/components/DownloadButton";
import HistoryTable from "@/components/HistoryTable";

const History = () => {
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => await axiosInstance.put("/expenses"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      toast.success(data.data.message);
      setOpenModal(false);
    },
    onError: () => toast.error("Something went wrong"),
  });

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Every expense you've recorded. Select a row to see its items."
        actions={
          <>
            <DownloadButton endpoint="/expenses/report" filename="expense_report.xlsx" />
            <Button variant="danger-ghost" onClick={() => setOpenModal(true)}>
              <Trash2 /> Clear all
            </Button>
          </>
        }
      />

      <HistoryTable />

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear all expense history?</DialogTitle>
            <DialogDescription>
              This clears all your past expenses and can't be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={isPending} onClick={() => mutate()}>
              Clear all history
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default History;
