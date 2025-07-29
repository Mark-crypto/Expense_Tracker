import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const useStoreData = (url, data) => {
  const [error, setError] = useState(null);
  const fetchData = async () => {
    try {
      const response = await axios.post(url, data);
      if (response.status === 201) {
        toast.success("Data stored successfully!");
      } else {
        toast.error("Failed to fetch data");
      }
    } catch (error) {
      setError(error.message);
    }
  };
  return { fetchData, error };
};
