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

const RoleTable = ({ roles }) => {
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
            {roles.length > 0 ? (
              roles.map((role, index) => (
                <motion.tr
                  key={role.user_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-800 font-medium">
                          {role.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">
                          {role.name}
                        </div>
                        <div className="text-gray-500">{role.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">{role.role}</td>

                  <td className="px-4 py-4">
                    <button className="text-red-500 hover:text-red-700 p-1">
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
    </div>
  );
};

export default RoleTable;
