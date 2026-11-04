import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Opens the Add expense page, remembering where to go back to.
export const useAddExpense = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const openAdd = useCallback(
    ({ scan = false } = {}) =>
      navigate(scan ? "/expenses/new?way=scan" : "/expenses/new", {
        state: { from: `${location.pathname}${location.search}` },
      }),
    [navigate, location.pathname, location.search]
  );
  return { openAdd };
};
