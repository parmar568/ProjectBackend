import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ManageLocation.css";

const ManageSlots = () => {
  const [locations, setLocations] = useState([]);
  const [visualizeData, setVisualizeData] = useState({ city: "", locationId: "" });
  const [slotVisualization, setSlotVisualization] = useState({ totalSlots: 0, bookings: [] });

  const cities = [...new Set(locations.map(loc => loc.city))];
  const availableAreas = locations.filter(loc => loc.city === visualizeData.city);

  const fetchVisualization = async () => {
    if (!visualizeData.locationId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/bookings/by-location/${visualizeData.locationId}`);
      setSlotVisualization({
        totalSlots: parseInt(res.data.totalSlots) || 0,
        bookings: res.data.bookings || []
      });
    } catch (error) {
      console.log("VISUALIZATION ERROR:", error);
    }
  };

  useEffect(() => {
    fetchVisualization();
  }, [visualizeData.locationId]);

  const fetchLocations = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/location/get");
      setLocations(res.data);
    } catch (error) {
      console.log("FETCH LOCATIONS ERROR:", error);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const bookedCount = [...new Set(slotVisualization.bookings.map(b => b.slotNumber))].length;

  const getSlotLabel = (num) => {
    if (slotVisualization.totalSlots <= 10) return `P${num}`;
    const half = Math.ceil(slotVisualization.totalSlots / 2);
    if (num <= half) return `P${num}`;
    return `S${num - half}`;
  };

  return (
    <div style={{ marginTop: '50px' }}>
      <div className="manage-location-container">
        <div className="slot-visualization-section" style={{ background: '#ffffff', padding: '30px', borderRadius: '24px', marginBottom: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f0f4f8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', color: '#2d3748', fontWeight: '700' }}>Real-time Slot Monitor</h3>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ width: '12px', height: '12px', background: '#48bb78', borderRadius: '3px' }}></span> Available
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ width: '12px', height: '12px', background: '#f56565', borderRadius: '3px' }}></span> Booked
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#718096', fontWeight: '600' }}>SELECT CITY</label>
              <select
                value={visualizeData.city}
                onChange={(e) => setVisualizeData({ city: e.target.value, locationId: "" })}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: '2px solid #edf2f7',
                  outline: 'none',
                  fontSize: '15px',
                  color: '#2d3748',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Cities...</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#718096', fontWeight: '600' }}>SELECT AREA / LOCATION</label>
              <select
                value={visualizeData.locationId}
                disabled={!visualizeData.city}
                onChange={(e) => setVisualizeData({ ...visualizeData, locationId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: '2px solid #edf2f7',
                  outline: 'none',
                  fontSize: '15px',
                  color: '#2d3748',
                  backgroundColor: visualizeData.city ? '#f8fafc' : '#f1f5f9',
                  cursor: visualizeData.city ? 'pointer' : 'not-allowed'
                }}
              >
                <option value="">{visualizeData.city ? "Select Area..." : "Select City First"}</option>
                {availableAreas.map(loc => (
                  <option key={loc._id} value={loc._id}>{loc.area} ({loc.totalSlots} Slots)</option>
                ))}
              </select>
            </div>
          </div>

          {visualizeData.locationId ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {/* Summary Statistics Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', background: '#f8fafc', padding: '25px', borderRadius: '20px', border: '1px solid #edf2f7' }}>
                <div style={{ textAlign: 'center', borderRight: '1px solid #edf2f7' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: '#718096', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>Total Capacity</span>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: '#2d3748' }}>{slotVisualization.totalSlots}</span>
                </div>
                <div style={{ textAlign: 'center', borderRight: '1px solid #edf2f7' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: '#f56565', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>Occupied Slots</span>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: '#f56565' }}>{bookedCount}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: '#48bb78', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>Available Now</span>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: '#48bb78' }}>{slotVisualization.totalSlots - bookedCount}</span>
                </div>
              </div>

              {/* Slots Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {Array.from({ length: slotVisualization.totalSlots }, (_, i) => i + 1).map(slotNum => {
                  const slotBookings = slotVisualization.bookings.filter(b => b.slotNumber === slotNum);
                  const hasBookings = slotBookings.length > 0;
                  const slotLabel = getSlotLabel(slotNum);

                  return (
                    <div key={slotNum} style={{
                      minHeight: '200px',
                      background: hasBookings ? '#fff' : '#f0fff4',
                      border: `2px solid ${hasBookings ? '#feb2b2' : '#c6f6d5'}`,
                      borderRadius: '16px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s',
                      boxShadow: hasBookings ? '0 4px 12px rgba(245, 101, 101, 0.08)' : 'none',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Slot Header */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid #edf2f7'
                      }}>
                        <span style={{ fontWeight: '800', fontSize: '18px', color: hasBookings ? '#e53e3e' : '#2f855a' }}>
                          {slotLabel}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: hasBookings ? '#fff5f5' : '#f0fff4',
                          color: hasBookings ? '#e53e3e' : '#2f855a',
                          fontWeight: '700',
                          textTransform: 'uppercase'
                        }}>
                          {hasBookings ? 'Occupied' : 'Free'}
                        </span>
                      </div>

                      {/* Booking Details */}
                      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {hasBookings ? (
                          slotBookings.map((b, idx) => (
                            <div key={idx} style={{
                              padding: '10px',
                              background: '#f8fafc',
                              borderRadius: '10px',
                              border: '1px solid #edf2f7',
                              fontSize: '12px'
                            }}>
                              <div style={{ fontWeight: '700', color: '#2d3748', marginBottom: '4px', fontSize: '13px' }}>{b.userName}</div>
                              <div style={{ color: '#4a5568', display: 'flex', justifyContent: 'space-between' }}>
                                <span>🚗 {b.vehicleNumber}</span>
                              </div>
                              <div style={{ marginTop: '6px', color: '#718096', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                📅 {b.date}
                              </div>
                              <div style={{ color: '#3182ce', fontWeight: '600', marginTop: '2px' }}>
                                🕒 {b.time}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: '#48bb78',
                            opacity: 0.7
                          }}>
                            <div style={{ fontSize: '32px', marginBottom: '5px' }}>✓</div>
                            <div style={{ fontWeight: '600', fontSize: '12px' }}>READY TO BOOK</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #edf2f7' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📍</div>
              <h4 style={{ margin: 0, color: '#4a5568', fontSize: '18px' }}>No Location Selected</h4>
              <p style={{ color: '#718096', fontSize: '14px', marginTop: '10px' }}>Please choose a city and area from the dropdown above to view real-time occupancy status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageSlots;
