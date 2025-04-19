import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
import { ExpenseProvider } from "./context/ExpenseContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <>
    <ExpenseProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ExpenseProvider>
  </>
);
