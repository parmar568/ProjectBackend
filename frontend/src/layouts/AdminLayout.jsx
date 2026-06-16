import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "./AdminLayout.css";

const AdminLayout = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Sidebar collapse state - default collapsed on mobile
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const role = sessionStorage.getItem("admin_role");
    if (role !== "admin") {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="admin-layout">

      {/* ✅ props pass kari */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className={`admin-main ${isCollapsed ? "collapsed" : ""}`}>
        <Topbar 
          onSearch={setSearchTerm} 
          searchTerm={searchTerm} 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
        />
        <div className="admin-content">
          <Outlet context={{ searchTerm }} />
        </div>
      </div>

    </div>
  );
};

export default AdminLayout;