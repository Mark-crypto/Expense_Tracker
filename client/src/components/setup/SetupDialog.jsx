import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import { AddAccountDialog } from "@/components/accounts/AccountDialogs";
import PinDialog from "@/components/security/PinDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BillsStep, GoalStep, PayStep, PlanStep } from "./SetupSteps";

const STEPS = { pay: PayStep, bills: BillsStep, plan: PlanStep, goal: GoalStep };

const NewAccount = ({ onClose }) => {
  const { data } = useQuery({ queryKey: ["accounts", null], queryFn: async () => (await axiosInstance.get("/accounts")).data });
  return data ? <AddAccountDialog accounts={data.accounts} statement={data.statement} onClose={onClose} /> : null;
};

// One setup task over the current page, opened from the tour or the Get started checklist.
const SetupDialog = ({ kind, onClose }) => {
  if (kind === "accounts") return <NewAccount onClose={onClose} />;
  if (kind === "pin") return <PinDialog mode="set" onDone={onClose} onCancel={onClose} />;
  const Step = STEPS[kind];
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] space-y-1 overflow-y-auto sm:max-w-lg">
        <Step onNext={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default SetupDialog;
