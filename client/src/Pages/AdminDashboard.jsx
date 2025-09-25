import axiosInstance from "../axiosInstance.js";
import { useQuery } from "@tanstack/react-query";
import Loading from "../components/Loading.jsx";
import UserCard from "@/components/UserCard.jsx";
import UserTable from "@/components/UserTable.jsx";
import RoleTable from "@/components/RoleTable.jsx";
import LineGraph from "@/components/LineGraph.jsx";
import { useAuth } from "../hooks/useAuth.jsx";

import NotAdmin from "./NotAdmin.jsx";
import { toast, ToastContainer } from "react-toastify";

const AdminDashboard = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      return await axiosInstance.get("/admin-dashboard");
    },
  });

  if (isLoading) {
    return <Loading />;
  }
  if (!isAuthenticated) return <NotAdmin />;
  if (!isAdmin) {
    return <NotAdmin />;
  }
  if (error) {
    toast.error("Something went wrong");
  }
  return (
    <div className="admin-dashboard">
      <ToastContainer />
      <div>
        <UserCard
          activeUsers={data?.data?.data?.activeUsers}
          inactiveUsers={data?.data?.data?.inactiveUsers}
          newUsers={data?.data?.data?.newUsers}
          totalUsers={data?.data?.data?.totalUsers}
        />
      </div>
      <div className="mt-6 mx-6">
        <UserTable users={data?.data?.data?.allUsers} />
      </div>
      <div className="mt-6 mx-6">
        <LineGraph data={data?.data?.data?.activeByMonth} />
      </div>
      <div className="mt-6 mb-6 mx-6 ">
        <RoleTable roles={data?.data?.data?.allUsers} />
      </div>
    </div>
  );
};

export default AdminDashboard;
