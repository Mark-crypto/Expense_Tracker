import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAddExpense } from "@/hooks/useAddExpense";

// Old links to the add page: statements go to Import, the rest open the panel.
const AddRedirect = () => {
  const [searchParams] = useSearchParams();
  const { openAdd } = useAddExpense();
  const importing = searchParams.get("method") === "mpesa";

  useEffect(() => {
    if (!importing) openAdd();
  }, [importing, openAdd]);

  return <Navigate to={importing ? "/import" : "/dashboard"} replace />;
};

export default AddRedirect;
