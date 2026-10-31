import { useEffect } from "react";
import { publicAxios } from "./axiosInstance";
import { useAuth } from "./hooks/useAuth";

const SilentRefresh = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      publicAxios.post("/auth/refresh").catch(() => {});
    }, 1000 * 60 * 10);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return null;
};

export default SilentRefresh;
