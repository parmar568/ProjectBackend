import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./feedback.css";

const Feedback = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleRatingClick = (rating) => {
    setFormData({ ...formData, rating });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/feedback/add", {
        userId: user ? user._id : null,
        name: user ? user.name : "Anonymous",
        email: user ? user.email : "N/A",
        rating: formData.rating,
        comment: formData.comment
      });
      alert("Thank you for your valuable feedback!");
      setFormData({
        rating: 5,
        comment: ""
      });
      navigate("/");
    } catch (error) {
      alert("Failed to submit feedback. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        <div className="feedback-header">
          <h2>Parking System Feedback</h2>
          <p>We value your experience. Help us improve our smart parking system.</p>
        </div>

        <form className="feedback-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Rate Your Experience</label>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= formData.rating ? "active" : ""}`}
                  onClick={() => handleRatingClick(star)}
                >
                  ★
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Click on stars to rate (1 to 5)</p>
          </div>

          <div className="form-group">
            <label>Your Comments</label>
            <textarea
              name="comment"
              placeholder="Tell us about your parking experience, suggestions, or any issues you faced..."
              rows="6"
              value={formData.comment}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <button type="submit" className="submit-feedback-btn" disabled={loading}>
            {loading ? "Submitting..." : "Submit My Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
