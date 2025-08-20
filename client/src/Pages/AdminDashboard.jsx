import axiosInstance from "../axiosInstance.js";
import { useQuery } from "@tanstack/react-query";
import Loading from "../components/Loading.jsx";
import UserCard from "@/components/UserCard.jsx";
import UserTable from "@/components/UserTable.jsx";

//npm install chart.js react-chartjs-2

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
        <h1>
          Rows: user_id, name, email,status, role,occupation, age,goal,
          created_at
        </h1>
        <p>Three cards: total users, active, inactive</p>
        <p>growth rate:user to month</p>
        <p>Ability to revoke user permissions</p>
        <p>Name, job, goal</p>
        <p>User to roles</p>
      </div>
      {/* <section>
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
    </section> */}
    </div>
  );
};

export default AdminDashboard;
