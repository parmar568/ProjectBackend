import React, { useState, useEffect } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import "./ManageLocation.css";

const CreateSlots = () => {
  const [locations, setLocations] = useState([]);
  const [editId, setEditId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const context = useOutletContext();
  const searchTerm = context?.searchTerm || "";

  const [slotData, setSlotData] = useState({
    city: "", area: "", totalSlots: "", availableSlots: "", price: "", mapUrl: ""
  });

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

  const filteredLocations = locations.filter((loc) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      loc.city?.toLowerCase().includes(searchLower) ||
      loc.area?.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (loc) => {
    setEditId(loc._id);
    setSlotData({ 
      city: loc.city, 
      area: loc.area, 
      totalSlots: loc.totalSlots, 
      availableSlots: loc.availableSlots, 
      price: loc.price,
      mapUrl: loc.mapUrl || ""
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/location/update/${editId}`, {
        ...slotData,
        totalSlots: parseInt(slotData.totalSlots),
        availableSlots: parseInt(slotData.availableSlots)
      });
      alert("Slots updated successfully!");
      setEditId(null);
      setSlotData({ city: "", area: "", totalSlots: "", availableSlots: "", price: "", mapUrl: "" });
      fetchLocations();
    } catch (error) {
      alert("Failed to update slots");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/location/add", {
        ...slotData,
        totalSlots: parseInt(slotData.totalSlots),
        availableSlots: parseInt(slotData.totalSlots)
      });
      alert("Slots added successfully!");
      setShowAddForm(false);
      setSlotData({ city: "", area: "", totalSlots: "", availableSlots: "", price: "", mapUrl: "" });
      fetchLocations();
    } catch (error) {
      alert("Failed to add slots");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this slot area?")) {
      try {
        await axios.delete(`http://localhost:5000/api/location/delete/${id}`);
        alert("Slot area deleted successfully!");
        fetchLocations();
      } catch (error) {
        alert("Failed to delete slot area");
      }
    }
  };

  return (
    <div style={{ marginTop: '50px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', color: '#2d3748', fontWeight: '700' }}>Manage Slot Capacities</h3>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditId(null);
            setSlotData({ city: "", area: "", totalSlots: "", availableSlots: "", price: "", mapUrl: "" });
          }}
          style={{ padding: '10px 20px', background: showAddForm ? '#e53e3e' : '#48bb78', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showAddForm ? "Cancel Add" : "+ Add New Slots"}
        </button>
      </div>

      {showAddForm && !editId && (
        <form className="location-form" onSubmit={handleAdd} style={{ marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #edf2f7' }}>
          <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Add New Slot Area</h4>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '5px' }}>City *</label>
              <input type="text" value={slotData.city} onChange={(e) => setSlotData({ ...slotData, city: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Area *</label>
              <input type="text" value={slotData.area} onChange={(e) => setSlotData({ ...slotData, area: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Total Slots *</label>
              <input type="number" value={slotData.totalSlots} onChange={(e) => setSlotData({ ...slotData, totalSlots: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Price per hour (₹) *</label>
              <input type="number" value={slotData.price} onChange={(e) => setSlotData({ ...slotData, price: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Google Maps Link (Optional)</label>
            <input 
              type="text" 
              value={slotData.mapUrl} 
              onChange={(e) => setSlotData({ ...slotData, mapUrl: e.target.value })} 
              placeholder="https://goo.gl/maps/..."
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} 
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#48bb78', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Save New Slots</button>
        </form>
      )}

      {editId && (
        <form className="location-form" onSubmit={handleUpdate} style={{ marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #edf2f7' }}>
          <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Editing Slots for {slotData.city} - {slotData.area}</h4>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Total Slots</label>
              <input
                type="number"
                value={slotData.totalSlots}
                onChange={(e) => setSlotData({ ...slotData, totalSlots: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Available Slots</label>
              <input
                type="number"
                value={slotData.availableSlots}
                onChange={(e) => setSlotData({ ...slotData, availableSlots: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Google Maps Link</label>
            <input 
              type="text" 
              value={slotData.mapUrl} 
              onChange={(e) => setSlotData({ ...slotData, mapUrl: e.target.value })} 
              placeholder="https://goo.gl/maps/..."
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} 
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ flex: 1, padding: '10px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Update Capacity</button>
            <button type="button" onClick={() => setEditId(null)} style={{ flex: 1, padding: '10px', background: '#a0aec0', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
          </div>
        </form>
      )}

      <div className="manage-location-container">
        <div className="location-list">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '12px' }}>City</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Area</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Total Slots</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Available Slots</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Price (₹/hr)</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc) => (
                  <tr key={loc._id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '12px' }}>{loc.city}</td>
                    <td style={{ padding: '12px' }}>{loc.area}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', padding: '12px' }}>{loc.totalSlots || 0}</td>
                    <td style={{ textAlign: 'center', color: '#48bb78', fontWeight: 'bold', padding: '12px' }}>{loc.availableSlots || 0}</td>
                    <td style={{ textAlign: 'center', padding: '12px' }}>{loc.price || 0}</td>
                    <td style={{ textAlign: 'center', padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => handleEdit(loc)} style={{ padding: '6px 12px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                        <button onClick={() => handleDelete(loc._id)} style={{ padding: '6px 12px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>No locations found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CreateSlots;
