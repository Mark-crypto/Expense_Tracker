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
    <div className="admin-dashboard p-4 md:p-6">
      <ToastContainer className="!w-[90vw] sm:!w-auto" />

      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 text-sm md:text-base mt-1">
          Manage users, roles, and view system analytics
        </p>
      </div>

      {/* User Cards Section */}
      <div className="mb-6 md:mb-8">
        <UserCard
          activeUsers={data?.data?.data?.activeUsers}
          inactiveUsers={data?.data?.data?.inactiveUsers}
          newUsers={data?.data?.data?.newUsers}
          totalUsers={data?.data?.data?.totalUsers}
        />
      </div>

      {/* User Table Section */}
      <div className="mb-6 md:mb-8">
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm p-3 md:p-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">
            User Management
          </h2>
          <div className="overflow-x-auto">
            <UserTable users={data?.data?.data?.allUsers} />
          </div>
        </div>
      </div>

      {/* Line Graph Section */}
      <div className="mb-6 md:mb-8">
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm p-3 md:p-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">
            User Activity Over Time
          </h2>
          <LineGraph data={data?.data?.data?.activeByMonth} />
        </div>
      </div>

      {/* Role Table Section */}
      <div className="mb-4 md:mb-6">
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm p-3 md:p-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">
            User Roles Distribution
          </h2>
          <div className="overflow-x-auto">
            <RoleTable roles={data?.data?.data?.allUsers} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
