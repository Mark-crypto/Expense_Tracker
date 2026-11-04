import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Camera, ChatText, PencilLine, UploadSimple } from "@phosphor-icons/react";
import AddExpenseForm from "@/components/expenses/AddExpenseForm";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { backTo } from "@/lib/pages";
import { cn } from "@/lib/utils";

const WAYS = [
  { id: "type", label: "Type it", short: "Type it", hint: "Amount, who and what for", icon: PencilLine },
  { id: "sms", label: "Paste SMS", short: "Paste SMS", hint: "From your M-Pesa message", icon: ChatText },
  { id: "scan", label: "Scan receipt", short: "Scan", hint: "Photo of a shop receipt", icon: Camera },
  { id: "import", label: "Import statement", short: "Import", hint: "Months of M-Pesa at once", icon: UploadSimple },
];

// The four ways to add sit right under the heading, so they're the first thing on the page.
const Ways = ({ way, onWay }) => (
  <div role="group" aria-label="How to add it" className="grid grid-cols-4 gap-1.5 sm:gap-3">
    {WAYS.map(({ id, label, short, hint, icon: Icon }) => {
      const active = way === id;
      return (
        <button
          key={id}
          type="button"
          aria-pressed={active}
          onClick={() => onWay(id)}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-xl border-[1.5px] border-border bg-card px-1 py-2.5 text-center transition-colors hover:bg-muted sm:flex-row sm:items-start sm:gap-3 sm:p-3 sm:text-left",
            active && "border-primary bg-accent hover:bg-accent"
          )}
        >
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
              active && "bg-primary text-primary-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className={cn("block text-[11px] font-medium sm:hidden", active && "text-accent-foreground")}>{short}</span>
            <span className="hidden text-sm font-semibold sm:block">{label}</span>
            <span className={cn("hidden text-xs text-muted-foreground sm:block", active && "text-accent-foreground")}>{hint}</span>
          </span>
        </button>
      );
    })}
  </div>
);

const AddExpense = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const asked = params.get("way");
  const way = ["sms", "scan"].includes(asked) ? asked : "type";

  const chooseWay = (id) => {
    if (id === "import") return navigate("/import", { state: { from: "/expenses/new", origin: location.state?.from } });
    setParams(id === "type" ? {} : { way: id }, { replace: true, state: location.state });
  };

  // Back to wherever Add expense was opened from.
  const done = () => {
    const from = location.state?.from;
    navigate(from && !from.startsWith("/expenses/new") ? from : "/dashboard");
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[backTo(location.state?.from), { label: "Add expense" }]} />
      <header className="space-y-3">
        <div>
          <h1 className="text-xl sm:text-2xl">Add expense</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Choose how to add it.</p>
        </div>
        <Ways way={way} onWay={chooseWay} />
      </header>
      <AddExpenseForm way={way} onWay={chooseWay} onDone={done} />
    </div>
  );
};

export default AddExpense;
