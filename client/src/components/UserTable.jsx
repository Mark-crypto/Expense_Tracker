import { User, Mail, Target, Search, Filter } from "lucide-react";

const UserTable = ({ users }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-2xl font-bold text-purple-500">
              User Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage and view all user accounts
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>Name</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>Email</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span>Goal</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length > 0 ? (
              users.map((user) => (
                <tr
                  key={user.user_id}
                  className="hover:bg-gray-50/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-700">
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          User ID: {user.user_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">Active</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.goal || "Not set"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Active
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No users found
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Add new users to see them listed here.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
