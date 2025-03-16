import React from "react";

const Navbar = () => {
  return (
    <>
      <div>
        <h1>Expense Tracker</h1>
        <button>User Profile</button>
        <ul>
          <li>
            <a href="">New Expense</a>
          </li>
          <li>
            <a href="">Dashboard</a>
          </li>
          <li>
            <a href="">Budget</a>
          </li>
          <li>
            <a href="">History</a>
          </li>
          <li>
            <a href="">Settings</a>
          </li>
          <li>
            <a href="">Logout</a>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Navbar;
