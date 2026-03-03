import React, { useState } from "react";
import { addOrder } from "../api/orders";


const ORDER_TYPES = ["Individuals", "Shops", "Supermarkets", "Pre-Urban","SOFHA Health Centers"];

export default function OrderForm({ onOrderAdded }) {
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    type: "Individuals",
    orderDate: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      setError("Customer name is required");
      return;
    }
    
    if (!formData.orderDate) {
      setError("Order date is required");
      return;
    }

    setLoading(true);
    try {
      const newOrder = {
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber.trim() || null,
        type: formData.type,
        orderDate: new Date(formData.orderDate).toISOString(), // Convert to ISO string for API
      };
      
      await addOrder(newOrder);
      setFormData({
        customerName: "",
        phoneNumber: "",
        type: "Individuals",
        orderDate: new Date().toISOString().split('T')[0], // Reset to today's date
      });
      if (onOrderAdded) onOrderAdded();
    } catch (err) {
      setError("Failed to add order. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-form-container">
      <h2>Add New Order</h2>
      <form onSubmit={handleSubmit} className="order-form">
        <div className="form-group">
          <label htmlFor="orderDate">Order Date *</label>
          <input
            type="date"
            id="orderDate"
            name="orderDate"
            value={formData.orderDate}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="customerName">Customer Name *</label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            placeholder="Enter customer name"
            disabled={loading}
            className={error ? "error" : ""}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Enter phone number (optional)"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Order Type *</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            disabled={loading}
          >
            {ORDER_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          type="submit" 
          disabled={loading}
          className="submit-btn"
        >
          {loading ? "Adding..." : "Add Order"}
        </button>
      </form>
    </div>
  );
}