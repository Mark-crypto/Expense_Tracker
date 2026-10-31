import { useSearchParams } from "react-router-dom";
import { Camera, PenLine, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/common";
import ExpenseForm from "@/components/ExpenseForm";
import UploadMpesaPdf from "@/components/UploadMpesaPdf";
import UploadReceipt from "@/components/UploadReceipt";
import { cn } from "@/lib/utils";

const methods = [
  { value: "manual", label: "Enter by hand", icon: PenLine, panel: ExpenseForm },
  { value: "mpesa", label: "M-Pesa statement", icon: Smartphone, panel: UploadMpesaPdf },
  { value: "receipt", label: "Receipt photo", icon: Camera, panel: UploadReceipt },
];

const AddExpense = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = methods.find((m) => m.value === searchParams.get("method")) ?? methods[0];
  const Panel = active.panel;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add expense" description="Enter it yourself or let a document do the typing." />

      <div role="tablist" aria-label="How to add" className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {methods.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active.value === value}
            onClick={() => setSearchParams({ method: value }, { replace: true })}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition-colors sm:text-sm",
              active.value === value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="hidden size-4 sm:block" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="sm:p-6">
          <Panel key={active.value} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AddExpense;
