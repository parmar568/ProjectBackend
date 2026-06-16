import React from "react";
import { Link } from "react-router-dom";
import "./footer.css";

const Footer = () => {
  return (
    <footer className="footer-main">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <i className="bi bi-geo-alt-fill"></i> Secure Parking
          </Link>
          <p>
            The global leader in smart parking management and innovative car
            park solutions. Maximizing the potential of every car park.
          </p>
        <div className="footer-social">
          <a href="https://x.com/sanjay_sut28355" target="_blank" rel="noopener noreferrer">
            <i className="bi bi-twitter-x"></i>
          </a>

          <a href="https://wa.me/916354809288" target="_blank" rel="noopener noreferrer">
            <i className="bi bi-whatsapp"></i>
          </a>

          <a href="https://www.linkedin.com/in/mr-parmar-04804b301/" target="_blank" rel="noopener noreferrer">
            <i className="bi bi-linkedin"></i>
          </a>

          <a href="https://www.instagram.com/mr_parmar_3_4/" target="_blank" rel="noopener noreferrer">
            <i className="bi bi-instagram"></i>
          </a>
        </div>
        </div>

        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About Us</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
            <li>
              <Link to="/login">Member Login</Link>
            </li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>Get In Touch</h4>
          <p>
            <i className="bi bi-envelope"></i>support@smartparking.com
          </p>
          <p>
            <i className="bi bi-telephone"></i> +91 6354809288
          </p>
          <p>
            <i className="bi bi-geo-alt"></i> Gujarat, India
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>© 2026 Secure Parking India. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
