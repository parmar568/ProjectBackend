import React, { useState, useEffect } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import { 
  MdCheckCircle, 
  MdCancel, 
  MdAccountBalanceWallet,
  MdLocationOn,
  MdDirectionsCar,
  MdPayment
} from "react-icons/md";
import "./ManageLocation.css";

const ManagePayments = () => {
  const [bookings, setBookings] = useState([]);
  const { searchTerm } = useOutletContext();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/bookings/all");
      setBookings(res.data);
    } catch (error) {
      console.log("Error fetching bookings:", error);
    }
  };

  const filteredPayments = bookings.filter((booking) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.userId?.name?.toLowerCase().includes(searchLower) ||
      booking.vehicleNumber?.toLowerCase().includes(searchLower) ||
      booking.city?.toLowerCase().includes(searchLower) ||
      booking.area?.toLowerCase().includes(searchLower) ||
      booking.paymentStatus?.toLowerCase().includes(searchLower) ||
      booking.paymentMethod?.toLowerCase().includes(searchLower)
    );
  });

  const updatePaymentStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/bookings/update-payment/${id}`, { paymentStatus: status });
      alert(`Payment status updated to ${status}`);
      fetchBookings();
    } catch (error) {
      console.log("Error updating payment status:", error);
    }
  };

  const totalRevenue = bookings
    .filter(b => b.paymentStatus && b.paymentStatus.toLowerCase() === "paid")
    .reduce((sum, b) => sum + (b.amount || 0) + (b.extraCharge || 0), 0);

  return (
    <div className="manage-location-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Manage Payments</h2>
        <div style={{ 
          background: 'var(--primary)', 
          color: 'white', 
          padding: '0.75rem 1.5rem', 
          borderRadius: '12px', 
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <MdAccountBalanceWallet size={20} />
          <span>Total Revenue: ₹{totalRevenue.toLocaleString()}</span>
        </div>
      </div>

      <div className="location-list">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Parking Info</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Payment Status</th>
              <th>Booking Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length > 0 ? (
              filteredPayments.map((booking) => (
                <tr key={booking._id}>
                  <td>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{booking.userId?.name || "N/A"}</div>
                    <div className="vehicle-badge" style={{ display: 'inline-block', marginTop: '4px' }}>
                      <MdDirectionsCar style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      {booking.vehicleNumber}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: '#1e293b' }}>
                      <MdLocationOn style={{ color: '#64748b' }} />
                      {booking.city}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginLeft: '20px' }}>{booking.area}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '700', color: '#10b981' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#475569', fontWeight: '600' }}>
                      <MdPayment style={{ color: '#94a3b8' }} />
                      <span style={{ textTransform: 'uppercase' }}>{booking.paymentMethod || "COD"}</span>
                    </div>
                    {booking.paymentApp && (
                      <div style={{ fontSize: '10px', color: '#f97316', fontWeight: '700', marginTop: '4px' }}>
                        via {booking.paymentApp}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${booking.paymentStatus?.toLowerCase()}`}>
                      {booking.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${booking.status?.toLowerCase() === 'overtime' && booking.paymentStatus === 'Paid' ? 'completed' : booking.status?.toLowerCase()}`}>
                      {booking.status?.toLowerCase() === 'overtime' && booking.paymentStatus === 'Paid' ? 'Completed' : booking.status}
                    </span>
                  </td>
                  <td>
                    {booking.paymentStatus === "Pending" && (
                      <div className="action-buttons">
                        <button 
                          className="confirm-btn"
                          onClick={() => updatePaymentStatus(booking._id, "Paid")}
                        >
                          <MdCheckCircle style={{ marginRight: '4px' }} />
                          Mark Paid
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => updatePaymentStatus(booking._id, "Failed")}
                        >
                          <MdCancel style={{ marginRight: '4px' }} />
                          Mark Failed
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  No payment records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagePayments;
