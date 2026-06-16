import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ManageLocation.css";

const ManageContact = () => {
  const [contacts, setContacts] = useState([]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/contact/all");
      setContacts(res.data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const handleReplyClick = (contact) => {
    setSelectedContact(contact);
    setReplyMessage("");
    setShowReplyModal(true);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/contact/reply", {
        contactId: selectedContact._id,
        replyMessage: replyMessage
      });
      alert("Reply sent successfully via email!");
      setShowReplyModal(false);
      fetchContacts();
    } catch (error) {
      alert("Failed to send reply.");
    } finally {
      setLoading(false);
    }
  };

  const newMessagesCount = contacts.filter(c => c.status === "pending").length;

  return (
    <div className="manage-location-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Manage Contact Requests</h2>
        {newMessagesCount > 0 && (
          <div style={{ 
            background: '#ff4d94', 
            color: 'white', 
            padding: '5px 15px', 
            borderRadius: '20px', 
            fontSize: '14px', 
            fontWeight: 'bold',
            boxShadow: '0 2px 10px rgba(255, 77, 148, 0.3)'
          }}>
            {newMessagesCount} New Messages
          </div>
        )}
      </div>

      <div className="location-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.length > 0 ? contacts.map((contact) => (
              <tr key={contact._id}>
                <td>{contact.name}</td>
                <td>{contact.email}</td>
                <td>{contact.subject}</td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.message}</td>
                <td>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '11px', 
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    backgroundColor: contact.status === 'replied' ? '#dcfce7' : '#fef3c7',
                    color: contact.status === 'replied' ? '#15803d' : '#a16207'
                  }}>
                    {contact.status || 'pending'}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleReplyClick(contact)}
                    style={{ 
                      padding: '6px 12px', 
                      background: contact.status === 'replied' ? '#718096' : '#1e3c72', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      opacity: contact.status === 'replied' ? 0.7 : 1
                    }}
                  >
                    {contact.status === 'replied' ? 'Reply Again' : 'Reply'}
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No contact requests found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showReplyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '600px' }}>
            <h3>Reply to {selectedContact.name}</h3>
            <div style={{ marginBottom: '15px', padding: '10px', background: '#f8fafc', borderRadius: '8px', fontSize: '14px' }}>
              <strong>User Message:</strong> <br/>
              "{selectedContact.message}"
            </div>
            <form onSubmit={handleSendReply}>
              <textarea 
                value={replyMessage} 
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                rows="6"
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}
              ></textarea>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#48bb78', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {loading ? "Sending..." : "Send Email Reply"}
                </button>
                <button type="button" onClick={() => setShowReplyModal(false)} style={{ padding: '10px 20px', background: '#a0aec0', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageContact;
