import axiosInstance from "../axiosInstance.js";
import { useQuery } from "@tanstack/react-query";
import Loading from "../components/Loading.jsx";
import UserCard from "@/components/UserCard.jsx";
import UserTable from "@/components/UserTable.jsx";

//npm install chart.js react-chartjs-2


// const userInfo = [
//   { groupName: "Total Users", total: 50 },
//   { groupName: "Active Users", total: 40 },
//   { groupName: "Inactive Users", total: 10 },
// ];
const AdminDashboard = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      return await axiosInstance.get("/admin-dashboard");
    },
  });
  console.log(data.data);
  if (isLoading) {
    return <Loading />;
  }
  if (error) {
    console.log("Something went wrong");
  }
  return (
  <div className="admin-dashboard">
    <h1>Hello, Admin</h1>

    <section>
      <UserCard userInfo={userInfo} />
    </section>

    <section>
      <UserTable users={data?.users} />
    </section>

    <section>
      <UserGrowthGraph data={data?.userGraphData} />
    </section>

    <section>
      <RecentReports reports={data?.reports} />
    </section>

    <section>
      <AuditLogs logs={data?.logs} />
    </section>
  </div>
);

};

export default AdminDashboard;
