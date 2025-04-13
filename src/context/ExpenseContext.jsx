import { useContext, createContext, useState } from "react";

export const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [expenseAmount, setExpenseAmount] = useState(0);

  return (
    <ExpenseContext.Provider value={{ expenseAmount, setExpenseAmount }}>
      {children}
    </ExpenseContext.Provider>
  );
};
