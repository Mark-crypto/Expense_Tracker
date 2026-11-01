import { createContext, useCallback, useContext, useMemo, useState } from "react";
import AddExpenseForm from "@/components/expenses/AddExpenseForm";
import { Sheet } from "@/components/ui/sheet";

const AddExpenseContext = createContext(null);

export const AddExpenseProvider = ({ children }) => {
  const [request, setRequest] = useState(null);
  const openAdd = useCallback(({ scan = false } = {}) => setRequest({ scan }), []);
  const close = useCallback(() => setRequest(null), []);
  const value = useMemo(() => ({ openAdd }), [openAdd]);

  return (
    <AddExpenseContext.Provider value={value}>
      {children}
      <Sheet
        open={!!request}
        onClose={close}
        title="Add expense"
        onOpenAutoFocus={(e) => {
          if (request?.scan) return;
          e.preventDefault();
          document.getElementById("quickAmount")?.focus();
        }}
      >
        {request && <AddExpenseForm startWithScan={request.scan} onClose={close} />}
      </Sheet>
    </AddExpenseContext.Provider>
  );
};

export const useAddExpense = () => useContext(AddExpenseContext);
