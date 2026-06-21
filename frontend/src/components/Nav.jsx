import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './nav.css'
import { NavLink } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";

const Nav = () => {
  const location = useLocation();
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const user = sessionStorage.getItem("user_user");
    
    if (user && user !== "undefined" && user !== "null") {
      setIsUserLoggedIn(true);
    } else {
      setIsUserLoggedIn(false);
    }
  }, [location.pathname]);

  const isHomePage = location.pathname === "/";

  return (
    <div className="nav-wrapper">
      <header className={`navbar ${isHomePage ? 'is-home' : 'is-solid'}`}>
        <div className="logo">
          <Link to="/" className="logo-link" onClick={() => setIsOpen(false)}>
            <i className="bi bi-geo-alt-fill"></i> Parking
          </Link>
        </div>

        <div className="hamburger" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiX size={28} color="#1e3c72" /> : <FiMenu size={28} color="#1e3c72" />}
        </div>

        <nav className={`nav-menu ${isOpen ? "open" : ""}`}>
          <ul className="nav-links">
            <li><NavLink to="/" end onClick={() => setIsOpen(false)}>Home</NavLink></li>
            <li><NavLink to="/about" end onClick={() => setIsOpen(false)}>About</NavLink></li>
            <li><NavLink to="/contact" end onClick={() => setIsOpen(false)}>Contact</NavLink></li>
            <li><NavLink to="/feedback" end onClick={() => setIsOpen(false)}>Feedback</NavLink></li>

            {isUserLoggedIn ? (
              <>
                <li><NavLink to="/profile" end className="profile-btn-nav" onClick={() => setIsOpen(false)}>Profile</NavLink></li>
              </>
            ) : (
              <li><NavLink to="/login" end className="login-btn-nav" onClick={() => setIsOpen(false)}>Login</NavLink></li>
            )}
          </ul>
        </nav>
      </header>
    </div>
  )
}

export default Nav
