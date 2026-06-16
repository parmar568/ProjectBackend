import React from "react";

const Placeholder = ({ name }) => (
  <div style={{ padding: "2rem", background: "white", borderRadius: "1rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
    <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", marginBottom: "1rem" }}>{name}</h2>
    <p style={{ color: "#64748b" }}>This section is under development. Please check back later.</p>
  </div>
);

export const Reports = () => <Placeholder name="Reports" />;
export const Settings = () => <Placeholder name="Settings" />;
