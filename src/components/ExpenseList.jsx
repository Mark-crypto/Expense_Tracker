import { useState, useEffect } from "react";
import { db } from "../services/Firebase.js";
import { collection, onSnapshot } from "firebase/firestore";

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "expenses"), (snapshot) => {
      setExpenses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <ul className="p-4">
      {expenses.map((expense) => (
        <li key={expense.id} className="border p-2">
          {expense.category}: ${expense.amount} on {expense.date}
        </li>
      ))}
    </ul>
  );
};

export default ExpenseList;
