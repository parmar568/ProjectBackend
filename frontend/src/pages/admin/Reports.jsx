import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { MdPictureAsPdf, MdDateRange, MdTrendingUp, MdBarChart } from "react-icons/md";
import "./Dashboard.css"; // Reuse dashboard styling

const Reports = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/bookings/admin/bookings");
      setBookings(res.data);
      setLoading(false);
    } catch (error) {
      console.log("Error fetching bookings:", error);
      setLoading(false);
    }
  };

  const generatePDF = (type) => {
    const doc = new jsPDF();
    const now = new Date();
    let filteredData = [];
    let title = "";

    if (type === "weekly") {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredData = bookings.filter(b => new Date(b.startTime) >= lastWeek);
      title = "Weekly Parking Report";
    } else if (type === "monthly") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filteredData = bookings.filter(b => new Date(b.startTime) >= lastMonth);
      title = "Monthly Parking Report";
    } else {
      filteredData = bookings;
      title = "Overall Parking Report";
    }

    const totalRevenue = filteredData.reduce((acc, curr) => acc + (curr.amount || curr.parkingRate || 0), 0);
    const totalBookings = filteredData.length;
    const completedBookings = filteredData.filter(b => b.status === "Completed").length;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138); // Dark blue
    doc.text(title, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${now.toLocaleString()}`, 14, 30);
    doc.text(`Total Bookings: ${totalBookings}`, 14, 38);
    doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString()}`, 14, 46);
    doc.text(`Completed: ${completedBookings}`, 14, 54);

    // Table
    const tableData = filteredData.map(b => [
      b._id.slice(-6).toUpperCase(),
      b.userId?.name || "N/A",
      b.vehicleNumber || "N/A",
      `${b.city} / ${b.area}`,
      new Date(b.startTime).toLocaleDateString(),
      `₹${b.amount || b.parkingRate || 0}`,
      b.status
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['ID', 'User', 'Vehicle', 'Location', 'Date', 'Amount', 'Status']],
      body: tableData,
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`${type}_report_${now.toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return <div className="loading">Loading Reports...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-main">
        <h1 className="page-title">Reports & Analytics</h1>
      </div>

      <div className="stats-grid-modern">
        <div className="stat-card-modern" style={{ cursor: 'pointer' }} onClick={() => generatePDF("weekly")}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '12px', color: '#3b82f6' }}>
              <MdDateRange size={24} />
            </div>
            <div>
              <span className="stat-title">Generate Weekly Report</span>
              <div className="stat-value-main" style={{ fontSize: '1.25rem' }}>Download PDF</div>
            </div>
          </div>
          <button className="icon-action-btn" style={{ marginTop: '15px', width: '100%', background: '#3b82f6', color: 'white', border: 'none' }}>
            <MdPictureAsPdf /> Get Weekly Report
          </button>
        </div>

        <div className="stat-card-modern" style={{ cursor: 'pointer' }} onClick={() => generatePDF("monthly")}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: '#fce7f3', padding: '12px', borderRadius: '12px', color: '#ec4899' }}>
              <MdBarChart size={24} />
            </div>
            <div>
              <span className="stat-title">Generate Monthly Report</span>
              <div className="stat-value-main" style={{ fontSize: '1.25rem' }}>Download PDF</div>
            </div>
          </div>
          <button className="icon-action-btn" style={{ marginTop: '15px', width: '100%', background: '#ec4899', color: 'white', border: 'none' }}>
            <MdPictureAsPdf /> Get Monthly Report
          </button>
        </div>

        <div className="stat-card-modern" style={{ cursor: 'pointer' }} onClick={() => generatePDF("all")}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '12px', color: '#f59e0b' }}>
              <MdTrendingUp size={24} />
            </div>
            <div>
              <span className="stat-title">Full System Report</span>
              <div className="stat-value-main" style={{ fontSize: '1.25rem' }}>Download PDF</div>
            </div>
          </div>
          <button className="icon-action-btn" style={{ marginTop: '15px', width: '100%', background: '#f59e0b', color: 'white', border: 'none' }}>
            <MdPictureAsPdf /> Get All-time Report
          </button>
        </div>
      </div>

      <div className="modern-table-container" style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Recent Activity for Reporting</h2>
        <table className="staywise-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Location</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.slice(0, 10).map((b) => (
              <tr key={b._id}>
                <td className="row-id">#{b._id.slice(-4).toUpperCase()}</td>
                <td>{b.userId?.name || "N/A"}</td>
                <td>{b.city} / {b.area}</td>
                <td>{new Date(b.startTime).toLocaleDateString()}</td>
                <td>₹{b.amount || b.parkingRate || 0}</td>
                <td>
                  <span className={`status-pill ${b.status?.toLowerCase()}`}>
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
