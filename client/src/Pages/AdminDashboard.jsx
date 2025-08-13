import axiosInstance from "../axiosInstance.js";
import { useQuery } from "@tanstack/react-query";
import Loading from "../components/Loading.jsx";
import UserCard from "@/components/UserCard.jsx";
import UserTable from "@/components/UserTable.jsx";

const userInfo = [
  { groupName: "Total Users", total: 50 },
  { groupName: "Active Users", total: 40 },
  { groupName: "Inactive Users", total: 10 },
];
const AdminDashboard = () => {
  // const { data, error, isLoading } = useQuery({
  //   queryKey: ["admin-dashboard"],
  //   queryFn: async () => {
  //     return await axiosInstance.get("/admin-dashboard");
  //   },
  // });

  // if (isLoading) {
  //   return <Loading />;
  // }
  // if (error) {
  //   toast.error("Something went wrong");
  // }
  return (
    <>
      <h1>Hello, Admin</h1>
      <div>
        <UserCard />
      </div>
      <div>
        <UserTable />
      </div>
      <div>
        <p>Graph: line graph of users joining over the year</p>
      </div>
      <p> I will display: users, reports, and possibly logs</p>
    </>
  );
};

export default AdminDashboard;
