import axiosInstance from "../axiosInstance.js";
import { useQuery } from "@tanstack/react-query";
import Loading from "../components/Loading.jsx";
import UserCard from "@/components/UserCard.jsx";
import UserTable from "@/components/UserTable.jsx";
import RoleTable from "@/components/RoleTable.jsx";
import LineGraph from "@/components/LineGraph.jsx";
// import { useAuth } from "@/context/AuthenticationContext.jsx";
// import Unauthorized from "./Unauthorized.jsx";

const AdminDashboard = () => {
  // const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      return await axiosInstance.get("/admin-dashboard");
    },
  });
  //data.data.data.allUsers,totalUsers,newUsers,activeUsers,inactiveUsers,activeByMonth,
  if (isLoading) {
    return <Loading />;
  }
  // if (!isAuthenticated) return <Navigate to="/login" />;
  // if (!isAdmin) return <Unauthorized />;
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
