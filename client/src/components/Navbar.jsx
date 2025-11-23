import { useState, useEffect } from "react";
import {
  FaUserCircle,
  FaWallet,
  FaHistory,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";
import { MdSpaceDashboard, MdLogout } from "react-icons/md";
import { TbBulb } from "react-icons/tb";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-toastify";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  const { logout } = useAuth();

  // State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Close mobile menu when switching to desktop
      if (!mobile && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    toast.success("Logout successful");
    navigate("/");
  };

  const links = [
    { label: "New Expense", icon: <IoMdAdd />, path: "/expense-form" },
    { label: "Dashboard", icon: <MdSpaceDashboard />, path: "/dashboard" },
    { label: "AI Predictions", icon: <TbBulb />, path: "/predictions" },
    { label: "Budget", icon: <FaWallet />, path: "/budget" },
    { label: "Expense History", icon: <FaHistory />, path: "/history" },
  ];

  const linkBaseStyles =
    "flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-xl transition duration-200";
  const hoverStyles = "hover:bg-purple-100 hover:text-purple-700";
  const activeStyles = "bg-purple-100 text-purple-700 font-semibold";

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu after navigation
  const handleNavClick = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Header - Only hamburger icon */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-12 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-md z-30 flex items-center px-4">
          {/* Only hamburger icon on the left */}
          <button
            onClick={toggleMobileMenu}
            className="p-2 text-purple-700 rounded-lg hover:bg-purple-100 transition"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>
      )}

      {/* Sidebar/Navigation */}
      <aside
        className={`
          ${
            isMobile
              ? `fixed top-12 left-0 right-0 h-[calc(100vh-3rem)] bg-white/95 backdrop-blur-md transform transition-transform duration-300 z-20 ${
                  isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                }`
              : "h-screen w-64 bg-white/70 backdrop-blur-md border-r border-gray-200 shadow-xl fixed z-10"
          } 
          flex flex-col
        `}
      >
        {/* Scrollable content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0">
            {/* Desktop Header - Only show on desktop */}
            {!isMobile && (
              <div className="flex items-center justify-center h-16 border-b border-gray-200">
                <h2 className="text-xl font-bold text-purple-700 italic tracking-wide">
                  Expense Tracker
                </h2>
              </div>
            )}

            {/* Welcome Message - Only show when menu is open on mobile */}
            {(isMobileMenuOpen || !isMobile) && (
              <div className="px-3 pt-3 pb-2">
                <p className="text-gray-600 font-medium text-sm">
                  Welcome,{" "}
                  <span className="text-purple-700 text-xs">
                    {user?.name?.toUpperCase()}
                  </span>
                </p>
              </div>
            )}

            {/* User Profile - Only show when menu is open on mobile */}
            {(isMobileMenuOpen || !isMobile) && (
              <div className="px-4 border-b border-gray-100">
                <a
                  href={`/new/profile/${parseInt(user.id)}`}
                  onClick={handleNavClick}
                  className={`${linkBaseStyles} ${hoverStyles} ${
                    location.pathname === `/profile/${parseInt(user.id)}`
                      ? activeStyles
                      : ""
                  }`}
                >
                  <FaUserCircle className="text-lg text-purple-500" />
                  <span>User Profile</span>
                </a>
              </div>
            )}

            {/* Admin page link - Only show when menu is open on mobile */}
            {(isMobileMenuOpen || !isMobile) &&
              user &&
              user.role === "admin" && (
                <div className="px-4 border-b border-gray-100">
                  <a
                    href={`/admin-dashboard`}
                    onClick={handleNavClick}
                    className={`${linkBaseStyles} ${hoverStyles} ${
                      location.pathname === `/admin-dashboard`
                        ? activeStyles
                        : ""
                    }`}
                  >
                    <MdSpaceDashboard className="text-lg text-purple-500" />
                    <span>Admin Dashboard</span>
                  </a>
                </div>
              )}
          </div>

          {/* Navigation Links - Only show when menu is open on mobile */}
          {(isMobileMenuOpen || !isMobile) && (
            <div className="flex-1 overflow-y-auto">
              <nav className="px-4 py-2 space-y-1">
                {links.map((link) => (
                  <a
                    key={link.path}
                    href={link.path}
                    onClick={handleNavClick}
                    className={`${linkBaseStyles} ${hoverStyles} ${
                      location.pathname === link.path
                        ? activeStyles
                        : "text-gray-700"
                    }`}
                  >
                    <span className="text-lg text-purple-500">{link.icon}</span>
                    <span>{link.label}</span>
                  </a>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Logout Button - Always visible when menu is open on mobile */}
        {(isMobileMenuOpen || !isMobile) && (
          <div className="flex-shrink-0 p-3 border-t border-gray-100 bg-white/70">
            <button
              onClick={() => {
                handleLogout();
                handleNavClick();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 font-medium rounded-xl transition hover:bg-red-100 hover:text-red-700 w-full text-left"
            >
              <MdLogout className="text-lg" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </aside>

      {/* Overlay for mobile menu */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
