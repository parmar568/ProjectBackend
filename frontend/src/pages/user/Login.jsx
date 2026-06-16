import React, { useState, useEffect } from "react";
import "./login.css";
import { NavLink, useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  useEffect(() => {
    // Check if both are already logged in
    const adminToken = sessionStorage.getItem("admin_token");
    const userToken = sessionStorage.getItem("user_token");

    if (adminToken && userToken) {
      // If both are logged in, no need to be on login page
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = { email: "", password: "" };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    if (newErrors.email || newErrors.password) return;

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        if (!data.user) {
          alert("User data missing from response");
          return;
        }

        // Use role-based prefixes to isolate admin and user sessions in same browser tab
        const prefix = data.role === "admin" ? "admin_" : "user_";
        
        sessionStorage.setItem(prefix + "user", JSON.stringify(data.user));
        sessionStorage.setItem(prefix + "role", data.role || "user");
        sessionStorage.setItem(prefix + "token", data.token);

        if (data.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }

      } else {
        alert(data.message);
      }

    } catch (error) {
      alert("Server error");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to continue</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <span className="error-text" style={{color: "red", fontSize: "12px"}}>{errors.email}</span>
            )}
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <span className="error-text" style={{color: "red", fontSize: "12px"}}>{errors.password}</span>
            )}
          </div>

          <div className="forgot-password-link" style={{ textAlign: "right", marginBottom: "20px" }}>
            <NavLink to="/forgot-password" style={{ color: "#1e3c72", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>
              Forgot Password?
            </NavLink>
          </div>

          <button type="submit" className="login-btn">Login</button>
        </form>

        <p className="signup-text" style={{marginTop: "20px", fontSize: "14px"}}>
          Don't have an account?{" "}
          <NavLink className="link" to="/register" style={{color: "#1e3c72", fontWeight: "bold", textDecoration: "none"}}>
            Sign Up
          </NavLink>
        </p>
      </div>
    </div>
  );
};

export default Login;
