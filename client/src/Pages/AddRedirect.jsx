import { Navigate, useSearchParams } from "react-router-dom";

// Old links to the add form: statements go to Import, the rest to the Add expense page.
const AddRedirect = () => {
  const [searchParams] = useSearchParams();
  return <Navigate to={searchParams.get("method") === "mpesa" ? "/import" : "/expenses/new"} replace />;
};

export default AddRedirect;
