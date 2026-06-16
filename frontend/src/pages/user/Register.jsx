import React, { useState } from "react";
import "./register.css";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";


const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let error = "";
    if (name === "name" && !value.trim()) error = "Name is required";
    if (name === "email" && !/\S+@\S+\.\S+/.test(value)) error = "Enter valid email";
    if (name === "phone" && !/^[6-9]\d{9}$/.test(value)) error = "Enter valid 10 digit mobile number";
    if (name === "password" && value.length < 6) error = "Password must be at least 6 characters";
    return error;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: validateField(name, value) });
  };

  const Submit = async (e) => {
    e.preventDefault();
    let newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const res = await axios.post("http://localhost:5000/api/register", formData);
      alert(res.data.message);
      navigate("/login");
    } catch (err) {
      if (err.response) {
        alert(err.response.data.message);
      } else {
        alert("Server Not Responding");
      }
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Create Parking Account</h2>
        <form onSubmit={Submit}>
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              className={errors.name ? "input-error" : ""}
              title={errors.name || ""}
              value={formData.name}
              onChange={onChange}
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              className={errors.email ? "input-error" : ""}
              title={errors.email || ""}
              value={formData.email}
              onChange={onChange}
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              className={errors.phone ? "input-error" : ""}
              title={errors.phone || ""}
              value={formData.phone}
              onChange={onChange}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Create Password"
              className={errors.password ? "input-error" : ""}
              title={errors.password || ""}
              value={formData.password}
              onChange={onChange}
            />
          </div>

          <button type="submit" className="register-btn">Register Now</button>
            <p className="signup-text" style={{marginTop: "20px", fontSize: "14px"}}>
                    Already have an account?{" "}
                    <NavLink className="link" to="/Login" style={{color: "#1e3c72", fontWeight: "bold", textDecoration: "none"}}>
                      Login
                    </NavLink>
                  </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
