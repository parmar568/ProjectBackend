import React, { useState, useEffect } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import "./ManageLocation.css";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const { searchTerm } = useOutletContext();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/all");
      setUsers(res.data);
    } catch (error) {
      console.log("Error fetching users:", error);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower) ||
      user.vehicleNumber?.toLowerCase().includes(searchLower) ||
      user.vehicleType?.toLowerCase().includes(searchLower)
    );
  });

  const deleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`http://localhost:5000/api/users/delete/${id}`);
        fetchUsers();
      } catch (error) {
        console.log("Error deleting user:", error);
      }
    }
  };

  return (
    <div className="manage-location-container">
      <h2>Manage Users</h2>
      
      <div className="location-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Vehicle No</th>
              <th>Type</th>
              <th>Joined Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>{user.vehicleNumber}</td>
                  <td>{user.vehicleType}</td>
                  <td>{new Date(user.createdAt || Date.now()).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => deleteUser(user._id)} className="delete-btn">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;
