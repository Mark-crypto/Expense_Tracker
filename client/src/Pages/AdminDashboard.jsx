import axiosInstance from "../axiosInstance.js";
import { useQuery } from "@tanstack/react-query";
import Loading from "../components/Loading.jsx";
import UserCard from "@/components/UserCard.jsx";
import UserTable from "@/components/UserTable.jsx";
import RoleTable from "@/components/RoleTable.jsx";
import LineGraph from "@/components/LineGraph.jsx";

const AdminDashboard = () => {
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
    console.log("Something went wrong");
  }
  return (
    <div className="admin-dashboard">
      <h1>Hello, Admin</h1>
      {data?.data?.data.map((user) => {
        return (
          <div key={user.user_id}>
            <p>{user.name}</p>
            <p>{user.email}</p>
          </div>
        );
      })}

      <div>
        <UserCard />
      </div>
      <div>
        <UserTable />
      </div>
      <div>
        <LineGraph />
      </div>
      <div>
        <RoleTable />
      </div>
    </div>
  );
};

export default AdminDashboard;

// Rows: user_id, name, email,status, role,occupation, age,goal,
// created_at // -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
