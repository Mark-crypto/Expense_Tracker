import { FaUserCircle, FaWallet, FaHistory } from "react-icons/fa";
import { IoMdAdd, IoMdSettings } from "react-icons/io";
import { MdSpaceDashboard, MdLogout } from "react-icons/md";
import { TbBulb } from "react-icons/tb";
import { useNavigate, useLocation } from "react-router-dom";
import { doSignOut } from "../services/auth";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import { toast } from "react-toastify";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  console.log(user.id);

  const { mutate } = useMutation({
    mutationFn: async () => {
      return axiosInstance.post("/auth/logout", {});
    },
    onSuccess: () => {
      navigate("/");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const handleLogout = () => {
    mutate();
    doSignOut().then(() => {});
  };

  const links = [
    { label: "New Expense", icon: <IoMdAdd />, path: "/expense-form" },
    { label: "Dashboard", icon: <MdSpaceDashboard />, path: "/dashboard" },
    { label: "AI Predictions", icon: <TbBulb />, path: "/predictions" },
    { label: "Budget", icon: <FaWallet />, path: "/budget" },
    { label: "History", icon: <FaHistory />, path: "/history" },
    // { label: "Settings", icon: <IoMdSettings />, path: "/settings" },
  ];

  const linkBaseStyles =
    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition duration-200";
  const hoverStyles = "hover:bg-purple-100 hover:text-purple-700";
  const activeStyles = "bg-purple-100 text-purple-700 font-semibold";

  return (
    <aside className="h-screen w-64 bg-white/70 backdrop-blur-md border-r border-gray-200 shadow-xl flex flex-col justify-between fixed z-10">
      <div>
        {/* Header */}
        <div className="flex items-center justify-center h-20 border-b border-gray-200">
          <h2 className="text-xl font-bold text-purple-700 italic tracking-wide">
            Expense Tracker
          </h2>
        </div>

        {/* User Profile */}
        <div className="px-4 py-6 border-b border-gray-100">
          <a
            href={`/new/profile/${parseInt(user.id)}`}
            className={`${linkBaseStyles} ${hoverStyles} ${
              location.pathname === `/profile/${parseInt(user.id)}`
                ? activeStyles
                : ""
            }`}
          >
            <FaUserCircle className="text-xl text-purple-500" />
            <span>User Profile</span>
          </a>
        </div>

        {/* Navigation Links */}
        <nav className="px-4 py-4 space-y-1">
          {links.map((link) => (
            <a
              key={link.path}
              href={link.path}
              className={`${linkBaseStyles} ${hoverStyles} ${
                location.pathname === link.path ? activeStyles : "text-gray-700"
              }`}
            >
              <span className="text-lg text-purple-500">{link.icon}</span>
              <span>{link.label}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 font-medium rounded-xl transition hover:bg-red-100 hover:text-red-700 w-full text-left"
        >
          <MdLogout className="text-xl" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Navbar;
