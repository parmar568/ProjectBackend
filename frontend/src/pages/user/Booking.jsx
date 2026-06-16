import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { FaTimes, FaCheckCircle, FaSpinner, FaArrowLeft, FaCreditCard, FaWallet, FaQrcode } from "react-icons/fa";
import { paymentService } from "../../services/api";
import "./Booking.css";

const Booking = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [errors, setErrors] = useState({});
  const [selectedAreaDetails, setSelectedAreaDetails] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("UPI");

  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCustomEndTime, setShowCustomEndTime] = useState(false);
  const [paymentStep, setPaymentStep] = useState("METHOD_SELECTION");
  const [bookingResult, setBookingResult] = useState(null);
  const [upiQrUrl, setUpiQrUrl] = useState("");
  const [createdBookingId, setCreatedBookingId] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const UPI_ID = "milanparmar568-1@oksbi";
  const UPI_NAME = "ParkingSystem";

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [formData, setFormData] = useState({
    city: "",
    area: "",
    price: "",
    paymentMethod: "UPI",
    date: "",
    startTime: "",
    endTime: "",
    slotNumber: "",
    vehicleNumber: "",
    vehicleType: ""
  });

  const [availability, setAvailability] = useState({
    totalSlots: 0,
    bookedSlots: [],
    pendingSlots: [],
    loading: false
  });

  const fetchAvailability = async () => {
    if (!selectedAreaDetails?._id || !formData.date || !formData.startTime || !formData.endTime) return;
    try {
      setAvailability(prev => ({ ...prev, loading: true }));
      const res = await axios.post("http://localhost:5000/api/bookings/check-availability", {
        locationId: selectedAreaDetails._id,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime
      });
      setAvailability({
        totalSlots: res.data.totalSlots || selectedAreaDetails.totalSlots,
        bookedSlots: res.data.bookedSlots || [],
        pendingSlots: res.data.pendingSlots || [],
        loading: false
      });
      if (formData.slotNumber && res.data.bookedSlots.includes(formData.slotNumber)) {
        setFormData(prev => ({ ...prev, slotNumber: "" }));
      }
    } catch (error) {
      console.log("AVAILABILITY ERROR:", error);
      setAvailability(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchAvailability();
    const interval = setInterval(fetchAvailability, 10000);
    return () => clearInterval(interval);
  }, [selectedAreaDetails, formData.date, formData.startTime, formData.endTime]);

  useEffect(() => {
    if (formData.startTime && selectedAreaDetails) {
      const rate = Number(selectedAreaDetails.price);
      const dynamicPrice = calculateDynamicPrice(formData.startTime, formData.endTime, rate);
      setFormData(prev => {
        if (prev.price === dynamicPrice) return prev;
        return { ...prev, price: dynamicPrice };
      });
    } else {
      setFormData(prev => {
        if (prev.price === "") return prev;
        return { ...prev, price: "" };
      });
    }
  }, [formData.startTime, formData.endTime, selectedAreaDetails]);

  useEffect(() => {
    if (location.state) {
      const { city, date, startTime, endTime, vehicleNumber, vehicleType, preSelectedArea } = location.state;
      if (city && date) {
        let updatedEndTime = endTime || "";
        if (startTime && !endTime) {
          const [hours, minutes] = startTime.split(":").map(Number);
          const endHours = (hours + 1) % 24;
          const formattedEndHours = endHours.toString().padStart(2, "0");
          const formattedMinutes = minutes.toString().padStart(2, "0");
          updatedEndTime = `${formattedEndHours}:${formattedMinutes}`;
        }
        setFormData(prev => ({
          ...prev,
          city,
          date,
          startTime: startTime || "",
          endTime: updatedEndTime,
          vehicleNumber: vehicleNumber || "",
          vehicleType: vehicleType || ""
        }));
        fetchAreasAndSelect(city, preSelectedArea);
      }
    }
  }, [location.state]);

  const fetchAreasAndSelect = async (city, preSelectedArea) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/location/areas/${city}`);
      setAreas(res.data);
      if (preSelectedArea) {
        const areaObj = res.data.find(a => a.area === preSelectedArea);
        if (areaObj) {
          setFormData(prev => ({
            ...prev,
            area: areaObj.area,
            price: areaObj.price
          }));
          setSelectedAreaDetails(areaObj);
        }
      }
    } catch (error) {
      console.log("AREA ERROR:", error);
    }
  };

  useEffect(() => {
    const userStr = sessionStorage.getItem("user_user");
    if (!userStr) {
      alert("Please login first");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/location/cities");
        setCities(res.data);
      } catch (error) {
        console.log("CITY ERROR:", error);
      }
    };
    fetchCities();
  }, []);

  const formatTimeAMPM = (time24) => {
    if (!time24) return "";
    let [hours, minutes] = time24.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  const handleCityChange = async (e) => {
    const city = e.target.value;
    setFormData({ ...formData, city: city, area: "", price: "", slotNumber: "" });
    try {
      const res = await axios.get(`http://localhost:5000/api/location/areas/${city}`);
      setAreas(res.data);
    } catch (error) {
      console.log("AREA ERROR:", error);
    }
  };

  const handleAreaChange = (e) => {
    const area = e.target.value;
    const selectedArea = areas.find((a) => a.area === area);
    if (!selectedArea) {
      setSelectedAreaDetails(null);
      return;
    }
    setSelectedAreaDetails(selectedArea);
    setFormData({ ...formData, area: area, slotNumber: "" });
  };

  const calculateDynamicPrice = (startTime, endTime, hourlyRate) => {
    const rate = Number(hourlyRate);
    if (!startTime || isNaN(rate) || rate === 0) return 0;
    let endT = endTime;
    if (!endT) {
      const [hours, minutes] = startTime.split(":").map(Number);
      const endHours = (hours + 1) % 24;
      const formattedEndHours = endHours.toString().padStart(2, "0");
      const formattedMinutes = minutes.toString().padStart(2, "0");
      endT = `${formattedEndHours}:${formattedMinutes}`;
    }
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endT.split(":").map(Number);
    let startTotalMinutes = (startH * 60) + startM;
    let endTotalMinutes = (endH * 60) + endM;
    let diffInMinutes = endTotalMinutes - startTotalMinutes;
    if (diffInMinutes <= 0) {
      diffInMinutes += 24 * 60;
    }
    const diffInHours = diffInMinutes / 60;
    return Math.ceil(diffInHours * rate);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      slotNumber: (name === "date" || name === "startTime" || name === "endTime") ? "" : prev.slotNumber
    }));
  };

  const validate = () => {
    let newErrors = {};
    if (!formData.city) newErrors.city = "Select city";
    if (!formData.area) newErrors.area = "Select area";
    if (!formData.vehicleNumber) newErrors.vehicleNumber = "Vehicle number required";
    if (!formData.vehicleType) newErrors.vehicleType = "Vehicle type required";
    if (!formData.date) newErrors.date = "Select date";
    if (!formData.startTime) newErrors.startTime = "Start time required";
    if (showCustomEndTime && formData.endTime && formData.startTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = "Invalid duration";
    }
    if (!formData.slotNumber) {
      newErrors.slotNumber = "Select a slot from grid";
    } else if (availability.bookedSlots.includes(formData.slotNumber)) {
      newErrors.slotNumber = "This slot is no longer available. Please select another.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      alert("Please fill all required fields and select an available slot.");
      return;
    }
    try {
      setIsProcessing(true);
      const userStr = sessionStorage.getItem("user_user");
      if (!userStr) {
        alert("Please login to book a slot");
        navigate("/login");
        return;
      }
      const user = JSON.parse(userStr);

      if (createdBookingId) {
        try {
          await axios.delete(`http://localhost:5000/api/bookings/delete/${createdBookingId}`);
        } catch (e) {
          console.log("Old lock already gone or failed to delete");
        }
      }

      const start = new Date(`${formData.date}T${formData.startTime}`);
      let finalEndTime = formData.endTime;
      if (!finalEndTime) {
        const [hours, minutes] = formData.startTime.split(":").map(Number);
        const endHours = (hours + 1) % 24;
        finalEndTime = `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      }
      const end = new Date(`${formData.date}T${finalEndTime}`);
      const finalAmount = formData.price || calculateDynamicPrice(formData.startTime, formData.endTime, selectedAreaDetails.price);
      const lockData = {
        userId: user._id,
        vehicleNumber: formData.vehicleNumber || user.vehicleNumber,
        vehicleType: formData.vehicleType || user.vehicleType,
        city: formData.city,
        area: formData.area,
        parkingRate: selectedAreaDetails.price,
        paymentMethod: selectedPaymentMethod,
        date: formData.date,
        startTime: start,
        endTime: end,
        slotNumber: formData.slotNumber,
        locationId: selectedAreaDetails._id,
        amount: finalAmount,
        status: "Pending"
      };

      if (!finalAmount || finalAmount <= 0) {
        alert("Error calculating price. Please re-select your area or time.");
        setIsProcessing(false);
        return;
      }

      const res = await axios.post("http://localhost:5000/api/bookings/add", lockData);
      setCreatedBookingId(res.data.bookingId);
      setIsProcessing(false);
      setPaymentStep("METHOD_SELECTION");
      setShowModal(true);
    } catch (error) {
      console.error("LOCK ERROR:", error);
      alert(error.response?.data?.message || "Failed to lock slot. It might have been taken.");
      setIsProcessing(false);
      fetchAvailability();
    }
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    if (method === "UPI") {
      setPaymentStep("UPI_APP_SELECTION");
    } else if (method === "PayPal") {
      setPaymentStep("PAYPAL_PAYMENT");
    }
  };

  const createOrder = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setPaymentStep("VERIFYING");

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const userStr = sessionStorage.getItem("user_user");
      if (!userStr) {
        navigate("/login");
        return;
      }
      await axios.post("http://localhost:5000/api/bookings/auto-confirm-payment", {
        bookingId: createdBookingId,
        paymentApp: selectedApp || "UPI",
        transactionId: `${selectedApp || "UPI"}-${Date.now()}`
      });
      const user = JSON.parse(userStr);
      user.vehicleNumber = formData.vehicleNumber;
      user.vehicleType = formData.vehicleType;
      sessionStorage.setItem("user_user", JSON.stringify(user));
      setPaymentStep("SUCCESS");
      setTimeout(() => {
        setShowModal(false);
        navigate("/profile");
      }, 2000);
    } catch (err) {
      alert(err.message || "Booking failed");
      setPaymentStep("QR_PAYMENT");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAppSelection = (app) => {
    setSelectedApp(app);
    const finalAmount = formData.price;
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${finalAmount}&cu=INR&tr=${Math.random().toString(36).substring(7)}`;
    
    setUpiQrUrl(upiUrl);
    
    if (isMobile) {
      let deepLink = upiUrl;
      if (app === "GPay") {
        deepLink = `gpay://upi/pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${finalAmount}&cu=INR`;
      } else if (app === "PhonePe") {
        deepLink = `phonepe://upi/pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${finalAmount}&cu=INR`;
      } else if (app === "Paytm") {
        deepLink = `paytmmp://upi/pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${finalAmount}&cu=INR`;
      } else if (app === "BHIM") {
        deepLink = `bhim://upi/pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${finalAmount}&cu=INR`;
      }
      
      try {
        window.location.href = deepLink;
      } catch (e) {
        console.log("Deep link failed, falling back to generic UPI");
        window.location.href = upiUrl;
      }
      
      // Show QR payment screen as fallback
      setTimeout(() => {
        setPaymentStep("QR_PAYMENT");
      }, 1500);
    } else {
      setPaymentStep("QR_PAYMENT");
    }
  };

  const handleCloseModal = async () => {
    if (createdBookingId && paymentStep !== "SUCCESS") {
      try {
        await axios.delete(`http://localhost:5000/api/bookings/delete/${createdBookingId}`);
        setCreatedBookingId(null);
        fetchAvailability();
      } catch (error) {
        console.error("Error releasing lock on modal close:", error);
      }
    }
    setShowModal(false);
    setPaymentStep("METHOD_SELECTION");
    setPaymentSuccess(false);
    setSelectedApp(null);
  };

  const getPayPalClientId = () => {
    return process.env.REACT_APP_PAYPAL_CLIENT_ID || "test";
  };

  const handlePayPalCreateOrder = async (data, actions) => {
    try {
      const orderData = {
        amount: formData.price,
        bookingDetails: formData
      };
      const response = await paymentService.createPayPalOrder(orderData);
      return response.data.id;
    } catch (error) {
      console.error("PayPal order creation error:", error);
      alert("Failed to create PayPal order");
    }
  };

  const handlePayPalApprove = async (data, actions) => {
    try {
      setPaymentStep("VERIFYING");
      const response = await paymentService.capturePayPalOrder({ orderId: data.orderID });
      if (response.data.success) {
        const userStr = sessionStorage.getItem("user_user");
        if (!userStr) {
          navigate("/login");
          return;
        }
        await axios.post("http://localhost:5000/api/bookings/auto-confirm-payment", {
          bookingId: createdBookingId,
          paymentApp: "PayPal",
          transactionId: data.orderID
        });
        const user = JSON.parse(userStr);
        user.vehicleNumber = formData.vehicleNumber;
        user.vehicleType = formData.vehicleType;
        sessionStorage.setItem("user_user", JSON.stringify(user));
        setPaymentStep("SUCCESS");
        setTimeout(() => {
          setShowModal(false);
          navigate("/profile");
        }, 2000);
      }
    } catch (error) {
      console.error("PayPal capture error:", error);
      alert("Payment failed. Please try again.");
      setPaymentStep("PAYPAL_PAYMENT");
    }
  };

  return (
    <div className="booking-page">
      <div className="booking-container">
        <div className="booking-card">
          <h2>Parking Slot Booking</h2>
          {location.state?.preSelectedArea && (
            <div className="booking-pre-summary">
              <div className="summary-item">
                <span className="summary-label">City:</span>
                <span className="summary-value">{formData.city}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Area:</span>
                <span className="summary-value">{formData.area}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Date:</span>
                <span className="summary-value">{new Date(formData.date).toLocaleDateString()}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Time:</span>
                <span className="summary-value">{formatTimeAMPM(formData.startTime)} to {formatTimeAMPM(formData.endTime)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Vehicle:</span>
                <span className="summary-value">{formData.vehicleNumber} ({formData.vehicleType})</span>
              </div>
              <button
                className="change-selection-btn"
                onClick={() => navigate("/", {
                  state: {
                    preSelectedCity: formData.city,
                    preSelectedDate: formData.date,
                    preSelectedStartTime: formData.startTime,
                    preSelectedEndTime: formData.endTime,
                    preSelectedVehicleNumber: formData.vehicleNumber,
                    preSelectedVehicleType: formData.vehicleType
                  }
                })}
              >
                Change Selection
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!location.state?.preSelectedArea && (
              <>
                <select name="city" value={formData.city} onChange={handleCityChange}>
                  <option value="">Select City</option>
                  {cities.map((c, index) => (
                    <option key={index} value={c}>{c}</option>
                  ))}
                </select>
                {errors.city && <span className="error">{errors.city}</span>}

                <select name="area" value={formData.area} onChange={handleAreaChange}>
                  <option value="">Select Area</option>
                  {areas.map((a) => (
                    <option key={a._id} value={a.area}>{a.area}</option>
                  ))}
                </select>
                {errors.area && <span className="error">{errors.area}</span>}

                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                />
                {errors.date && <span className="error">{errors.date}</span>}

                <div className="time-selection">
                  <div className="vehicle-details-grid">
                    <div>
                      <label>Vehicle Number</label>
                      <input
                        type="text"
                        name="vehicleNumber"
                        value={formData.vehicleNumber}
                        onChange={handleChange}
                        placeholder="GJ01AB1234"
                        style={{ textTransform: "uppercase" }}
                      />
                      {errors.vehicleNumber && <span className="error">{errors.vehicleNumber}</span>}
                    </div>
                    <div>
                      <label>Vehicle Type</label>
                      <select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleChange}
                      >
                        <option value="">Select Type</option>
                        <option value="Two Wheeler">Two Wheeler</option>
                        <option value="Four Wheeler">Four Wheeler</option>
                      </select>
                      {errors.vehicleType && <span className="error">{errors.vehicleType}</span>}
                    </div>
                  </div>

                  <div className="time-input-group">
                    <label>Start Time</label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      className="time-input"
                    />
                    {errors.startTime && <span className="error">{errors.startTime}</span>}
                  </div>

                  {formData.startTime && !showCustomEndTime && (
                    <div className="duration-indicator">
                      <span>Duration: 1 Hour (Ends at {(() => {
                        const [h, m] = formData.startTime.split(":").map(Number);
                        const endH = (h + 1) % 24;
                        return formatTimeAMPM(`${endH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
                      })()})</span>
                      <button
                        type="button"
                        onClick={() => setShowCustomEndTime(true)}
                      >
                        Change End Time
                      </button>
                    </div>
                  )}

                  {showCustomEndTime && (
                    <div className="time-input-group">
                      <div className="time-input-header">
                        <label>End Time (Optional)</label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomEndTime(false);
                            setFormData(prev => ({ ...prev, endTime: "" }));
                          }}
                          className="reset-btn"
                        >
                          Reset to 1 Hour
                        </button>
                      </div>
                      <input
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        className="time-input"
                      />
                      {errors.endTime && <span className="error">{errors.endTime}</span>}
                    </div>
                  )}
                </div>
              </>
            )}

            {selectedAreaDetails && (
              <div className="slot-grid-container">
                <label>Select Parking Slot {availability.loading && <span className="loading-text">(Updating availability...)</span>}</label>
                <div className="slot-legend">
                  <div className="legend-item">
                    <div className="legend-color available"></div>
                    <span>Available</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color booked"></div>
                    <span>Booked</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color locked"></div>
                    <span>Locked</span>
                  </div>
                </div>
                <div className="slot-grid">
                  {Array.from({ length: availability.totalSlots || selectedAreaDetails.totalSlots }, (_, i) => i + 1).map(num => {
                    const isBooked = availability.bookedSlots.includes(num);
                    const isPending = availability.pendingSlots.includes(num);
                    const isSelected = formData.slotNumber === num;
                    return (
                      <div
                        key={num}
                        className={`slot ${isSelected ? "selected" : ""} ${isBooked ? "booked" : ""} ${isPending ? "locked" : ""}`}
                        onClick={() => {
                          if (isBooked || isPending) {
                            alert(isPending ? "This slot is temporarily locked for payment. Please wait 2 minutes." : "This slot is already booked for the selected time.");
                            return;
                          }
                          setFormData({ ...formData, slotNumber: num });
                        }}
                      >
                        <span className="slot-label">SLOT</span>
                        {num}
                      </div>
                    );
                  })}
                </div>
                {errors.slotNumber && <span className="error">{errors.slotNumber}</span>}
              </div>
            )}

            <div className="price-display">
              <label>Total Price</label>
              <div className="price-value">
                {formData.price ? `₹${formData.price}` : "Select time to calculate"}
              </div>
              {selectedAreaDetails && (
                <small>(Hourly Rate: ₹{selectedAreaDetails.price}/hr)</small>
              )}
            </div>

            <button type="submit" className="booking-btn" disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Continue to Confirm"}
            </button>
          </form>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Complete Payment</h3>
              <button onClick={handleCloseModal} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="booking-summary">
                <div className="summary-row">
                  <span>Slot</span>
                  <span>{formData.slotNumber}</span>
                </div>
                <div className="summary-row">
                  <span>Area</span>
                  <span>{formData.area}</span>
                </div>
                <div className="summary-row">
                  <span>Vehicle</span>
                  <span>{formData.vehicleNumber}</span>
                </div>
                <div className="summary-row">
                  <span>Time</span>
                  <span>{formatTimeAMPM(formData.startTime)} - {formatTimeAMPM(formData.endTime)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount</span>
                  <span>₹{formData.price}</span>
                </div>
              </div>

              {paymentStep === "METHOD_SELECTION" && (
                <div className="payment-method-selection">
                  <p>Choose your payment method</p>
                  <div className="payment-methods-grid">
                    <button
                      className="payment-method-card"
                      onClick={() => setPaymentStep("UPI_APPS")}
                    >
                      <FaWallet className="method-icon" />
                      <span>UPI Apps</span>
                    </button>
                    <button
                      className="payment-method-card"
                      onClick={() => {
                        const finalAmount = formData.price;
                        const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${finalAmount}&cu=INR&tr=${Math.random().toString(36).substring(7)}`;
                        setUpiQrUrl(upiUrl);
                        setPaymentStep("QR_PAYMENT");
                      }}
                    >
                      <FaQrcode className="method-icon" />
                      <span>Scan QR</span>
                    </button>
                    <button
                      className="payment-method-card"
                      onClick={() => handlePaymentMethodSelect("PayPal")}
                    >
                      <FaCreditCard className="method-icon" />
                      <span>PayPal</span>
                    </button>
                  </div>
                </div>
              )}

              {paymentStep === "UPI_APPS" && (
                <div className="upi-app-selection">
                  <button
                    onClick={() => setPaymentStep("METHOD_SELECTION")}
                    className="back-btn"
                  >
                    <FaArrowLeft /> Back
                  </button>
                  <p>Select your UPI app</p>
                  <div className="upi-apps-grid">
                    {[
                      { id: "GPay", name: "Google Pay", color: "#4285F4" },
                      { id: "PhonePe", name: "PhonePe", color: "#5f259f" },
                      { id: "Paytm", name: "Paytm", color: "#00baf2" },
                      { id: "BHIM", name: "BHIM UPI", color: "#FF6B35" }
                    ].map(app => (
                      <button
                        key={app.id}
                        className="upi-app-card"
                        onClick={() => handleAppSelection(app.id)}
                      >
                        <div 
                          className="app-icon" 
                          style={{ 
                            backgroundColor: `${app.color}20`, 
                            color: app.color 
                          }}
                        >
                          {app.name.charAt(0)}
                        </div>
                        <span>{app.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {paymentStep === "QR_PAYMENT" && (
                <div className="qr-payment-section">
                  <button
                    onClick={() => setPaymentStep("METHOD_SELECTION")}
                    className="back-btn"
                  >
                    <FaArrowLeft /> Back
                  </button>
                  <p>Scan QR to pay</p>
                  <div className="qr-container">
                    <QRCodeCanvas value={upiQrUrl} size={220} />
                  </div>
                  <button
                    onClick={createOrder}
                    disabled={isProcessing}
                    className="confirm-btn"
                  >
                    <FaCheckCircle /> I've Paid, Confirm Booking
                  </button>
                </div>
              )}

              {paymentStep === "PAYPAL_PAYMENT" && (
                <div className="paypal-section">
                  <button
                    onClick={() => setPaymentStep("METHOD_SELECTION")}
                    className="back-btn"
                  >
                    <FaArrowLeft /> Back
                  </button>
                  <PayPalScriptProvider options={{ clientId: getPayPalClientId(), currency: "INR" }}>
                    <PayPalButtons
                      style={{ layout: "vertical" }}
                      createOrder={handlePayPalCreateOrder}
                      onApprove={handlePayPalApprove}
                      onError={(err) => {
                        console.error("PayPal error:", err);
                        alert("PayPal error occurred. Please try again.");
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
              )}

              {paymentStep === "VERIFYING" && (
                <div className="verifying-section">
                  <FaSpinner className="spinner" />
                  <p>VERIFYING PAYMENT...</p>
                  <p>Please wait while we confirm your payment</p>
                </div>
              )}

              {paymentStep === "SUCCESS" && (
                <div className="success-section">
                  <FaCheckCircle className="success-icon" />
                  <h3>SUCCESS!</h3>
                  <p>Redirecting to your bookings...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;
