import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ManageLocation.css";

const ManageFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/feedback/all");
      setFeedbacks(res.data);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    }
  };

  const handleDelete = async (id) => {
    console.log("Attempting to delete feedback with ID:", id);
    if (window.confirm("Are you sure you want to delete this feedback?")) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/feedback/${id}`);
        console.log("Delete response:", response.data);
        alert("Feedback deleted successfully!");
        fetchFeedbacks(); // Refresh the list
      } catch (error) {
        console.error("Error deleting feedback:", error);
        alert(`Failed to delete feedback: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#f6ad55' : '#cbd5e0', fontSize: '18px' }}>★</span>
    ));
  };

  return (
    <div className="manage-location-container">
      <h2>System Feedback</h2>

      <div className="location-list">
        <table>
          <thead>
            <tr>
{/*               <th>User Name</th> */}
{/*               <th>Email</th> */}
              <th>Rating</th>
              <th>Comment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.length > 0 ? feedbacks.map((feedback) => (
              <tr key={feedback._id}>
{/*                 <td>{feedback.name}</td> */}
{/*                 <td>{feedback.email}</td> */}
                <td style={{ minWidth: '120px' }}>{renderStars(feedback.rating)}</td>
                <td style={{ maxWidth: '300px' }}>{feedback.comment}</td>
                <td>{new Date(feedback.createdAt).toLocaleDateString()}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(feedback._id)}
                    style={{ padding: '6px 12px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No feedback found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageFeedback;
