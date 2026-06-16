import React from "react";
import "./about.css";

const About = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="hero-content">
          <h1>Global Leader in Car Park Management</h1>
          <p>
            Established in 1979, Secure Parking operates across 12 countries, 
            delivering holistic traffic and parking management solutions.
          </p>
        </div>
      </section>

      {/* INTRO SECTION */}
      <section className="about-intro">
        <div className="container">
          <div className="intro-content-box">
            <div className="intro-text">
              <h2>Who We Are</h2>
              <p>
                In India, we manage 2.75 lakh parking bays for shopping malls, IT parks, hospitals, 
                and public facilities. Our mission is to balance efficiency, profitability, and 
                exceptional customer experience.
              </p>
              <p>
                Through our in-house division SecureTech, we continuously innovate with automation, 
                ticketing, and smart parking technologies. From contactless entry to digital 
                payment systems, our technology enhances efficiency.
              </p>
            </div>
            <div className="intro-image">
              <img src="https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=1000" alt="About Us" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="about-features">
        <div className="container">
          <h2>Superior Service & Innovation</h2>
          <p className="section-subtitle">Why leading developers choose Secure Parking for their assets.</p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><i className="bi bi-shield-check"></i></div>
              <h3>Operational Excellence</h3>
              <p>Expert management ensuring every parking facility is efficient, safe, and user-friendly.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="bi bi-cpu"></i></div>
              <h3>Innovative Tech</h3>
              <p>In-house development of automation, ticketing, and smart parking technologies.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="bi bi-graph-up"></i></div>
              <h3>Revenue Optimization</h3>
              <p>Advanced software tracking and digital payment integration to prevent pilferage.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="bi bi-people"></i></div>
              <h3>Trained Manpower</h3>
              <p>Skilled professionals and certified drivers for premium valet and ground operations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="about-mission">
        <div className="container">
          <h2>Our Mission</h2>
          <p>
            To transform traditional parking systems into intelligent, data-driven platforms 
            that improve efficiency, reduce traffic, and enhance user experience in modern cities 
            through smart parking management and sustainability-driven solutions.
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;
