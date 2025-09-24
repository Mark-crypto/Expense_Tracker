import axiosInstance from "../axiosInstance.js";
import { useQuery } from "@tanstack/react-query";
import Loading from "../components/Loading.jsx";
import UserCard from "@/components/UserCard.jsx";
import UserTable from "@/components/UserTable.jsx";
import RoleTable from "@/components/RoleTable.jsx";
import LineGraph from "@/components/LineGraph.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { Navigate } from "react-router-dom";
import Unauthorized from "./Unauthorized.jsx";
import NotAdmin from "./NotAdmin.jsx";
// import Unauthorized from "./Unauthorized.jsx";

const AdminDashboard = () => {
  const { isAdmin, isAuthenticated, user } = useAuth();
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      return await axiosInstance.get("/admin-dashboard");
    },
  });

  if (isLoading) {
    return <Loading />;
  }
  if (!isAuthenticated) return <Unauthorized />;
  if (!isAdmin) {
    return <NotAdmin />;
  }
  if (error) {
    console.log("Something went wrong");
  }
  return (
    <div className="admin-dashboard">
      <div>
        <UserCard
          activeUsers={data?.data?.data?.activeUsers}
          inactiveUsers={data?.data?.data?.inactiveUsers}
          newUsers={data?.data?.data?.newUsers}
          totalUsers={data?.data?.data?.totalUsers}
        />
      </div>
      <div>
        <UserTable users={data?.data?.data?.allUsers} />
      </div>
      <div>
        <LineGraph data={data?.data?.data?.activeByMonth} />
      </div>
      <div>
        <RoleTable roles={data?.data?.data?.allUsers} />
      </div>
    </div>
  );
};

export default AdminDashboard;

// Rows: user_id, name, email,status, role,occupation, age,goal,
// created_at //
