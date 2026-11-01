import { createContext, useState } from "react";
import { publicAxios } from "@/axiosInstance";

export const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);

  const login = (info) => {
    localStorage.setItem("user", JSON.stringify(info));
    setUser(info);
  };

  const logout = async () => {
    try {
      await publicAxios.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      window.location.href = "/";
    }
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
