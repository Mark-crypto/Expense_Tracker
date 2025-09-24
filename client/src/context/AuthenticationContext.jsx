import { createContext } from "react";
import axiosInstance from "@/axiosInstance";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  };

  const value = {
    user,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
