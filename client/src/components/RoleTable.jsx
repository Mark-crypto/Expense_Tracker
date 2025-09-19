import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  User,
  Mail,
  Shield,
  Edit3,
  Trash2,
  Plus,
  Check,
  X,
} from "lucide-react";

const RoleTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState("");

  // Sample user data with roles
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "Admin",
      lastActive: "2 hours ago",
    },
    {
      id: 2,
      name: "Michael Chen",
      email: "michael@example.com",
      role: "Editor",
      lastActive: "5 hours ago",
    },
    {
      id: 3,
      name: "Emma Wilson",
      email: "emma@example.com",
      role: "Viewer",
      lastActive: "1 day ago",
    },
    {
      id: 4,
      name: "David Brown",
      email: "david@example.com",
      role: "Admin",
      lastActive: "3 hours ago",
    },
    {
      id: 5,
      name: "Priya Patel",
      email: "priya@example.com",
      role: "Editor",
      lastActive: "12 hours ago",
    },
    {
      id: 6,
      name: "James Wilson",
      email: "james@example.com",
      role: "Viewer",
      lastActive: "2 days ago",
    },
    {
      id: 7,
      name: "Lisa Garcia",
      email: "lisa@example.com",
      role: "Editor",
      lastActive: "6 hours ago",
    },
    {
      id: 8,
      name: "Robert Kim",
      email: "robert@example.com",
      role: "Viewer",
      lastActive: "3 days ago",
    },
  ]);

  // Available roles
  const roles = ["Admin", "Editor", "Viewer"];

  // Filter users based on search term and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Handle role update
  const handleRoleUpdate = (userId) => {
    if (!newRole) return;

    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );

    setEditingUser(null);
    setNewRole("");
  };

  // Handle user deletion
  const handleDeleteUser = (userId) => {
    setUsers(users.filter((user) => user.id !== userId));
  };

  // Role badge color mapping
  const getRoleColor = (role) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Editor":
        return "bg-blue-100 text-blue-800";
      case "Viewer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            User Roles Management
          </h2>
          <p className="text-gray-600 text-sm">
            Manage user permissions and access levels
          </p>
        </div>

        <button className="mt-4 md:mt-0 flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
          <Plus size={18} className="mr-2" />
          Add User
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="relative mb-4 sm:mb-0 sm:flex-1 sm:mr-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div className="flex items-center">
          <Filter size={18} className="text-gray-400 mr-2" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <User size={16} className="mr-2" />
                  User
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <Shield size={16} className="mr-2" />
                  Role
                </div>
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-800 font-medium">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {editingUser === user.id ? (
                      <div className="flex items-center">
                        <select
                          value={newRole || user.role}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="mr-2 px-2 py-1 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRoleUpdate(user.id)}
                          className="text-green-600 hover:text-green-800 p-1"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-red-600 hover:text-red-800 p-1 ml-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                        <button
                          onClick={() => setEditingUser(user.id)}
                          className="ml-2 text-gray-500 hover:text-purple-600 p-1"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                  No users found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-700 mb-4 sm:mb-0">
          Showing <span className="font-medium">{filteredUsers.length}</span> of{" "}
          <span className="font-medium">{users.length}</span> users
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 rounded-full mr-1"></div>
            <span className="text-xs text-gray-600 mr-3">Admin</span>
            <div className="w-3 h-3 bg-blue-100 rounded-full mr-1"></div>
            <span className="text-xs text-gray-600 mr-3">Editor</span>
            <div className="w-3 h-3 bg-green-100 rounded-full mr-1"></div>
            <span className="text-xs text-gray-600">Viewer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleTable;
