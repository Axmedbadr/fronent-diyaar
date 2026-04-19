import React, { useState, useEffect } from "react";
import { addOrder, getAreaStats } from "../api/orders";

// Updated ORDER_TYPES with Community-Women
const ORDER_TYPES = [
  "Individuals", 
  "Shops", 
  "Supermarkets", 
  "Pre-Urban", 
  "SOFHA Health Centers",
  "Community-Women" // Now included
];

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

// Color mapping for order types (for visual enhancement)
const TYPE_COLORS = {
  "Individuals": "#3b82f6",
  "Shops": "#22c55e",
  "Supermarkets": "#a855f7",
  "Pre-Urban": "#f59e0b",
  "SOFHA Health Centers": "#ec4899",
  "Community-Women": "#8b5cf6"
};

export default function OrderForm({ onOrderAdded }) {
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    type: "Individuals",
    area: "",
    orderDate: new Date().toISOString().split('T')[0]
  });
  
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    itemName: "",
    quantity: 1
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  // State for frequently used areas
  const [frequentAreas, setFrequentAreas] = useState([]);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);

  // Fetch frequently used areas on component mount
  useEffect(() => {
    fetchFrequentAreas();
  }, []);

  // Fetch frequently used areas from API
  const fetchFrequentAreas = async () => {
    setLoadingAreas(true);
    try {
      const areaStats = await getAreaStats();
      console.log("Raw area stats:", areaStats); // Debug log
      
      // Filter out null or undefined areas and sort by count
      const validAreas = areaStats
        .filter(stat => stat._id && stat._id !== null && stat._id.trim() !== "") // Remove null/empty areas
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(stat => ({
          name: stat._id,
          count: stat.count
        }));
      
      console.log("Processed frequent areas:", validAreas);
      setFrequentAreas(validAreas);
    } catch (error) {
      console.error("Error fetching frequent areas:", error);
    } finally {
      setLoadingAreas(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
    setSuccess(false);
    
    // Show suggestions when typing in area field
    if (name === "area") {
      setShowAreaSuggestions(true);
    }
  };

  const handleAreaSelect = (area) => {
    setFormData(prev => ({ ...prev, area }));
    setShowAreaSuggestions(false);
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
        quantity: parseFloat(currentItem.quantity)
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

  const resetForm = () => {
    setFormData({
      customerName: "",
      phoneNumber: "",
      type: "Individuals",
      area: "",
      orderDate: new Date().toISOString().split('T')[0]
    });
    setItems([]);
    setSuccess(false);
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

    if (!formData.area.trim()) {
      setError("Delivery area is required");
      return;
    }

    if (items.length === 0) {
      setError("Please add at least one item to the order");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const newOrder = {
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber.trim() || null,
        type: formData.type,
        area: formData.area.trim(),
        orderDate: new Date(formData.orderDate).toISOString(),
        items: items
      };
      
      console.log("Submitting order:", newOrder);
      await addOrder(newOrder);
      
      setSuccess(true);
      resetForm();
      
      // Refresh frequent areas after adding new order
      fetchFrequentAreas();
      
      if (onOrderAdded) onOrderAdded();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Failed to add order. Please try again.");
      console.error("Order submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalKg = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalItems = items.length;

  // SAFE FILTERING - FIXED THE ERROR
  const filteredAreas = frequentAreas.filter(area => {
    // Check if area.name exists and is a string
    if (!area || !area.name || typeof area.name !== 'string') {
      return false; // Skip invalid areas
    }
    return area.name.toLowerCase().includes(formData.area.toLowerCase());
  });

  // Get color for selected type
  const selectedTypeColor = TYPE_COLORS[formData.type] || "#3b82f6";

  return (
    <div className="order-form-container">
      <div className="form-header">
        <h2>📦 Add New Order</h2>
        <p className="form-subtitle">Fill in the order details below</p>
      </div>

      {success && (
        <div className="success-message">
          ✅ Order created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="order-form">
        {/* Order Date */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="orderDate">
              Order Date <span className="required">*</span>
            </label>
            <input
              type="date"
              id="orderDate"
              name="orderDate"
              value={formData.orderDate}
              onChange={handleChange}
              disabled={loading}
              required
              className="form-input"
            />
          </div>
        </div>

        {/* Customer Information */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="customerName">
              Customer Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="Enter customer name"
              disabled={loading}
              required
              className="form-input"
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
              placeholder="+256 XXX XXX XXX"
              disabled={loading}
              className="form-input"
            />
          </div>
        </div>

        {/* Order Type and Area */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">
              Order Type <span className="required">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={loading}
              required
              className="form-select"
              style={{ borderLeft: `4px solid ${selectedTypeColor}` }}
            >
              {ORDER_TYPES.map(type => (
                <option key={type} value={type}>
                  {type === "Community-Women" ? "👩‍👩‍👧‍👧 " + type : type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group area-field">
            <label htmlFor="area">
              Delivery Area <span className="required">*</span>
            </label>
            <div className="area-input-wrapper">
              <input
                type="text"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                onFocus={() => setShowAreaSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowAreaSuggestions(false), 200);
                }}
                placeholder="Enter delivery area"
                disabled={loading}
                required
                className="form-input"
                autoComplete="off"
              />
              
              {loadingAreas && (
                <span className="area-loading">⏳</span>
              )}
            </div>

            {/* Frequently Used Areas Suggestions */}
            {showAreaSuggestions && formData.area.length > 0 && filteredAreas.length > 0 && (
              <div className="area-suggestions">
                <div className="suggestions-header">
                  <span className="suggestions-title">📍 Matching Areas</span>
                  <span className="suggestions-count">{filteredAreas.length}</span>
                </div>
                {filteredAreas.map((area, index) => (
                  <div
                    key={index}
                    className="area-suggestion-item"
                    onMouseDown={() => handleAreaSelect(area.name)}
                  >
                    <span className="area-name">{area.name}</span>
                    <span className="area-usage">{area.count} orders</span>
                  </div>
                ))}
              </div>
            )}

            {/* Show all frequent areas when field is empty */}
            {showAreaSuggestions && formData.area.length === 0 && frequentAreas.length > 0 && (
              <div className="area-suggestions">
                <div className="suggestions-header">
                  <span className="suggestions-title">🔥 Most Used Areas</span>
                  <span className="suggestions-count">Top {frequentAreas.length}</span>
                </div>
                {frequentAreas.map((area, index) => (
                  <div
                    key={index}
                    className="area-suggestion-item"
                    onMouseDown={() => handleAreaSelect(area.name)}
                  >
                    <span className="area-name">
                      {index + 1}. {area.name}
                    </span>
                    <span className="area-usage">{area.count} orders</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Items Section */}
        <div className="items-section">
          <div className="items-header">
            <h3>🛒 Order Items (per kg)</h3>
            <span className="items-count">{totalItems} items</span>
          </div>
          
          <div className="item-input-row">
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
              placeholder="Qty (kg)"
              min="0.5"
              step="0.5"
              className="item-quantity"
              disabled={loading}
            />

            <button 
              type="button" 
              onClick={addItem}
              className="add-item-btn"
              disabled={loading || !currentItem.itemName}
            >
              ➕ Add
            </button>
          </div>

          {items.length > 0 && (
            <div className="items-list">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Quantity (kg)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.itemName}</td>
                      <td className="quantity-cell">{item.quantity} kg</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="remove-item-btn"
                          disabled={loading}
                          title="Remove item"
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
                    <td><strong className="total-kg">{totalKg} kg</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button 
            type="button" 
            onClick={resetForm}
            className="reset-btn"
            disabled={loading}
          >
            🔄 Reset
          </button>
          
          <button 
            type="submit" 
            disabled={loading || items.length === 0 || !formData.customerName.trim() || !formData.area.trim()}
            className="submit-btn"
            style={{ backgroundColor: selectedTypeColor }}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating Order...
              </>
            ) : (
              "✅ Create Order"
            )}
          </button>
        </div>
      </form>

      {/* Order Summary */}
      {items.length > 0 && (
        <div className="order-summary">
          <h4>📋 Order Summary</h4>
          <div className="summary-details">
            <p><span>Customer:</span> {formData.customerName || "Not specified"}</p>
            <p><span>Type:</span> 
              <span style={{ color: TYPE_COLORS[formData.type], fontWeight: 600, marginLeft: '8px' }}>
                {formData.type === "Community-Women" ? "👩‍👩‍👧‍👧 " + formData.type : formData.type}
              </span>
            </p>
            <p><span>Area:</span> {formData.area || "Not specified"}</p>
            <p><span>Total Items:</span> {totalItems}</p>
            <p><span>Total Weight:</span> {totalKg} kg</p>
          </div>
        </div>
      )}
    </div>
  );
}