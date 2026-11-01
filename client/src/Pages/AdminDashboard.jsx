import { useQuery } from "@tanstack/react-query";
import { UserCheck, UserMinus, UserPlus, Users } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance.js";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, Badge, EmptyState, ErrorState, PageHeader, StatCard } from "@/components/ui/common";
import ActiveUsersChart from "@/components/charts/ActiveUsersChart";
import Loading from "@/components/Loading";
import { useAuth } from "@/hooks/useAuth";
import { initials, titleCase } from "@/lib/format";
import NotAdmin from "./NotAdmin";

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => await axiosInstance.get("/admin-dashboard"),
    enabled: isAdmin,
  });

  if (!isAdmin) return <NotAdmin />;
  if (isLoading) return <Loading />;
  if (error) return <ErrorState onRetry={refetch} />;

  const stats = data?.data?.data;
  const users = stats?.allUsers ?? [];

  return (
    <>
      <PageHeader title="Admin" description="Users and activity across the system." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total users" icon={Users} value={(stats?.totalUsers?.[0]?.total_users ?? 0).toLocaleString()} />
        <StatCard label="Active" icon={UserCheck} value={(stats?.activeUsers?.[0]?.active_users ?? 0).toLocaleString()} />
        <StatCard label="Inactive" icon={UserMinus} value={(stats?.inactiveUsers?.[0]?.inactive_users ?? 0).toLocaleString()} />
        <StatCard label="New this week" icon={UserPlus} value={(stats?.newUsers?.[0]?.users_last_week ?? 0).toLocaleString()} />
      </div>

      <Card className="mt-4">
        <CardHeader title="Active users by signup month" />
        <CardContent>
          <div className="h-64">
            <ActiveUsersChart data={stats?.activeByMonth} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Users" description={`${users.length} accounts`} />
        {users.length === 0 ? (
          <EmptyState icon={Users} title="No users found" />
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">User</th>
                  <th className="hidden px-3 py-2.5 font-medium md:table-cell">Goal</th>
                  <th className="px-3 py-2.5 font-medium">Role</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar text={initials(user.name)} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{titleCase(user.name)}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden max-w-56 truncate px-3 py-3 text-muted-foreground md:table-cell">
                      {user.goal || "Not set"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={user.role === "admin" ? "accent" : "neutral"}>
                        {titleCase(user.role || "user")}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={user.status === "active" ? "success" : "neutral"}>
                        {titleCase(user.status || "unknown")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
};

export default AdminDashboard;
