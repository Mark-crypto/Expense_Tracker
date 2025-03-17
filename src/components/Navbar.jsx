import { FaUserCircle } from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";
import { MdSpaceDashboard } from "react-icons/md";
import { TbBulb } from "react-icons/tb";
import { FaWallet } from "react-icons/fa";
import { FaHistory } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { MdLogout } from "react-icons/md";

const Navbar = () => {
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
        <button className="btn-nav">
          <FaUserCircle style={{ marginRight: "8px", fontSize: "22px" }} />
          User Profile
        </button>
        <ul>
          <li>
            <a href="">
              <IoMdAdd style={{ marginRight: "8px", fontSize: "25px" }} />
              New Expense
            </a>
          </li>
          <li>
            <a href="">
              <MdSpaceDashboard
                style={{ marginRight: "8px", fontSize: "25px" }}
              />
              Dashboard
            </a>
          </li>
          <li>
            <a href="">
              <TbBulb style={{ marginRight: "8px", fontSize: "25px" }} />
              AI Predictions
            </a>
          </li>
          <li>
            <a href="">
              <FaWallet style={{ marginRight: "8px", fontSize: "25px" }} />
              Budget
            </a>
          </li>
          <li>
            <a href="">
              <FaHistory style={{ marginRight: "8px", fontSize: "25px" }} />
              History
            </a>
          </li>
          <li>
            <a href="">
              <IoMdSettings style={{ marginRight: "8px", fontSize: "25px" }} />
              Settings
            </a>
          </li>
          <li>
            <a href="">
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
