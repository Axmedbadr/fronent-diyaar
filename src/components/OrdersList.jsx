import React, { useState, useEffect } from "react";
import { getOrders, deleteOrder } from "../api/orders";
import ExcelJS from "exceljs";

const TYPE_BADGE = {
  "Individuals":          "bg-brand-600/20 text-brand-400 border-brand-500/30",
  "Shops":                "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
  "Supermarkets":         "bg-violet-600/20 text-violet-400 border-violet-500/30",
  "Pre-Urban":            "bg-amber-600/20 text-amber-400 border-amber-500/30",
  "SOFHA Health Centers": "bg-pink-600/20 text-pink-400 border-pink-500/30",
  "Community-Women":      "bg-cyan-600/20 text-cyan-400 border-cyan-500/30",
};

export default function OrdersList({ refresh }) {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [filters, setFilters] = useState({ type: "", startDate: "", endDate: "" });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders(filters);
      const sorted = [...data].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      setOrders(sorted);
      setFilteredOrders(sorted);
      setError("");
    } catch {
      setError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [refresh, filters]);

  useEffect(() => {
    if (!searchTerm.trim()) return setFilteredOrders(orders);
    const q = searchTerm.toLowerCase();
    setFilteredOrders(orders.filter(o =>
      o.customerName.toLowerCase().includes(q) ||
      (o.phoneNumber && o.phoneNumber.includes(q)) ||
      o.type.toLowerCase().includes(q) ||
      o.items?.some(i => i.itemName.toLowerCase().includes(q))
    ));
  }, [searchTerm, orders]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    try { await deleteOrder(id); fetchOrders(); } catch { setError("Failed to delete order"); }
  };

  const calcKg = (items) => items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;

  const exportToExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Orders");
    const headers = ["Date", "Customer Name", "Phone", "Type", "Items", "Total KG"];
    const hRow = ws.addRow(headers);
    hRow.eachCell(c => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1e293b" } };
      c.font = { color: { argb: "FFe2e8f0" }, bold: true };
    });
    ws.columns = [{ width: 15 }, { width: 25 }, { width: 15 }, { width: 20 }, { width: 45 }, { width: 12 }];
    filteredOrders.forEach(o => ws.addRow([
      new Date(o.orderDate).toLocaleDateString(),
      o.customerName,
      o.phoneNumber || "-",
      o.type,
      o.items?.map(i => `${i.itemName}: ${i.quantity}kg`).join(", ") || "No items",
      calcKg(o.items),
    ]));
    const buf = await wb.xlsx.writeBuffer();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    a.download = `orders_${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
  };

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-5 border-b border-white/5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-sm">📋</div>
            <h2 className="text-sm font-bold text-slate-200 font-display">
              Orders <span className="text-slate-500 font-normal">({filteredOrders.length})</span>
            </h2>
          </div>
          <button onClick={exportToExcel} className="btn-ghost text-xs flex items-center gap-1.5">
            <span>📊</span> Export Excel
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
            <input type="text" placeholder="Search customer, phone, type, item…"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="input-field pl-8 text-xs h-9" />
          </div>
          <select name="type" value={filters.type}
            onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
            className="input-field w-auto text-xs h-9">
            <option value="">All Types</option>
            {["Individuals","Shops","Supermarkets","Pre-Urban","SOFHA Health Centers","Community-Women"].map(t =>
              <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="date" value={filters.startDate}
            onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))}
            className="input-field w-auto text-xs h-9" />
          <input type="date" value={filters.endDate}
            onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))}
            className="input-field w-auto text-xs h-9" />
          <button onClick={() => { setFilters({ type: "", startDate: "", endDate: "" }); setSearchTerm(""); }}
            className="btn-ghost text-xs h-9 px-3">
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {loading && orders.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-600">
          <span className="text-3xl">📭</span>
          <p className="text-sm">{searchTerm ? "No matching orders" : "No orders found"}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8"></th>
                <th>Date</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Items</th>
                <th>Total KG</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <React.Fragment key={order._id}>
                  <tr className={expandedOrder === order._id ? "bg-brand-600/5" : ""}>
                    <td>
                      <button onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                        className="text-slate-600 hover:text-brand-400 transition-colors text-xs">
                        {expandedOrder === order._id ? "▼" : "▶"}
                      </button>
                    </td>
                    <td className="font-mono text-xs text-slate-400">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="font-medium text-slate-200">{order.customerName}</td>
                    <td className="font-mono text-xs text-slate-400">{order.phoneNumber || "—"}</td>
                    <td>
                      <span className={`badge border ${TYPE_BADGE[order.type] || "bg-slate-600/20 text-slate-400 border-slate-500/30"}`}>
                        {order.type}
                      </span>
                    </td>
                    <td className="text-slate-400 text-xs">
                      {order.items?.length > 0 ? `${order.items.length} item${order.items.length > 1 ? "s" : ""}` : "—"}
                    </td>
                    <td className="font-mono text-xs text-emerald-400 font-semibold">
                      {calcKg(order.items)} kg
                    </td>
                    <td>
                      <button onClick={() => handleDelete(order._id)}
                        className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded">
                        🗑️
                      </button>
                    </td>
                  </tr>

                  {expandedOrder === order._id && order.items?.length > 0 && (
                    <tr>
                      <td colSpan="8" className="bg-surface-900 px-10 py-3">
                        <div className="rounded-xl border border-white/5 overflow-hidden">
                          <table className="data-table text-xs">
                            <thead>
                              <tr>
                                <th>Item Name</th>
                                <th>Quantity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.itemName}</td>
                                  <td className="font-mono text-emerald-400">{item.quantity} kg</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
