import axiosInstance from "@/axiosInstance";

const BudgetDownloadBtn = () => {
  const downloadReport = async () => {
    try {
      const response = await axiosInstance.get("/budget/download-report", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "budget_report.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.log("An error occurred while downloading");
    }
  };
  return (
    <>
      <div>
        <button onClick={() => downloadReport()}>Download</button>
      </div>
    </>
  );
};
export default BudgetDownloadBtn;
