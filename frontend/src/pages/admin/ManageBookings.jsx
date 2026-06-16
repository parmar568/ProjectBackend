import React, { useState, useEffect } from "react";
//import axios from "axios";
import API from "../../services/api";
import { useOutletContext } from "react-router-dom";
import { 
  MdCheckCircle, 
  MdDelete, 
  MdWarning, 
  MdAccessTime, 
  MdLocationOn,
  MdDirectionsCar
} from "react-icons/md";
import "./ManageLocation.css"; 

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [allocationData, setAllocationData] = useState({ id: null, distance: "", mapUrl: "" });
  const { searchTerm } = useOutletContext();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await API.get("/bookings/admin/bookings");
      setBookings(res.data);
    } catch (error) {
      console.log("Error fetching bookings:", error);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.userId?.name?.toLowerCase().includes(searchLower) ||
      booking.userId?.email?.toLowerCase().includes(searchLower) ||
      booking.vehicleNumber?.toLowerCase().includes(searchLower) ||
      booking.userId?.vehicleNumber?.toLowerCase().includes(searchLower) ||
      booking.city?.toLowerCase().includes(searchLower) ||
      booking.area?.toLowerCase().includes(searchLower) ||
      booking.status?.toLowerCase().includes(searchLower)
    );
  });

  const handleAction = async (id, status, distance = "TBD", mapUrl = "") => {
    try {
      const booking = bookings.find(b => b._id === id);
      let extraCharge = 0;
      let updatePayment = false;
      
      if (status === "Completed") {
        // 1. Check for Pending Payment (Cash or Overtime)
        // If paymentStatus is already 'Paid', we don't need to confirm cash payment
        if (booking.paymentStatus !== "Paid") {
          const totalAmount = (booking.amount || 0);
          const currentOvertimeCharge = booking.extraCharge || 0;
          
          // Re-calculate live overtime if still active/overtime
          let extraChargeNow = currentOvertimeCharge;
          if (booking.status === "Overtime" || booking.status === "Allocated" || booking.status === "Extended") {
            const now = new Date();
            const endDateTime = new Date(booking.endTime);
            if (now > endDateTime) {
              const diffMs = now - endDateTime;
              const diffHrs = Math.ceil(diffMs / (1000 * 60 * 60));
              extraChargeNow = diffHrs * (booking.parkingRate || 50);
            }
          }

          const totalToCollect = totalAmount + extraChargeNow;
          
          if (window.confirm(`Total payment to collect: ₹${totalToCollect}\n(Initial: ₹${totalAmount} + Extra: ₹${extraChargeNow})\n\nHas the user paid the full amount in cash?`)) {
            updatePayment = true;
            extraCharge = extraChargeNow;
          } else {
            return; // Don't complete if payment not confirmed
          }
        } else {
          // If already paid, just ensure we use the existing extraCharge
          extraCharge = booking.extraCharge || 0;
        }
      }

      // If payment was confirmed during completion, update it first or alongside status
      if (updatePayment) {
        await API.put(`/bookings/update-payment/${id}`, { paymentStatus: "Paid" });
      }

      await API.put(`/bookings/update-status/${id}`, { 
        status, 
        distance, 
        mapUrl,
        extraCharge 
      });
      
      alert(`Booking ${status}${extraCharge > 0 ? `. Extra charge of ₹${extraCharge} applied.` : ""}${updatePayment ? " and Payment marked as Paid." : ""}`);
      setAllocationData({ id: null, distance: "", mapUrl: "" });
      fetchBookings();
    } catch (error) {
      console.log("Error updating booking status:", error);
    }
  };

  const getGoogleMapsUrl = (booking) => {
    if (booking.mapUrl && (booking.mapUrl.startsWith("http://") || booking.mapUrl.startsWith("https://"))) {
      return booking.mapUrl;
    }
    const query = `${booking.area}, ${booking.city}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const deleteBooking = async (id) => {
    if (!id) {
      alert("Invalid Booking ID");
      return;
    }
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        const res = await API.delete(`/bookings/delete/${id}`);
        if (res.status === 200) {
          alert("Booking Deleted Successfully!");
          // Manually update local state for immediate feedback
          setBookings(prev => prev.filter(b => b._id !== id));
        }
      } catch (error) {
        console.error("Delete Error:", error);
        const errorMsg = error.response?.data?.message || error.message;
        alert(`Failed to delete booking: ${errorMsg}`);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Allocated': return '#48bb78'; // Green
      case 'Extended': return '#3182ce'; // Blue
      case 'Completed': return '#48bb78'; // Green for success
      case 'Rejected': return '#e53e3e'; // Red
      case 'Overtime': return '#e53e3e'; // Red for warning
      default: return '#ecc94b'; // Yellow/Pending
    }
  };

  const getStatusBadgeClass = (status, paymentStatus) => {
    if (status?.toLowerCase() === "overtime" && paymentStatus === "Paid") return "completed";
    return status?.toLowerCase() || "";
  };

  return (
    <div className="manage-location-container">
      <h2>Manage Bookings (Real-time)</h2>
      
      <div className="location-list">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Vehicle</th>
              <th>Location</th>
              <th>Timing</th>
              <th>Slot</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <tr key={booking._id}>
                  <td>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{booking.userId?.name || "N/A"}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{booking.userId?.email}</div>
                  </td>
                  <td>
                    <div className="vehicle-badge" style={{ display: 'inline-block' }}>
                      <MdDirectionsCar style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      {booking.vehicleNumber || booking.userId?.vehicleNumber || "N/A"}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MdLocationOn style={{ color: '#64748b' }} />
                      <span>{booking.city} / {booking.area}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MdAccessTime style={{ color: '#94a3b8' }} />
                        <span>{new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MdAccessTime style={{ color: '#94a3b8' }} />
                        <span>{new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      background: '#f1f5f9', 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      fontWeight: '700',
                      color: '#475569'
                    }}>
                      {booking.slotNumber || "TBD"}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '700', color: '#1e293b' }}>
                      ₹{(booking.amount || 0) + (booking.extraCharge || 0)}
                    </div>
                    {(booking.extensionAmount > 0 || booking.extraCharge > 0) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {booking.extensionAmount > 0 && (
                          <span style={{ fontSize: '10px', color: '#64748b', background: '#f8fafc', padding: '1px 4px', borderRadius: '4px' }}>
                            Ext: +₹{booking.extensionAmount}
                          </span>
                        )}
                        {booking.extraCharge > 0 && (
                          <span style={{ 
                            fontSize: '10px', 
                            color: '#ef4444', 
                            fontWeight: '700',
                            background: '#fef2f2',
                            padding: '1px 4px',
                            borderRadius: '4px'
                          }}>
                            {(booking.status?.toLowerCase() === 'completed' || (booking.status?.toLowerCase() === 'overtime' && booking.paymentStatus === 'Paid')) ? 'Extra' : 'Overtime'}: +₹{booking.extraCharge}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(booking.status, booking.paymentStatus)}`}>
                      {(booking.status?.toLowerCase() === "overtime" && booking.paymentStatus === "Paid") ? "COMPLETED" : booking.status?.toUpperCase()}
                    </span>
                    
                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {(booking.status?.toLowerCase() === "overtime" && booking.paymentStatus !== "Paid") && (
                        <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <MdWarning size={10} /> OVERTIME
                        </span>
                      )}
                      {booking.paymentStatus === "Pending" && (
                        <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <MdWarning size={10} /> UNPAID
                        </span>
                      )}
                      {booking.paymentStatus === "Paid" && (
                        <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <MdCheckCircle size={10} /> PAID
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {(["allocated", "extended", "overtime"].includes(booking.status?.toLowerCase()) && !(booking.status?.toLowerCase() === "overtime" && booking.paymentStatus === "Paid")) && (
                        <button onClick={() => handleAction(booking._id, "Completed")} className="confirm-btn">
                          <MdCheckCircle style={{ marginRight: '4px' }} />
                          Complete
                        </button>
                      )}
                      <button onClick={() => deleteBooking(booking._id)} className="delete-btn">
                        <MdDelete style={{ marginRight: '4px' }} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: '#94a3b8' }}>
                  No bookings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageBookings;
