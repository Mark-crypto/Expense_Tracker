import { useState } from "react";
import { db } from "../services/Firebase.js";
import { collection, addDoc } from "firebase/firestore";

const ExpenseForm = () => {
  const [expense, setExpense] = useState({
    amount: "",
    category: "",
    date: "",
  });

  const addExpense = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "expenses"), expense);
    setExpense({ amount: "", category: "", date: "" });
  };

  return (
    <form onSubmit={addExpense} className="p-4 bg-gray-100 rounded">
      <input
        type="number"
        placeholder="Amount"
        required
        value={expense.amount}
        onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
      />
      <input
        type="text"
        placeholder="Category"
        required
        value={expense.category}
        onChange={(e) => setExpense({ ...expense, category: e.target.value })}
      />
      <input
        type="date"
        required
        value={expense.date}
        onChange={(e) => setExpense({ ...expense, date: e.target.value })}
      />
      <button type="submit" className="bg-green-500 text-white p-2 rounded">
        Add Expense
      </button>
    </form>
  );
};

export default ExpenseForm;
