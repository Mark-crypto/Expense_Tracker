import { createContext, useCallback, useState } from "react";
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

  // reason: none when someone logs out themselves, "idle" or "expired" when the session ends.
  const logout = useCallback(async (reason) => {
    try {
      await publicAxios.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      window.location.href = typeof reason === "string" ? `/?ended=${reason}` : "/?loggedOut=1";
    }
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
