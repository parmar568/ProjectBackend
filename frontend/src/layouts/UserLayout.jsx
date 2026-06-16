import React from "react";
import { Outlet } from "react-router-dom";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

const UserLayout = () => {
  return (
    <div className="user-layout">
      <Nav />
      <main className="user-main" style={{ minHeight: "calc(100vh - 200px)" }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default UserLayout;
