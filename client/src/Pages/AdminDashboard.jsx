import axiosInstance from "../axiosInstance.js"
import { useQuery } from "@tanstack/react-query";
import Loading from "../components/Loading.jsx"


const AdminDashboard = ()=>{
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      return await axiosInstance.get("/admin-dashboard");
    },
  });

  if (isLoading) {
    return <Loading />;
  }
  if (error) {
    toast.error("Something went wrong");
  }
return(
    <>
    <h1>Hello, Admin</h1>
    <p> I will display: users, reports, and possibly logs</p>
    </>
)
}


export default AdminDashboard;