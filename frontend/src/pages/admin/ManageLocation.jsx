import React, { useState, useEffect } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import "./ManageLocation.css";

const ManageLocation = () => {
  const { searchTerm } = useOutletContext();
  const [locationData, setLocationData] = useState({
    city: "",
    area: "",
    price: "",
    mapUrl: ""
  });

  const [locations, setLocations] = useState([]);

  // edit mode state
  const [editId, setEditId] = useState(null);

  // input change
  const handleChange = (e) => {
    setLocationData({
      ...locationData,
      [e.target.name]: e.target.value,
    });
  };

  // load data for editing
  const editLocation = (loc) => {

    setLocationData({
      city: loc.city,
      area: loc.area,
      price: loc.price,
      mapUrl: loc.mapUrl || ""
    });

    setEditId(loc._id);
  };

  // update location
  const updateLocation = async (e) => {

    e.preventDefault();

    try {

      await axios.put(
        `http://localhost:5000/api/location/update/${editId}`,
        locationData
      );

      setEditId(null);

      setLocationData({
        city: "",
        area: "",
        price: "",
        mapUrl: ""
      });

      fetchLocations();

    } catch (error) {

      console.log("UPDATE ERROR:", error);

    }
  };

  // add location
  const addLocation = async (e) => {

    e.preventDefault();

    try {

      await axios.post(
        "http://localhost:5000/api/location/add",
        locationData
      );

      setLocationData({
        city: "",
        area: "",
        price: "",
        mapUrl: ""
      });

      fetchLocations();

    } catch (error) {

      console.log(error);

    }
  };

  // fetch locations
  const fetchLocations = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/location/get");
      setLocations(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      loc.city?.toLowerCase().includes(searchLower) ||
      loc.area?.toLowerCase().includes(searchLower)
    );
  });

  // delete location
  const deleteLocation = async (id) => {

    try {

      await axios.delete(
        `http://localhost:5000/api/location/delete/${id}`
      );

      fetchLocations();

    } catch (error) {

      console.log("DELETE ERROR:", error);

    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  return (
    <div className="manage-location-container">

      <h2>Manage Parking Locations</h2>

      <form
        className="location-form"
        onSubmit={editId ? updateLocation : addLocation}
      >

        <input
          type="text"
          name="city"
          placeholder="Enter City"
          value={locationData.city}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="area"
          placeholder="Enter Area"
          value={locationData.area}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="price"
          placeholder="Parking Price"
          value={locationData.price}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="mapUrl"
          placeholder="Google Maps URL"
          value={locationData.mapUrl}
          onChange={handleChange}
        />

        <button type="submit">
          {editId ? "Update Location" : "Add Location"}
        </button>

      </form>

      <div className="location-list">

        <table>

          <thead>
            <tr>
              <th>City</th>
              <th>Area</th>
              <th>Price</th>
              <th>Map</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredLocations.length > 0 ? (
              filteredLocations.map((loc) => (
                <tr key={loc._id}>
                  <td>{loc.city}</td>
                  <td>{loc.area}</td>
                  <td>₹{loc.price}</td>
                  <td>
                    {loc.mapUrl ? (
                      <a 
                        href={loc.mapUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="view-map-link"
                      >
                        View Map
                      </a>
                    ) : (
                      <span className="no-map">No Map</span>
                    )}
                  </td>
                  <td>
                    <button onClick={() => editLocation(loc)} className="edit-btn">Edit</button>
                    <button onClick={() => deleteLocation(loc._id)} className="delete-btn">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>No locations found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageLocation;
