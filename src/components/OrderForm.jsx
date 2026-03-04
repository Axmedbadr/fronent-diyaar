import React, { useState } from "react";
import { addOrder } from "../api/orders";

const ORDER_TYPES = ["Individuals", "Shops", "Supermarkets", "Pre-Urban", "SOFHA Health Centers"];

// Item list (products per kg)
const ITEMS = [
  { id: 1, name: "Mashaali kg" },
  { id: 2, name: "M.plus kg" },
  { id: 3, name: "Budo kg" },
  { id: 4, name: "Shuuro kg" },
  { id: 5, name: "Talbina kg" },
  { id: 6, name: "Budo special order kg" },
  { id: 7, name: "Shuuro special order kg" },
  { id: 8, name: "Mashaali cake mix powder kg" }
];

export default function OrderForm({ onOrderAdded }) {
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    type: "Individuals",
    orderDate: new Date().toISOString().split('T')[0]
  });
  
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    itemName: "",
    quantity: 1
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    if (!currentItem.itemName) {
      setError("Please select an item");
      return;
    }
    if (currentItem.quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    setItems([
      ...items,
      {
        itemName: currentItem.itemName,
        quantity: parseInt(currentItem.quantity)
      }
    ]);

    setCurrentItem({
      itemName: "",
      quantity: 1
    });
    setError("");
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
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

    if (items.length === 0) {
      setError("Please add at least one item to the order");
      return;
    }

    setLoading(true);
    try {
      const newOrder = {
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber.trim() || null,
        type: formData.type,
        orderDate: new Date(formData.orderDate).toISOString(),
        items: items
      };
      
      await addOrder(newOrder);
      
      setFormData({
        customerName: "",
        phoneNumber: "",
        type: "Individuals",
        orderDate: new Date().toISOString().split('T')[0]
      });
      setItems([]);
      
      if (onOrderAdded) onOrderAdded();
    } catch (err) {
      setError("Failed to add order. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalKg = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="order-form-container">
      <h2>📦 Add New Order</h2>
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

        <div className="items-section">
          <h3>🛒 Add Items (per kg)</h3>
          
          <div className="item-row">
            <select
              name="itemName"
              value={currentItem.itemName}
              onChange={handleItemChange}
              className="item-select"
              disabled={loading}
            >
              <option value="">Select an item...</option>
              {ITEMS.map(item => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              name="quantity"
              value={currentItem.quantity}
              onChange={handleItemChange}
              placeholder="Quantity (kg)"
              min="1"
              className="item-quantity"
              disabled={loading}
            />

            <button 
              type="button" 
              onClick={addItem}
              className="add-item-btn"
              disabled={loading}
            >
              ➕ Add Item
            </button>
          </div>

          {items.length > 0 && (
            <div className="items-list">
              <h4>Order Items:</h4>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity (kg)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.itemName}</td>
                      <td>{item.quantity} kg</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="remove-item-btn"
                          disabled={loading}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Total:</strong></td>
                    <td><strong>{totalKg} kg</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          type="submit" 
          disabled={loading || items.length === 0}
          className="submit-btn"
        >
          {loading ? "Creating Order..." : "Create Order"}
        </button>
      </form>
    </div>
  );
}