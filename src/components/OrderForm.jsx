import React, { useState, useEffect } from "react";
import { addOrder, getAreaStats } from "../api/orders";

const ORDER_TYPES = [
  "Individuals",
  "Shops",
  "Supermarkets",
  "Pre-Urban",
  "SOFHA Health Centers",
  "Community-Women"
];

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
    area: "",
    orderDate: new Date().toISOString().split("T")[0]
  });

  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    itemName: "",
    quantity: 1
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [frequentAreas, setFrequentAreas] = useState([]);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [areaError, setAreaError] = useState(false);

  useEffect(() => {
    fetchFrequentAreas();
  }, []);

  const fetchFrequentAreas = async () => {
    try {
      const areaStats = await getAreaStats();

      const validAreas = areaStats
        .filter(stat =>
          stat &&
          typeof stat._id === "string" &&
          typeof stat.count === "number"
        )
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(stat => ({
          name: stat._id,
          count: stat.count
        }));

      setFrequentAreas(validAreas);
    } catch (err) {
      console.error(err);
      setAreaError(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "area") {
      setShowAreaSuggestions(true);
    }

    setError("");
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
    if (!currentItem.itemName) return setError("Select item");
    if (currentItem.quantity <= 0) return setError("Quantity must be > 0");

    setItems([
      ...items,
      {
        itemName: currentItem.itemName,
        quantity: parseFloat(currentItem.quantity)
      }
    ]);

    setCurrentItem({ itemName: "", quantity: 1 });
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
      orderDate: new Date().toISOString().split("T")[0]
    });
    setItems([]);
    setError("");
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.orderDate) return setError("Date required");
    if (!formData.customerName.trim()) return setError("Customer name required");
    if (!formData.phoneNumber.trim()) return setError("Phone number required");
    if (!formData.area.trim()) return setError("Area required");
    if (items.length === 0) return setError("Add at least one item");

    setLoading(true);
    setError("");

    try {
      await addOrder({
        ...formData,
        orderDate: new Date(formData.orderDate), // ✅ fixed
        items
      });

      setSuccess(true);
      resetForm();
      fetchFrequentAreas();
      onOrderAdded && onOrderAdded();

    } catch (err) {
      console.error(err);
      setError("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const totalKg = items.reduce((sum, i) => sum + i.quantity, 0);

  const filteredAreas = frequentAreas.filter(a =>
    a.name.toLowerCase().includes(formData.area.toLowerCase())
  );

  return (
    <div className="order-form-container">
      <h2>📦 Add Order</h2>

      {success && <div className="success-message">✅ Order created</div>}
      {error && <div className="error-message">⚠️ {error}</div>}
      {areaError && <div className="error-message">⚠️ Area error</div>}

      <form onSubmit={handleSubmit}>

        {/* ✅ DATE */}
        <input
          type="date"
          name="orderDate"
          value={formData.orderDate}
          max={new Date().toISOString().split("T")[0]}
          onChange={handleChange}
        />

        <input
          type="text"
          name="customerName"
          placeholder="Customer name"
          value={formData.customerName}
          onChange={handleChange}
        />

        <input
          type="text"
          name="phoneNumber"
          placeholder="Phone number"
          value={formData.phoneNumber}
          onChange={handleChange}
        />

        <input
          type="text"
          name="area"
          placeholder="Area"
          value={formData.area}
          onChange={handleChange}
          onFocus={() => setShowAreaSuggestions(true)}
        />

        {showAreaSuggestions && filteredAreas.length > 0 && (
          <div className="area-suggestions">
            {filteredAreas.map((a, i) => (
              <div key={i} onMouseDown={() => handleAreaSelect(a.name)}>
                {a.name} ({a.count})
              </div>
            ))}
          </div>
        )}

        <select name="type" value={formData.type} onChange={handleChange}>
          {ORDER_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* ITEMS */}
        <select
          name="itemName"
          value={currentItem.itemName}
          onChange={handleItemChange}
        >
          <option value="">Select item</option>
          {ITEMS.map(i => (
            <option key={i.id} value={i.name}>{i.name}</option>
          ))}
        </select>

        <input
          type="number"
          step="0.1"
          name="quantity"
          value={currentItem.quantity}
          onChange={handleItemChange}
        />

        <button type="button" onClick={addItem}>Add Item</button>

        {items.map((item, i) => (
          <div key={i}>
            {item.itemName} - {item.quantity} kg
            <button type="button" onClick={() => removeItem(i)}>x</button>
          </div>
        ))}

        <p>Total: {totalKg} kg</p>

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Create Order"}
        </button>
      </form>
    </div>
  );
}