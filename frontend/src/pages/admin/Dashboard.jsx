import React, { useEffect, useState } from "react";
import { dashboardService } from "../../services/api";
import { useOutletContext } from "react-router-dom";
import {
  MdTrendingUp,
  MdTrendingDown,
  MdMoreVert,
  MdList,
  MdCalendarToday,
  MdAccountBalanceWallet,
  MdEventAvailable,
  MdDirectionsCar,
  MdLocalParking,
  MdHistory
} from "react-icons/md";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import "./Dashboard.css";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const { searchTerm } = useOutletContext();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardService.getStats();
        setData(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setLoading(false);
      }
    };
    fetchStats();
    
    // Set up polling for "real-time" feel
    const interval = setInterval(fetchStats, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading">Loading Dashboard...</div>;
  if (!data) return <div className="error">Failed to load dashboard data.</div>;

  const summary = data.summary || {};
  const recentBookings = data.recentBookings || [];
  const charts = data.charts || {};

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

  // ✅ FILTER LOGIC (SEARCH + TAB)
  const filteredBookings = recentBookings.filter((booking) => {
    const searchLower = searchTerm?.toLowerCase() || "";

    const matchesSearch =
      booking.userId?.name?.toLowerCase().includes(searchLower) ||
      booking.vehicleNumber?.toLowerCase().includes(searchLower) ||
      booking.area?.toLowerCase().includes(searchLower) ||
      booking._id.slice(-6).toUpperCase().includes(searchLower.toUpperCase());

    if (activeTab === "All") return matchesSearch;

    if (activeTab === "Active") {
      return matchesSearch &&
        ["allocated", "extended", "overtime"].includes(booking.status?.toLowerCase()) &&
        !(booking.status?.toLowerCase() === "overtime" && booking.paymentStatus === "Paid");
    }

    if (activeTab === "Completed") {
      return matchesSearch && (
        booking.status?.toLowerCase() === "completed" ||
        (booking.status?.toLowerCase() === "overtime" && booking.paymentStatus === "Paid")
      );
    }
  });

  // ✅ TABS WITH COUNTS
  const tabs = [
    { name: "All", count: recentBookings.length },
    {
      name: "Active",
      count: recentBookings.filter(b =>
        ["allocated", "extended", "overtime"].includes(b.status?.toLowerCase()) &&
        !(b.status?.toLowerCase() === "overtime" && b.paymentStatus === "Paid")
      ).length
    },
    {
      name: "Completed",
      count: recentBookings.filter(b =>
        b.status?.toLowerCase() === "completed" ||
        (b.status?.toLowerCase() === "overtime" && b.paymentStatus === "Paid")
      ).length
    },
  ];

  return (
    <div className="dashboard-container">

      {/* HEADER */}
      <div className="dashboard-header-main">
        <h1 className="page-title">Admin Overview</h1>
        <div className="header-actions">
          <button className="icon-action-btn" title="Refresh Data" onClick={() => window.location.reload()}><MdHistory /></button>
          <button className="icon-action-btn"><MdCalendarToday /></button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid-modern">
        <StatCardModern
          title="Total Revenue"
          value={`₹${(summary.totalRevenue || 0).toLocaleString()}`}
          trend="+12.5%"
          isPositive={true}
          icon={<MdAccountBalanceWallet />}
          type="revenue"
        />
        <StatCardModern
          title="Total Bookings"
          value={summary.totalBookings || 0}
          trend="+8.2%"
          isPositive={true}
          icon={<MdEventAvailable />}
          type="bookings"
        />
        <StatCardModern
          title="Active Slots"
          value={summary.bookedSlots || 0}
          trend={`${Math.round((summary.bookedSlots / summary.totalParkingSlots) * 100)}%`}
          isPositive={true}
          icon={<MdLocalParking />}
          type="total-slots"
        />
        <StatCardModern
          title="Available Slots"
          value={summary.availableSlots || 0}
          trend="Real-time"
          isPositive={true}
          icon={<MdDirectionsCar />}
          type="available-slots"
        />
      </div>

      {/* CHARTS SECTION */}
      <div className="charts-grid-modern">
        {/* REVENUE TREND CHART */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Revenue Growth (Current Month)</h3>
            <span className="chart-subtitle">Daily earnings in INR</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charts.revenueTrends}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} label={{ value: 'Day of Month', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                  labelFormatter={(label) => `Day ${label}`}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BOOKINGS CHART */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Booking Frequency</h3>
            <span className="chart-subtitle">Monthly booking volume</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.monthlyBookings}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="bookings" fill="#10b981" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLOT USAGE PIE CHART */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Slot Distribution</h3>
            <span className="chart-subtitle">Live availability status</span>
          </div>
          <div className="chart-wrapper" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts.slotUsage}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.slotUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HOURLY USAGE CHART */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Peak Hours</h3>
            <span className="chart-subtitle">Booking activity by hour</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charts.hourlyUsage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Area type="stepAfter" dataKey="usage" stroke="#f59e0b" fill="#fef3c7" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs-container">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            className={`tab-btn ${activeTab === tab.name ? "active" : ""}`}
            onClick={() => setActiveTab(tab.name)}
          >
            {tab.name}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="modern-table-container">
        <div className="table-header">
          <h2>Recent Activity</h2>
        </div>

        <table className="staywise-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Area / Location</th>
              <th>Vehicle No.</th>
              <th>Date & Time</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <tr key={booking._id}>

                  {/* ID */}
                  <td className="row-id">
                    #{booking._id.slice(-4).toUpperCase()}
                  </td>

                  {/* CUSTOMER */}
                  <td>
                    <div className="customer-cell">
                      <img
                        src={`https://ui-avatars.com/api/?name=${booking.userId?.name || "U"}&background=random`}
                        alt="avatar"
                        className="customer-avatar"
                      />
                      <div className="customer-info">
                        <span className="customer-name">
                          {booking.userId?.name || "Deleted User"}
                        </span>
                        <span className="customer-subtext">
                          {booking.userId?.email || booking.email || "No email"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* AREA */}
                  <td>{booking.area}</td>

                  {/* VEHICLE */}
                  <td>
                    <span className="vehicle-badge">
                      {booking.vehicleNumber}
                    </span>
                  </td>

                  {/* DATE */}
                  <td>
                    <div className="date-cell">
                      <span className="main-date">
                        {new Date(booking.startTime).toLocaleDateString()}
                      </span>
                      <span className="sub-time">
                        {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                        {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>

                  {/* AMOUNT */}
                  <td>
                    <div className="amount-cell">
                      <span className="main-amount">₹{(booking.amount || 0) + (booking.extraCharge || 0)}</span>
                      {booking.extraCharge > 0 && (
                        <span className="extra-charge-sub" style={{ fontSize: '10px', color: '#e53e3e', display: 'block' }}>
                          (+₹{booking.extraCharge} {(booking.status === 'Completed' || (booking.status === 'Overtime' && booking.paymentStatus === 'Paid')) ? 'Extra' : 'Overtime'})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* STATUS */}
                  <td>
                    <span className={`status-pill ${booking.status?.toLowerCase() === 'overtime' && booking.paymentStatus === 'Paid' ? 'completed' : booking.status?.toLowerCase()}`}>
                      {booking.status?.toLowerCase() === 'overtime' && booking.paymentStatus === 'Paid' ? 'Completed' : booking.status}
                    </span>
                  </td>

                  {/* ACTION */}
                  <td>
                    <button className="more-btn">
                      <MdMoreVert />
                    </button>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">
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

// STAT CARD COMPONENT
const StatCardModern = ({ title, value, trend, isPositive, icon, type }) => (
  <div className="stat-card-modern">
    <div className="stat-header">
      <div className={`stat-icon-wrapper ${type}`}>
        {icon}
      </div>
      {trend && (
        <div className={`stat-trend-modern ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <MdTrendingUp /> : <MdTrendingDown />}
          {trend}
        </div>
      )}
    </div>
    <div className="stat-content">
      <span className="stat-title">{title}</span>
      <h2 className="stat-value-main">{value}</h2>
    </div>
  </div>
);

export default Dashboard;