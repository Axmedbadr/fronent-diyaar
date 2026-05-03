import React, { useState, useEffect, useRef, useCallback } from "react";
import { addOrder, getAreaStats, getOrders } from "../api/orders";
import { useTheme } from "./Layout";

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

const EMPTY_FORM = {
  customerName: "",
  phoneNumber:  "",
  type:         "Individuals",
  area:         "",
  orderDate:    new Date().toISOString().split("T")[0],
};

export default function OrderForm({ onOrderAdded }) {
  const { isDark } = useTheme();

  const [formData, setFormData]   = useState(EMPTY_FORM);
  const [items, setItems]         = useState([]);
  const [currentItem, setCurrentItem] = useState({ itemName: "", quantity: 1 });

  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);

  // ── Area suggestions ──────────────────────────────────────────────────────
  const [frequentAreas, setFrequentAreas]           = useState([]);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);

  // ── Phone / customer lookup ───────────────────────────────────────────────
  const [allOrders, setAllOrders]               = useState([]);          // cached orders
  const [phoneSuggestions, setPhoneSuggestions] = useState([]);          // dropdown list
  const [showPhoneDrop, setShowPhoneDrop]       = useState(false);
  const [matchedCustomer, setMatchedCustomer]   = useState(null);        // exact match info
  const phoneRef = useRef(null);

  // ── Load all orders once (for phone lookup) ───────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [orders, areaStats] = await Promise.all([getOrders(), getAreaStats()]);
        setAllOrders(orders);
        const valid = areaStats
          .filter(s => s && typeof s._id === "string")
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
          .map(s => ({ name: s._id, count: s.count }));
        setFrequentAreas(valid);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  // ── Build unique customer map from orders ─────────────────────────────────
  const customerMap = useCallback(() => {
    const map = new Map();
    allOrders.forEach(o => {
      if (!o.phoneNumber) return;
      if (!map.has(o.phoneNumber)) {
        map.set(o.phoneNumber, {
          phone:       o.phoneNumber,
          name:        o.customerName,
          area:        o.area || "",
          type:        o.type || "Individuals",
          orderCount:  0,
          lastDate:    o.orderDate,
        });
      }
      const c = map.get(o.phoneNumber);
      c.orderCount++;
      if (new Date(o.orderDate) > new Date(c.lastDate)) c.lastDate = o.orderDate;
    });
    return map;
  }, [allOrders]);

  // ── Phone input handler ────────────────────────────────────────────────────
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setFormData(p => ({ ...p, phoneNumber: value }));
    setMatchedCustomer(null);
    setError("");

    if (!value.trim()) {
      setPhoneSuggestions([]);
      setShowPhoneDrop(false);
      return;
    }

    const map = customerMap();
    const matches = [...map.values()].filter(c =>
      c.phone.includes(value) || c.name.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 6);

    setPhoneSuggestions(matches);
    setShowPhoneDrop(matches.length > 0);
  };

  // ── Select a customer from dropdown ──────────────────────────────────────
  const selectCustomer = (customer) => {
    setFormData(p => ({
      ...p,
      phoneNumber:  customer.phone,
      customerName: customer.name,
      area:         customer.area || p.area,
      type:         customer.type || p.type,
    }));
    setMatchedCustomer(customer);
    setPhoneSuggestions([]);
    setShowPhoneDrop(false);
  };

  // ── Generic field change ───────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (name === "area") setShowAreaSuggestions(true);
    setError("");
  };

  // ── Items ─────────────────────────────────────────────────────────────────
  const addItem = () => {
    if (!currentItem.itemName) return setError("Select an item");
    if (currentItem.quantity <= 0) return setError("Quantity must be > 0");
    setItems(p => [...p, { itemName: currentItem.itemName, quantity: parseFloat(currentItem.quantity) }]);
    setCurrentItem({ itemName: "", quantity: 1 });
    setError("");
  };

  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i));
  const totalKg = items.reduce((s, i) => s + i.quantity, 0);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.orderDate)            return setError("Date required");
    if (!formData.customerName.trim())  return setError("Customer name required");
    if (!formData.phoneNumber.trim())   return setError("Phone number required");
    if (!formData.area.trim())          return setError("Area required");
    if (items.length === 0)             return setError("Add at least one item");

    setLoading(true);
    setError("");
    try {
      await addOrder({ ...formData, orderDate: new Date(formData.orderDate), items });
      setSuccess(true);
      setFormData({ ...EMPTY_FORM, orderDate: new Date().toISOString().split("T")[0] });
      setItems([]);
      setMatchedCustomer(null);
      onOrderAdded?.();
      // refresh cached orders
      getOrders().then(setAllOrders).catch(() => {});
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Filtered area suggestions ─────────────────────────────────────────────
  const filteredAreas = frequentAreas.filter(a =>
    a.name.toLowerCase().includes(formData.area.toLowerCase())
  );

  // ── Styles ────────────────────────────────────────────────────────────────
  const cardBg   = isDark ? "bg-[#0c1525] border-white/5"   : "bg-white border-slate-200";
  const dropBg   = isDark ? "bg-[#0c1525] border-white/10"  : "bg-white border-slate-200 shadow-xl";
  const hoverRow = isDark ? "hover:bg-blue-600/10"           : "hover:bg-blue-50";
  const textSec  = isDark ? "text-slate-500"                 : "text-slate-400";

  return (
    <div className={`rounded-2xl border p-5 space-y-4 animate-fade-in ${cardBg}`}>

      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0" }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
             style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" }}>📦</div>
        <h2 className={`text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}
            style={{ fontFamily: "Syne, sans-serif" }}>Add New Order</h2>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-emerald-400 text-sm animate-fade-in"
             style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
          ✅ Order created successfully
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-red-400 text-sm"
             style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">

        {/* Date */}
        <div>
          <label className={`block text-xs font-medium mb-1 ${textSec}`}>Order Date</label>
          <input type="date" name="orderDate" value={formData.orderDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={handleChange} className="input-field" />
        </div>

        {/* ── Phone Number with autocomplete ── */}
        <div>
          <label className={`block text-xs font-medium mb-1 ${textSec}`}>Phone Number</label>
          <div className="relative">
            <input
              ref={phoneRef}
              type="text"
              name="phoneNumber"
              placeholder="Type phone or name to search…"
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              onFocus={() => phoneSuggestions.length > 0 && setShowPhoneDrop(true)}
              onBlur={() => setTimeout(() => setShowPhoneDrop(false), 180)}
              className="input-field pr-8"
              autoComplete="off"
            />
            {/* Search icon */}
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${textSec}`}>🔍</span>

            {/* Dropdown */}
            {showPhoneDrop && phoneSuggestions.length > 0 && (
              <div className={`absolute z-50 top-full mt-1 left-0 right-0 rounded-xl border overflow-hidden ${dropBg}`}>
                <div className={`px-3 py-1.5 text-xs font-semibold border-b ${textSec}`}
                     style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0" }}>
                  Registered customers
                </div>
                {phoneSuggestions.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => selectCustomer(c)}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors border-b last:border-0 ${hoverRow}`}
                    style={{ borderColor: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9" }}
                  >
                    {/* Avatar */}
                    <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                      {(c.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}>{c.name}</p>
                      <p className={`text-xs font-mono truncate ${textSec}`}>{c.phone}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-blue-400 font-semibold">{c.orderCount} order{c.orderCount !== 1 ? "s" : ""}</p>
                      <p className={`text-xs ${textSec}`}>{c.area}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Returning customer banner */}
          {matchedCustomer && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs animate-fade-in"
                 style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <span>⭐</span>
              <span className="text-blue-400 font-medium">
                Returning customer — {matchedCustomer.orderCount} previous order{matchedCustomer.orderCount !== 1 ? "s" : ""}
              </span>
              <button type="button" onClick={() => setMatchedCustomer(null)}
                className={`ml-auto ${textSec} hover:text-red-400 transition-colors`}>✕</button>
            </div>
          )}
        </div>

        {/* Customer Name */}
        <div>
          <label className={`block text-xs font-medium mb-1 ${textSec}`}>Customer Name</label>
          <input type="text" name="customerName" placeholder="Full name"
            value={formData.customerName} onChange={handleChange} className="input-field" />
        </div>

        {/* Area with suggestions */}
        <div className="relative">
          <label className={`block text-xs font-medium mb-1 ${textSec}`}>Area</label>
          <input type="text" name="area" placeholder="Delivery area"
            value={formData.area} onChange={handleChange}
            onFocus={() => setShowAreaSuggestions(true)}
            onBlur={() => setTimeout(() => setShowAreaSuggestions(false), 180)}
            className="input-field" />
          {showAreaSuggestions && filteredAreas.length > 0 && (
            <div className={`absolute z-40 top-full mt-1 left-0 right-0 rounded-xl border overflow-hidden max-h-40 overflow-y-auto ${dropBg}`}>
              {filteredAreas.map((a, i) => (
                <button type="button" key={i}
                  onMouseDown={() => { setFormData(p => ({ ...p, area: a.name })); setShowAreaSuggestions(false); }}
                  className={`w-full text-left px-3 py-2 text-xs flex justify-between transition-colors border-b last:border-0 ${hoverRow}`}
                  style={{ borderColor: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9" }}>
                  <span className={isDark ? "text-slate-300" : "text-slate-600"}>{a.name}</span>
                  <span className={textSec}>{a.count} orders</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type */}
        <div>
          <label className={`block text-xs font-medium mb-1 ${textSec}`}>Order Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className="input-field">
            {ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Item adder */}
        <div className="rounded-xl p-3 space-y-2"
             style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e2e8f0" }}>
          <label className={`block text-xs font-medium ${textSec}`}>Add Items</label>
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
              className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium transition-all"
              style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#3b82f6" }}>
              + Add
            </button>
          </div>

          {items.length > 0 && (
            <div className="space-y-1 pt-1">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs"
                     style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f1f5f9" }}>
                  <span className={isDark ? "text-slate-300" : "text-slate-600"}>{item.itemName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-mono font-semibold">{item.quantity} kg</span>
                    <button type="button" onClick={() => removeItem(i)}
                      className={`${textSec} hover:text-red-400 transition-colors text-base leading-none`}>×</button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1 border-t text-xs"
                   style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0" }}>
                <span className={textSec}>Total weight</span>
                <span className="font-mono text-emerald-400 font-semibold">{totalKg.toFixed(1)} kg</span>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </span>
          ) : "Create Order"}
        </button>

      </form>
    </div>
  );
}
