import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/common";
import BudgetForm from "@/components/BudgetForm";
import BudgetTable from "@/components/BudgetTable";
import DownloadButton from "@/components/DownloadButton";

const Budget = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Budgets"
        description="Set limits and get alerted when spending goes over."
        actions={
          <>
            <DownloadButton endpoint="/budget/report" filename="budget_report.xlsx" />
            <Button onClick={() => setOpen(true)}>
              <Plus /> New budget
            </Button>
          </>
        }
      />

      <BudgetTable />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined} className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New budget</DialogTitle>
          </DialogHeader>
          <BudgetForm onCreated={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Budget;
