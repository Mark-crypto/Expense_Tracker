import { useState } from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";

const DownloadButton = ({ endpoint, filename, label = "Export to Excel", size }) => {
  const [loading, setLoading] = useState(false);

  const downloadReport = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(endpoint, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // 423 means the PIN box was closed without unlocking; nothing went wrong.
      if (error.response?.status !== 423) toast.error("Failed to download the report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" size={size} loading={loading} onClick={downloadReport}>
      {!loading && <DownloadSimple />}
      {loading ? "Downloading..." : label}
    </Button>
  );
};

export default DownloadButton;
