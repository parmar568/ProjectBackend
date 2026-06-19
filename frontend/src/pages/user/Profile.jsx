import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { authService, bookingService } from "../../services/api";
import "./profile.css";

const CountdownTimer = ({ endTime, bookingId, status, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        clearInterval(timerRef.current);
        onFinish(bookingId, status);
        return;
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    calculateTime();
    timerRef.current = setInterval(calculateTime, 1000);

    return () => clearInterval(timerRef.current);
  }, [endTime, bookingId, status, onFinish]);

  return (
    <div style={{ 
      background: '#1e3c72', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '8px', 
      textAlign: 'center',
      margin: '10px 0',
      fontSize: '18px',
      fontWeight: 'bold'
    }}>
      ⏱️ {timeLeft}
    </div>
  );
};

export default function Profile() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showExtendPopup, setShowExtendPopup] = useState(false);
  const [extendPopupTimer, setExtendPopupTimer] = useState(120); // 2 minutes in seconds
  const [selectedBookingForExtend, setSelectedBookingForExtend] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState("Extension"); // "Extension" or "Overtime"
  const [paymentAmount, setPaymentAmount] = useState(50);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [upiId, setUpiId] = useState("");
  const [upiError, setUpiError] = useState("");
  const [isUpiValidated, setIsUpiValidated] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const upiLink = `upi://pay?pa=milanparmar568-1@oksbi&pn=ParkingSystem&am=${paymentAmount}&cu=INR&tn=${paymentType}Payment`;
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleNumber: "",
    vehicleType: ""
  });

  const fetchUserBookingsRef = useRef(null);
  
  const fetchUserBookings = async (userId) => {
    try {
      const res = await bookingService.getUserBookings(userId);
      setBookings(res.data);
      setLoading(false);
    } catch (error) {
      console.log("Error fetching user bookings:", error);
      setLoading(false);
    }
  };
  
  fetchUserBookingsRef.current = fetchUserBookings;

  const handleTimerFinish = useCallback(async (bookingId, status) => {
    if (status === "Allocated" || status === "Extended") {
      setSelectedBookingForExtend(bookingId);
      setShowExtendPopup(true);
      setExtendPopupTimer(120); // 2 minutes
    }
    setTimeout(() => {
      if (user?._id) {
        fetchUserBookingsRef.current(user._id);
      }
    }, 2000);
  }, [user?._id]);

  // Effect for 10-minute auto-close of extend popup
  useEffect(() => {
    let timer;
    if (showExtendPopup) {
      if (extendPopupTimer > 0) {
        timer = setTimeout(() => {
          setExtendPopupTimer(prev => prev - 1);
        }, 1000);
      } else {
        setShowExtendPopup(false);
        if (user?._id) {
          fetchUserBookingsRef.current(user._id);
        }
      }
    }
    return () => clearTimeout(timer);
  }, [showExtendPopup, extendPopupTimer]);

  const handleExtend = async () => {
    // Instead of calling backend directly, show payment selection
    setPaymentType("Extension");
    setPaymentAmount(50);
    setShowExtendPopup(false);
    setShowPaymentModal(true);
    setPaymentMethod(""); // Reset payment selection
    setPaymentSuccess(false);
    setIsUpiValidated(false);
    setShowQR(false);
    setUpiId("");
    setUpiError("");
    setCountdown(60);
  };

  const handleOvertimePay = (booking) => {
    setPaymentType("Overtime");
    setPaymentAmount(booking.extraCharge);
    setSelectedBookingForExtend(booking._id);
    setShowPaymentModal(true);
    setPaymentMethod("");
    setPaymentSuccess(false);
    setIsUpiValidated(false);
    setShowQR(false);
    setUpiId("");
    setUpiError("");
    setCountdown(60);
  };

  const handleUpiValidation = async () => {
    if (!upiId.includes("@")) {
      setUpiError("Invalid UPI ID. Must contain '@'.");
      return;
    }
    setUpiError("");
    setIsProcessing(true);
    
    // Simulate validation
    setTimeout(() => {
      setIsProcessing(false);
      setIsUpiValidated(true);
      setShowQR(true);
      setCountdown(60);
    }, 1000);
  };

  const confirmPayment = async (method, status) => {
    try {
      setIsProcessing(true);

      const payload = {
        bookingId: selectedBookingForExtend,
        paymentMethod: method,
        paymentStatus: status
      };

      if (paymentType === "Extension") {
        payload.extraAmount = paymentAmount;
        const res = await bookingService.extendBooking(payload);
        if (status === "Paid") {
          setPaymentSuccess(true);
          setShowQR(false);
          setTimeout(() => {
            setShowPaymentModal(false);
            fetchUserBookings(user._id);
          }, 2000);
        } else {
          alert(res.data.message);
          setShowPaymentModal(false);
          fetchUserBookings(user._id);
        }
      } else {
        payload.extraCharge = paymentAmount;
        const res = await bookingService.payOvertime(payload);
        if (status === "Paid") {
          setPaymentSuccess(true);
          setShowQR(false);
          setTimeout(() => {
            setShowPaymentModal(false);
            fetchUserBookings(user._id);
          }, 2000);
        } else {
          alert(res.data.message);
          setShowPaymentModal(false);
          fetchUserBookings(user._id);
        }
      }
      setIsProcessing(false);
    } catch (error) {
      alert(error.response?.data?.message || "Payment failed");
      setIsProcessing(false);
    }
  };

  const handleAutoConfirm = async () => {
    try {
      await confirmPayment("Online", "Paid");
    } catch (error) {
      console.log("AUTO CONFIRM ERROR:", error);
      alert(`Payment confirmation failed: ${error.message}`);
    }
  };

  useEffect(() => {
    let timerId;
    if (showQR && countdown > 0 && !paymentSuccess) {
      timerId = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && showQR && !paymentSuccess) {
      handleAutoConfirm();
    }
    return () => clearInterval(timerId);
  }, [showQR, countdown, paymentSuccess, selectedBookingForExtend]);

  const handleCloseExtend = async () => {
    try {
      if (selectedBookingForExtend) {
        await bookingService.updateBookingStatus(selectedBookingForExtend, {
          status: "Completed"
        });
        alert("Booking completed successfully.");
        fetchUserBookings(user?._id);
      }
      setShowExtendPopup(false);
    } catch (error) {
      console.error("Error closing booking:", error);
      alert("Failed to complete booking.");
    }
  };

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("user_user");
      if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
        const userData = JSON.parse(storedUser);
        if (userData && userData._id) {
          setUser(userData);
          setEditData({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            vehicleNumber: userData.vehicleNumber || "",
            vehicleType: userData.vehicleType || ""
          });
          fetchUserBookings(userData._id);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error reading user data:", error);
      setLoading(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    let interval;
    if (user && user._id) {
      // Check for status updates every 30 seconds if there are active bookings
      const hasActive = bookings.some(b => ["Allocated", "Extended", "Overtime"].includes(b.status));
      if (hasActive) {
        interval = setInterval(() => {
          fetchUserBookings(user._id);
        }, 30000); // 30 seconds
      }
    }
    return () => clearInterval(interval);
  }, [user?._id, bookings.length]);

  const handleLogout = async () => {
    try {
      const userStr = sessionStorage.getItem("user_user");
      const role = sessionStorage.getItem("user_role");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user._id) {
          await authService.logout();
        }
      }
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
    }
    sessionStorage.removeItem("user_user");
    sessionStorage.removeItem("user_role");
    sessionStorage.removeItem("user_token");
    navigate("/login");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await authService.updateProfile(user._id, editData);
      if (res.status === 200) {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        sessionStorage.setItem("user_user", JSON.stringify(updatedUser));
        setIsEditing(false);
        alert("Profile Updated Successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const booking = bookings.find(b => b._id === bookingId);
    
    // If it's overtime, we still want them to pay or handle at counter, 
    // but for simple "Pending" payment status (like newly created but unpaid), 
    // we allow cancellation to release the slot as requested.
    if (booking && booking.status === "Overtime") {
      alert("You have an overtime charge. Please settle your payment before finishing the booking.");
      return;
    }

    if (window.confirm("Are you sure you want to cancel this booking? The slot will be released.")) {
      try {
        await bookingService.deleteLock(bookingId);
        alert("Booking cancelled successfully!");
        fetchUserBookings(user._id); // Refresh list
      } catch (error) {
        console.error("Error cancelling booking:", error);
        alert("Failed to cancel booking.");
      }
    }
  };

  const getGoogleMapsUrl = (booking) => {
    if (booking.mapUrl && (booking.mapUrl.startsWith("http://") || booking.mapUrl.startsWith("https://"))) {
      return booking.mapUrl;
    }
    const query = `${booking.area}, ${booking.city}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  if (!user) {
    return (
      <div className="profile-container" style={{ padding: "100px 20px", textAlign: "center" }}>
        <h2 style={{ color: "#1e3c72", marginBottom: "20px" }}>Please Login to View Profile</h2>
        <button 
          onClick={() => navigate("/login")}
          style={{ padding: "12px 30px", background: "#1e3c72", color: "white", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {showExtendPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', textAlign: 'center', maxWidth: '400px' }}>
            <h3>Parking Finished</h3>
            <p>Your parking time has finished. Do you want to extend by 1 hour for ₹50?</p>
            <p style={{ color: '#e53e3e', fontSize: '12px', fontWeight: 'bold', marginTop: '10px' }}>
              ⚠ Note: If you don't extend, extra charges will apply until you pick up your vehicle.
            </p>
            <div style={{ marginTop: '15px', color: '#1e3c72', fontWeight: 'bold', fontSize: '1.2rem' }}>
              Closing in {Math.floor(extendPopupTimer / 60)}:{(extendPopupTimer % 60).toString().padStart(2, '0')}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
              <button onClick={handleExtend} style={{ padding: '10px 20px', background: '#48bb78', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Extend 1 Hr</button>
              <button onClick={handleCloseExtend} style={{ padding: '10px 20px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>{paymentType} Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            {paymentSuccess ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <div style={{ color: "green", fontSize: "50px", marginBottom: "15px" }}>✓</div>
                <h2 style={{ color: "green", marginBottom: "10px" }}>Payment Successful</h2>
                <p style={{ fontSize: "14px", color: "#666" }}>{paymentType} confirmed!</p>
              </div>
            ) : !paymentMethod ? (
              <div>
                <p>Choose payment method for ₹{paymentAmount} {paymentType.toLowerCase()}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                  <button 
                    onClick={() => {
                      setPaymentMethod("QR");
                      setShowQR(true);
                      setCountdown(60);
                    }}
                    style={{ padding: '12px', background: '#1e3c72', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    QR Code
                  </button>
                  <button 
                    onClick={() => {
                      setPaymentMethod("UPI_ID");
                      setIsUpiValidated(false);
                      setShowQR(false);
                    }}
                    style={{ padding: '12px', background: '#2a5298', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    UPI ID Payment
                  </button>
                </div>
              </div>
            ) : (paymentMethod === "QR" || paymentMethod === "UPI_ID") ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: "#1e3c72" }}>
                    {paymentMethod === "QR" ? "Scan to Pay" : "UPI ID Payment"}
                  </h4>
                  <p style={{ fontSize: "20px", fontWeight: "bold", color: "#2e7d32", margin: "5px 0" }}>Amount: ₹{paymentAmount}</p>
                  
                  {paymentMethod === "QR" ? (
                    <div style={{ background: "white", padding: "15px", borderRadius: "8px", display: "inline-block", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                      <QRCodeCanvas value={upiLink} size={180} level="H" />
                    </div>
                  ) : !isUpiValidated ? (
                    <div style={{ marginTop: "10px", textAlign: "left" }}>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Enter UPI ID</label>
                      <input 
                        type="text" 
                        value={upiId} 
                        onChange={(e) => setUpiId(e.target.value)} 
                        placeholder="example@upi" 
                        style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ccc", marginBottom: "10px", boxSizing: "border-box", fontSize: "16px" }}
                      />
                      {upiError && <span style={{ color: "red", fontSize: "12px" }}>{upiError}</span>}
                      <button 
                        onClick={handleUpiValidation} 
                        disabled={isProcessing} 
                        style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "none", background: "#1e3c72", color: "white", fontWeight: "bold", cursor: "pointer" }}
                      >
                        {isProcessing ? "Processing..." : "Request Payment"}
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: "10px", padding: "10px", background: "#e8f5e9", borderRadius: "8px" }}>
                      <p style={{ color: "#2e7d32", fontWeight: "bold", margin: 0 }}>Request sent to {upiId}</p>
                      <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>Check your UPI app to complete payment.</p>
                    </div>
                  )}
                  
                  {showQR && (
                    <div style={{ marginTop: "20px", fontSize: "18px", fontWeight: "bold", color: "#d9534f" }}>
                      Auto-confirming in {countdown}s...
                    </div>
                  )}
                  
                  {(paymentMethod === "QR" || isUpiValidated) && (
                    <p style={{ fontSize: "12px", color: "#1e3c72", marginTop: "10px", fontWeight: "600" }}>milanparmar568-1@oksbi</p>
                  )}
                </div>

                {(paymentMethod === "QR" || isUpiValidated) && (
                  !paymentSuccess && (
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: "13px", color: "#666", marginBottom: "15px" }}>
                        {paymentMethod === "QR" ? "Scan with any UPI app to pay." : "Complete payment in your UPI app."}
                      </p>
                      <button 
                        onClick={() => {
                          setIsProcessing(true);
                          setTimeout(() => {
                            setIsProcessing(false);
                            setPaymentSuccess(true);
                            setShowQR(false);
                            setTimeout(() => {
                              handleAutoConfirm();
                            }, 1500);
                          }, 1500);
                        }}
                        className="booking-btn"
                        style={{ width: "100%", background: "#2e7d32", border: 'none', padding: '12px', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Verifying..." : "I have paid"}
                      </button>
                    </div>
                  )
                )}
                
                {!isUpiValidated && paymentMethod === "UPI_ID" && (
                  <button 
                    onClick={() => setPaymentMethod("")} 
                    style={{ marginTop: '15px', background: 'none', border: 'none', color: '#1e3c72', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Back to options
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-img">
            <img 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundColor=1e3c72,2a5298&fontSize=40`} 
              alt="User Initials" 
              className="user-avatar-img"
            />
          </div>
          <div className="profile-info-top">
            <h2>{user.name}</h2>
            <div className="profile-actions">
              <button onClick={() => setIsEditing(!isEditing)} className="edit-profile-btn">
                <i className={`bi ${isEditing ? 'bi-x-circle' : 'bi-pencil-square'}`}></i> {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
              <button onClick={handleLogout} className="logout-profile-btn">
                <i className="bi bi-box-arrow-right"></i> Logout
              </button>
            </div>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="profile-edit-form">
            <div className="form-group">
              <label>Name:</label>
              <input 
                type="text" 
                value={editData.name} 
                onChange={(e) => setEditData({...editData, name: e.target.value})}
                required 
              />
            </div>
            <div className="form-group">
              <label>Email Address:</label>
              <input 
                type="email" 
                value={editData.email} 
                onChange={(e) => setEditData({...editData, email: e.target.value})}
                required 
              />
            </div>
            <div className="form-group">
              <label>Phone Number:</label>
              <input 
                type="text" 
                value={editData.phone} 
                onChange={(e) => setEditData({...editData, phone: e.target.value})}
                required 
              />
            </div>
            <div className="form-group">
              <label>Vehicle Number:</label>
              <input 
                type="text" 
                value={editData.vehicleNumber} 
                onChange={(e) => setEditData({...editData, vehicleNumber: e.target.value})}
                required 
              />
            </div>
            <div className="form-group">
              <label>Vehicle Type:</label>
              <select
                value={editData.vehicleType}
                onChange={(e) => setEditData({...editData, vehicleType: e.target.value})}
                required
              >
                <option value="Two Wheeler">Two Wheeler</option>
                <option value="Four Wheeler">Four Wheeler</option>
              </select>
            </div>
            <button type="submit" className="save-profile-btn">
              <i className="bi bi-check-circle"></i> Save Profile Changes
            </button>
          </form>
        ) : (
          <div className="profile-details">
            <div className="detail-item">
              <span className="label"><i className="bi bi-envelope-fill"></i> Email Address:</span>
              <span className="value">{user.email}</span>
            </div>
            <div className="detail-item">
              <span className="label"><i className="bi bi-telephone-fill"></i> Phone Number:</span>
              <span className="value">{user.phone}</span>
            </div>
            <div className="detail-item">
              <span className="label"><i className="bi bi-car-front-fill"></i> Vehicle Number:</span>
              <span className="value">{user.vehicleNumber}</span>
            </div>
            <div className="detail-item">
              <span className="label"><i className="bi bi-gear-wide-connected"></i> Vehicle Type:</span>
              <span className="value">{user.vehicleType}</span>
            </div>
          </div>
        )}
      </div>

      <div className="user-bookings-section">
        <h3>My Parking Bookings</h3>
        {loading ? (
          <p>Loading bookings...</p>
        ) : bookings.length > 0 ? (
          <div className="bookings-grid">
            {bookings.map((booking) => (
              <div key={booking._id} className="booking-card-mini">
                <div className="booking-card-header">
                  <span className={`status-dot ${booking.status?.toLowerCase()}`}></span>
                  <span className="booking-status">{booking.status}</span>
                </div>
                <div className="booking-card-body">
                  <p><strong>Location:</strong> {booking.city}, {booking.area}</p>
                  <p><strong>Vehicle:</strong> {booking.vehicleNumber} ({booking.vehicleType || "N/A"})</p>
                  <p>
                    <strong>Total Payment:</strong> ₹{booking.amount + (booking.extraCharge || 0)}
                    {(booking.extensionAmount > 0 || (booking.extraCharge && booking.extraCharge > 0)) && (
                      <span style={{ fontSize: '11px', color: '#666', marginLeft: '5px' }}>
                        (Base: ₹{booking.amount - (booking.extensionAmount || 0)} 
                        {booking.extensionAmount > 0 && ` + Ext: ₹${booking.extensionAmount}`}
                        {booking.extraCharge > 0 && ` + ${booking.status === 'Completed' ? 'Extra' : 'Overtime'}: ₹${booking.extraCharge}`})
                      </span>
                    )}
                  </p>
                  {(booking.status === "Allocated" || booking.status === "Extended") && (
                    <CountdownTimer 
                      endTime={booking.endTime} 
                      bookingId={booking._id} 
                      status={booking.status}
                      onFinish={handleTimerFinish} 
                    />
                  )}
                  <p><strong>Start:</strong> {new Date(booking.startTime).toLocaleString()}</p>
                  <p><strong>End:</strong> {new Date(booking.endTime).toLocaleString()}</p>
                  <p>
                    <strong>Payment:</strong> 
                    <span style={{ 
                      color: booking.paymentStatus === 'Paid' ? 'green' : (booking.paymentStatus === 'Failed' ? 'red' : 'orange'),
                      fontWeight: 'bold',
                      marginLeft: '5px'
                    }}>
                      {booking.paymentStatus || "Pending"}
                    </span>
                    {booking.paymentStatus === "Paid" && booking.paymentToken && (
                      <span style={{ fontSize: '11px', color: '#1e3c72', marginLeft: '10px', background: '#eef2f7', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
{/*                           {booking.paymentToken} */}
                      </span>
                    )}
                    {(booking.status === "Overtime" || (booking.status === "Completed" && (booking.extraCharge || 0) > 0)) && booking.paymentStatus !== "Paid" && (
                      <span style={{ fontSize: '11px', color: '#e53e3e', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                        ⚠ PAYMENT PENDING (₹{booking.extraCharge})
                      </span>
                    )}
                    {(booking.status === "Overtime" || (booking.status === "Completed" && (booking.extraCharge || 0) > 0)) && booking.paymentStatus === "Paid" && (
                      <span style={{ fontSize: '11px', color: '#48bb78', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                        ✓ PAYMENT SUCCESS (₹{booking.extraCharge})
                      </span>
                    )}
                    {booking.paymentStatus === "Pending" && booking.paymentMethod === "Cash" && booking.status !== "Overtime" && (
                      <span style={{ fontSize: '11px', color: '#666', marginLeft: '5px' }}>
                        (Cash Payment)
                      </span>
                    )}
                  </p>
                  {(booking.status === "Allocated" || booking.status === "Extended") && (
                    <div className="allocation-info">
                      <a 
                        href={getGoogleMapsUrl(booking)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="map-link-btn"
                      >
                        <i className="bi bi-map-fill"></i> View on Google Maps
                      </a>
                    </div>
                  )}
                  <div className="booking-card-footer" style={{marginTop: "15px"}}>
                    {["Allocated", "Extended", "Pending", "pending"].includes(booking.status) && (
                      <button 
                        className="cancel-booking-btn" 
                        onClick={() => handleCancelBooking(booking._id)}
                        style={{background: "#e74c3c", color: "white", border: "none", padding: "8px 15px", borderRadius: "6px", cursor: "pointer", fontSize: "13px"}}
                      >
                        Cancel Booking
                      </button>
                    )}
                    {booking.status === "Overtime" && booking.paymentStatus !== "Paid" && (
                      <button 
                        className="pay-overtime-btn" 
                        onClick={() => handleOvertimePay(booking)}
                        style={{background: "#1e3c72", color: "white", border: "none", padding: "8px 15px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold"}}
                      >
                        Pay Overtime Charge (₹{booking.extraCharge})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-bookings">No bookings found yet.</p>
        )}
      </div>
    </div>
  );
};
