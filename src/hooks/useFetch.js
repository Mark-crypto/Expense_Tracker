import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(url, {
          cancelToken: cancelToken.token,
        });
        setData(response.data);
        if (response.status === 200) {
          toast.success("Data fetched successfully!");
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          toast.success("Request cancelled", error.message);
        } else {
          setError(error.message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelToken.cancel("Request cancelled by cleanup function");
    };
  }, [url]);

  return { data, loading, error };
};
