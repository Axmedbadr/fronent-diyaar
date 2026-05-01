import React, { useState, useEffect } from "react";
import { addOrder, getAreaStats } from "../api/orders";

const ORDER_TYPES = [
  "Individuals", "Shops", "Supermarkets",
  "Pre-Urban", "SOFHA Health Centers", "Community-Women",
];

const ITEMS = [
  { id: 1, name: "Mashaali kg" },
  { id: 2, name: "M.plus kg" },
  { id: 3, name: "Budo kg" },
  { id: 4, name: "Shuuro kg" },
  { id: 5, name: "Talbina kg" },
  { id: 6, name: "Budo special order kg" },
  { id: 7, name: "Shuuro special order kg" },
  { id: 8, name: "Mashaali cake mix powder kg" },
];

export default function OrderForm({ onOrderAdded }) {
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    type: "Individuals",
    area: "",
    orderDate: new Date().toISOString().split("T")[0],
  });
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({ itemName: "", quantity: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [frequentAreas, setFrequentAreas] = useState([]);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);

  useEffect(() => { fetchFrequentAreas(); }, []);

  const fetchFrequentAreas = async () => {
    try {
      const data = await getAreaStats();
      const valid = data
        .filter(s => s && typeof s._id === "string")
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(s => ({ name: s._id, count: s.count }));
      setFrequentAreas(valid);
    } catch {}
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "area") setShowAreaSuggestions(true);
    setError("");
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
      await addOrder({ ...formData, orderDate: new Date(formData.orderDate), items });
      setSuccess(true);
      setFormData({
        customerName: "", phoneNumber: "", type: "Individuals", area: "",
        orderDate: new Date().toISOString().split("T")[0],
      });
      setItems([]);
      fetchFrequentAreas();
      onOrderAdded?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (!currentItem.itemName) return setError("Select an item");
    if (currentItem.quantity <= 0) return setError("Quantity must be greater than 0");
    setItems(prev => [...prev, { itemName: currentItem.itemName, quantity: parseFloat(currentItem.quantity) }]);
    setCurrentItem({ itemName: "", quantity: 1 });
    setError("");
  };

  const removeItem = (index) => setItems(prev => prev.filter((_, i) => i !== index));
  const totalKg = items.reduce((sum, i) => sum + i.quantity, 0);
  const filteredAreas = frequentAreas.filter(a => a.name.toLowerCase().includes(formData.area.toLowerCase()));

  return (
    <div className="glass-card p-5 space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 pb-2 border-b border-white/5">
        <div className="w-6 h-6 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-sm">📦</div>
        <h2 className="text-sm font-bold text-slate-200 font-display">Add New Order</h2>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm">
          <span>✅</span> Order created successfully
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          <span>⚠️</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Date */}
        <div>
          <label className="block text-xs text-slate-500 mb-1 font-medium">Order Date</label>
          <input type="date" name="orderDate" value={formData.orderDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={handleChange} className="input-field" />
        </div>

        {/* Customer Name */}
        <div>
          <label className="block text-xs text-slate-500 mb-1 font-medium">Customer Name</label>
          <input type="text" name="customerName" placeholder="Full name"
            value={formData.customerName} onChange={handleChange} className="input-field" />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs text-slate-500 mb-1 font-medium">Phone Number</label>
          <input type="text" name="phoneNumber" placeholder="+252..."
            value={formData.phoneNumber} onChange={handleChange} className="input-field" />
        </div>

        {/* Area with suggestions */}
        <div className="relative">
          <label className="block text-xs text-slate-500 mb-1 font-medium">Area</label>
          <input type="text" name="area" placeholder="Delivery area"
            value={formData.area} onChange={handleChange}
            onFocus={() => setShowAreaSuggestions(true)}
            onBlur={() => setTimeout(() => setShowAreaSuggestions(false), 200)}
            className="input-field" />
          {showAreaSuggestions && filteredAreas.length > 0 && (
            <div className="absolute z-10 top-full mt-1 left-0 right-0 glass-card border border-white/10 rounded-xl overflow-hidden shadow-xl max-h-40 overflow-y-auto">
              {filteredAreas.map((a, i) => (
                <button type="button" key={i}
                  onMouseDown={() => { setFormData(p => ({ ...p, area: a.name })); setShowAreaSuggestions(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-brand-600/20 hover:text-brand-300 flex justify-between transition-colors">
                  <span>{a.name}</span>
                  <span className="text-slate-600 text-xs">{a.count} orders</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs text-slate-500 mb-1 font-medium">Order Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className="input-field">
            {ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Item adder */}
        <div className="bg-white/3 rounded-xl p-3 space-y-2 border border-white/5">
          <label className="block text-xs text-slate-500 font-medium">Add Items</label>
          <div className="flex gap-2">
            <select name="itemName" value={currentItem.itemName}
              onChange={e => setCurrentItem(p => ({ ...p, itemName: e.target.value }))}
              className="input-field flex-1 text-xs">
              <option value="">Select item…</option>
              {ITEMS.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
            </select>
            <input type="number" step="0.1" min="0.1" value={currentItem.quantity}
              onChange={e => setCurrentItem(p => ({ ...p, quantity: e.target.value }))}
              className="input-field w-20 text-xs" placeholder="kg" />
            <button type="button" onClick={addItem}
              className="shrink-0 bg-brand-600/20 hover:bg-brand-600/40 border border-brand-500/30 text-brand-400 rounded-xl px-3 py-2 text-xs font-medium transition-all">
              + Add
            </button>
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div className="space-y-1 pt-1">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-white/3 rounded-lg px-3 py-1.5 text-xs">
                  <span className="text-slate-300">{item.itemName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-brand-400 font-mono">{item.quantity} kg</span>
                    <button type="button" onClick={() => removeItem(i)}
                      className="text-slate-600 hover:text-red-400 transition-colors text-base leading-none">×</button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
                <span className="text-slate-500">Total weight</span>
                <span className="font-mono text-emerald-400 font-semibold">{totalKg.toFixed(1)} kg</span>
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></span>
              Saving…
            </span>
          ) : "Create Order"}
        </button>
      </form>
    </div>
  );
}
