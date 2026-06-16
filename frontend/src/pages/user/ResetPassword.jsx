import React, { useState } from "react";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import { authService } from "../../services/api";
import "./login.css";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const email = location.state?.email;
  const otpVerified = location.state?.otpVerified;

  if (!email || !otpVerified) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Unauthorized Access</h2>
          <p>Please perform OTP verification first.</p>
          <NavLink to="/forgot-password" style={{ color: "#1e3c72", display: "inline-block", marginTop: "15px" }}>Go to Forgot Password</NavLink>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await authService.resetPasswordDirect(email, newPassword);
      alert(res.data.message || "Password updated successfully!");
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Reset Password</h2>
        <p className="subtitle">Set your new password for {email}</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
