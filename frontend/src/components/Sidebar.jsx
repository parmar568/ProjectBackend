import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdEvent,
  MdLocalParking,
  MdPeople,
  MdBarChart,
  MdLogout,
  MdPayment,
  MdChevronLeft,
  MdMenu,
  MdContactSupport,
  MdFeedback,
  MdAddCircle
} from "react-icons/md";
import "./Sidebar.css";

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const userStr = sessionStorage.getItem("admin_user");
      const role = sessionStorage.getItem("admin_role");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user._id) {
          await fetch("http://localhost:5000/api/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user._id, role: role })
          });
        }
      }
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
    }
    sessionStorage.removeItem("admin_user");
    sessionStorage.removeItem("admin_role");
    sessionStorage.removeItem("admin_token");
    navigate("/login");
  };

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <MdDashboard /> },
    { name: "Bookings", path: "/admin/bookings", icon: <MdEvent /> },
    { name: "Parking Slots", path: "/admin/slots", icon: <MdLocalParking /> },
    { name: "Create Slots", path: "/admin/create-slots", icon: <MdAddCircle /> },
    { name: "Payments", path: "/admin/payments", icon: <MdPayment /> },
    { name: "Users", path: "/admin/users", icon: <MdPeople /> },
    { name: "Inquiries", path: "/admin/contact", icon: <MdContactSupport /> },
    { name: "Feedback", path: "/admin/feedback", icon: <MdFeedback /> },
    { name: "Reports", path: "/admin/reports", icon: <MdBarChart /> },

  ];

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <div className="logo-container">
            <div className="logo-icon">P</div>
            <h2 className="logo-text">ParkAdmin</h2>
          </div>
        )}
        <button className="toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <MdMenu /> : <MdChevronLeft />}
        </button>
      </div>
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.name} className={location.pathname === item.path ? "active" : ""}>
            <Link to={item.path} title={isCollapsed ? item.name : ""}>
              <span className="icon">{item.icon}</span>
              {!isCollapsed && <span className="name">{item.name}</span>}
            </Link>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn" title={isCollapsed ? "Logout" : ""}>
          <MdLogout />
          {!isCollapsed && <span className="name">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
