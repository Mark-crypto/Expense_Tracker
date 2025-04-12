import { FaUserCircle } from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";
import { MdSpaceDashboard } from "react-icons/md";
import { TbBulb } from "react-icons/tb";
import { FaWallet } from "react-icons/fa";
import { FaHistory } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { MdLogout } from "react-icons/md";
import { doSignOut } from "../services/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  // const {userLoggedIn, currentUser } = useAuth();
  const handleLogout = () => {
    doSignOut().then(() => {
      navigate("/login");
    });
  };
  return (
    <>
      <div className="navbar">
        <h3
          style={{
            fontStyle: "italic",
            color: "#9D00FF",
          }}
        >
          Expense Tracker
        </h3>
        <a href="/profile">
          <button className="btn-nav">
            <FaUserCircle style={{ marginRight: "8px", fontSize: "22px" }} />
            {/* {currentUser.displayName ? currentUser.displayName : currentUser.email} */}
            User Profile
          </button>
        </a>
        <ul>
          <li>
            <a href="/expense-form">
              <IoMdAdd style={{ marginRight: "8px", fontSize: "25px" }} />
              New Expense
            </a>
          </li>
          <li>
            <a href="/">
              <MdSpaceDashboard
                style={{ marginRight: "8px", fontSize: "25px" }}
              />
              Dashboard
            </a>
          </li>
          <li>
            <a href="/predictions">
              <TbBulb style={{ marginRight: "8px", fontSize: "25px" }} />
              AI Predictions
            </a>
          </li>
          <li>
            <a href="/budget">
              <FaWallet style={{ marginRight: "8px", fontSize: "25px" }} />
              Budget
            </a>
          </li>
          <li>
            <a href="/history">
              <FaHistory style={{ marginRight: "8px", fontSize: "25px" }} />
              History
            </a>
          </li>
          <li>
            <a href="/settings">
              <IoMdSettings style={{ marginRight: "8px", fontSize: "25px" }} />
              Settings
            </a>
          </li>
          <li>
            <a href="" onClick={handleLogout}>
              <MdLogout style={{ marginRight: "8px", fontSize: "25px" }} />
              Logout
            </a>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Navbar;
