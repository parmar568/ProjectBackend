import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { authService } from "../../services/api";
import "./login.css";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setLoading(true);
    try {
      const res = await authService.checkEmail(trimmedEmail);
      if (res.data && res.status === 200) {
        const finalEmail = res.data.email || trimmedEmail;
        setEmail(finalEmail);
        setStep(2); // Move to OTP entry step
        alert("OTP has been sent to your email!");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Email does not match our records.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      alert("Please enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyOTP(email, otp.trim());
      if (res.status === 200) {
        navigate("/reset-password", { state: { email, otpVerified: true } });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Invalid or expired OTP.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Forgot Password</h2>
        <p className="subtitle">
          {step === 1 ? "Enter your email to receive an OTP" : `Enter the OTP sent to ${email}`}
        </p>

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
            <div className="back-to-login" style={{ textAlign: "center", marginTop: "20px" }}>
              <NavLink to="/login" style={{ color: "#1e3c72", textDecoration: "none", fontSize: "14px" }}>
                Back to Login
              </NavLink>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="input-group">
              <label>Enter OTP</label>
              <input
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength="6"
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <div className="back-to-login" style={{ textAlign: "center", marginTop: "20px" }}>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                style={{ background: "none", border: "none", color: "#1e3c72", cursor: "pointer", fontSize: "14px", textDecoration: "underline" }}
              >
                Change Email / Resend OTP
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
