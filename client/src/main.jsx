import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthenticationContext";
import "./styles/index.css";
import App from "./App.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IconContext } from "@phosphor-icons/react";

// A request someone chose not to unlock with their PIN isn't tried again.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failures, error) => error?.response?.status !== 423 && failures < 3,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <>
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <IconContext.Provider value={{ weight: "duotone" }}>
            <App />
          </IconContext.Provider>
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  </>
);
