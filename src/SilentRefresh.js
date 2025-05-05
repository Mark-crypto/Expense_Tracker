import { useEffect } from "react";
import axios from "axios";

const SilentRefresh = () => {
  useEffect(() => {
    const interval = setInterval(async () => {
      await axios.post(
        "http://localhost:5000/api/auth/refresh",
        {},
        { withCredentials: true }
      );
    }, 1000 * 60 * 10);

    return () => clearInterval(interval);
  }, []);

  return null;
};

export default SilentRefresh;
