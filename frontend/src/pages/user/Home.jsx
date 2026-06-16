import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./home.css";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Pre-fill from state if coming back from Booking page
    if (location.state) {
      const { preSelectedCity, preSelectedDate, preSelectedStartTime, preSelectedEndTime, preSelectedVehicleNumber, preSelectedVehicleType } = location.state;
      if (preSelectedCity) setSelectedCity(preSelectedCity);
      if (preSelectedDate) setSelectedDate(preSelectedDate);
      if (preSelectedStartTime) setStartTime(preSelectedStartTime);
      if (preSelectedEndTime) setEndTime(preSelectedEndTime);
      if (preSelectedVehicleNumber) setVehicleNumber(preSelectedVehicleNumber);
      if (preSelectedVehicleType) setVehicleType(preSelectedVehicleType);

      // If we have city, auto-trigger search to show areas
      if (preSelectedCity) {
        const fetchPreSearch = async () => {
          try {
            setIsSearching(true);
            const res = await axios.get(`http://localhost:5000/api/location/areas/${preSelectedCity}`);
            setSearchResults(res.data);
            setIsSearching(false);
          } catch (error) {
            console.log("PRE-SEARCH ERROR:", error);
            setIsSearching(false);
          }
        };
        fetchPreSearch();
      }
    }
  }, [location.state]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/location/cities");
        setCities(res.data);
      } catch (error) {
        console.log("CITY FETCH ERROR:", error);
      }
    };
    fetchCities();
  }, []);

  const handleSearch = async () => {
    if (!selectedCity) {
      alert("Please select a city");
      return;
    }
    if (!selectedDate) {
      alert("Please select a date");
      return;
    }
    if (!startTime) {
      alert("Please select start time");
      return;
    }
    if (!vehicleNumber) {
      alert("Please enter vehicle number");
      return;
    }
    if (!vehicleType) {
      alert("Please select vehicle type");
      return;
    }
    if (endTime && startTime >= endTime) {
      alert("End time must be after start time");
      return;
    }

    try {
      setIsSearching(true);
      const res = await axios.get(`http://localhost:5000/api/location/areas/${selectedCity}`);
      setSearchResults(res.data);
      setIsSearching(false);

      if (res.data.length === 0) {
        alert("Sorry, no parking locations found in this city.");
      } else {
        setTimeout(() => {
          const resultsSection = document.getElementById("search-results-section");
          if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      }
    } catch (error) {
      console.log("SEARCH ERROR:", error);
      alert("Error checking availability. Please try again.");
      setIsSearching(false);
    }
  };

  const handleBookNow = (area) => {
    if (area.availableSlots <= 0) {
      alert("Sorry, this area is currently full.");
      return;
    }

    navigate("/booking", {
      state: {
        city: selectedCity,
        date: selectedDate,
        startTime: startTime,
        endTime: endTime,
        vehicleNumber: vehicleNumber,
        vehicleType: vehicleType,
        preSelectedArea: area.area
      }
    });
  };

  return (
    <div className="home-wrapper">
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-container">
          <div className="hero-content-left">
            {/* <h1 className="hero-title">Maximizing the potential of your car park</h1> */}
            {/* <p className="hero-subtitle">
              The global leader in smart parking management and innovative car park solutions.
              Safe, cashless, and efficient parking at your fingertips.
            </p> */}
              <br/>
            <div className="search-bar-container">
              <div className="search-input-group">
                <label>Find Parking In</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="city-select-home"
                >
                  <option value="">Choose a city...</option>
                  {cities.map((city, index) => (
                    <option key={index} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="search-input-group">
                <label>Booking Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="search-input-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="search-input-group">
                <label>End Time (Optional)</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="Default 1 Hour"
                />
              </div>

              <div className="search-input-group">
                <label>Vehicle Number</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="GJ01AB1234"
                  style={{ textTransform: "uppercase" }}
                />
              </div>

              <div className="search-input-group">
                <label>Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="city-select-home"
                >
                  <option value="">Select Type</option>
                  <option value="Two Wheeler">Two Wheeler</option>
                  <option value="Four Wheeler">Four Wheeler</option>
                </select>
              </div>

              <button
                className="find-parking-btn"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? "Searching..." : "Find parking"}
              </button>
            </div>
          </div>
        </div>
      </section>
{/*
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <h2>250+</h2>
              <p>Operating Car Parks</p>
            </div>
            <div className="stat-item">
              <h2>40+</h2>
              <p>Cities Covered</p>
            </div>
            <div className="stat-item">
              <h2>7.5M</h2>
              <p>Vehicles Per Month</p>
            </div>
            <div className="stat-item">
              <h2>2.75L</h2>
              <p>Vehicle Bays</p>
            </div>
          </div>
        </div>
      </section> */}

      <section className="services-section">
        <div className="container">
          <h2 className="section-title">Our Holistic Solutions</h2>
          <p className="section-subtitle">We integrate design, operations, technology, and data insights to create sustainable mobility ecosystems.</p>

          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon"><i className="bi bi-diagram-3"></i></div>
              <h3>Consultancy Services</h3>
              <p>Our experts design and optimize car park facilities for malls, offices, hospitals, and airports to maximize returns.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="bi bi-cpu"></i></div>
              <h3>Smart Technology</h3>
              <p>IoT-enabled parking systems, digital ticketing, and FASTag integrations to make parking seamless and profitable.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="bi bi-gear"></i></div>
              <h3>Operational Excellence</h3>
              <p>We manage daily parking operations with a focus on occupancy optimization and customer satisfaction.</p>
            </div>
          </div>
        </div>
      </section>

      {searchResults.length > 0 && (
        <section id="search-results-section" className="results-section">
          <div className="container">
            <h2 className="section-title">Available Parking in {selectedCity}</h2>
            <p className="section-subtitle">Select the best spot for your vehicle from our verified locations.</p>
            <div className="results-grid">
              {searchResults.map((area) => (
                <div key={area._id} className={`result-card ${area.availableSlots <= 0 ? 'full' : ''}`}>
                  <div className="result-header">
                    <h3>{area.area}</h3>
                    <span className="price-tag">₹{area.price}/hr</span>
                  </div>

                  <div className="result-body">
                    <p className="slot-availability">
                      <i className="bi bi-p-square-fill"></i>
                      {area.availableSlots > 0
                        ? `${area.availableSlots} Slots Available`
                        : "No Slots Available"}
                    </p>
                    {area.mapUrl && (
                      <a
                        href={area.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="map-link"
                      >
                        <i className="bi bi-geo-alt"></i> View on Map
                      </a>
                    )}
                  </div>

                  <div className="result-footer">
                    <button
                      className="book-now-btn"
                      onClick={() => handleBookNow(area)}
                      disabled={area.availableSlots <= 0}
                    >
                      {area.availableSlots > 0 ? "Book Now" : "Fully Booked"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Secure Parking?</h2>
          <p className="section-subtitle">Experience superior service through innovative technology and end-to-end solutions.</p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><i className="bi bi-shield-check"></i></div>
              <h3>Superior Service</h3>
              <p>Over four decades of global experience in vehicle flow and customer convenience management.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="bi bi-lightning-charge"></i></div>
              <h3>Innovative Tech</h3>
              <p>Contactless entry, digital payment systems, and AI-based smart parking technologies.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="bi bi-graph-up-arrow"></i></div>
              <h3>Revenue Growth</h3>
              <p>Software systems that track all transactions and prevent pilferage through digital payments.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="bi bi-people"></i></div>
              <h3>Trained Manpower</h3>
              <p>Professional valet operations with certified drivers and digital tracking systems.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <div className="about-content-box">
            <div className="about-text">
              <h2>About Secure Parking</h2>
              <p>
                Established as a global leader in car park management, we operate across 12 countries.
                In India, we manage over 2.75 lakh parking bays for shopping malls, IT parks, hospitals,
                and public facilities.
              </p>
              <p>
                Our mission is to balance efficiency, profitability, and exceptional customer experience
                through smart parking management and sustainability-driven solutions.
              </p>
              <NavLink to="/about" className="read-more-btn">Read More About Us</NavLink>
            </div>
            <div className="about-image">
              <img src="https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=1000" alt="Modern Parking Facility" />
            </div>
          </div>
        </div>
      </section>


    </div>
  );
};

export default Home;

