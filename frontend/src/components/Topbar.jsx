import React, { useEffect, useState } from "react";
import { MdSearch, MdAccountCircle, MdMenu, MdClose } from "react-icons/md";
import "./Topbar.css";

const Topbar = ({ onSearch, searchTerm, isCollapsed, setIsCollapsed }) => {
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    const userStr = sessionStorage.getItem("admin_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.name) {
        setUserName(user.name);
      }
    }
  }, []);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="mobile-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <MdMenu /> : <MdClose />}
        </button>
        <div className="search-container">
          <MdSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search bookings, slots..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="topbar-right">
        <div className="admin-profile-minimal">
          <MdAccountCircle className="profile-icon-small" />
          <span className="admin-name-text">{userName}</span>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
