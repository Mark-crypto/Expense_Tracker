import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthenticationContext";
import "./styles/index.css";
import App from "./App.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IconContext } from "@phosphor-icons/react";

const queryClient = new QueryClient();

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
