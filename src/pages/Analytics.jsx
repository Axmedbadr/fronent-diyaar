import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";
import { getStats, getOrders, getPopularItems, getAreaStats } from "../api/orders";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ─── Chart theme ─────────────────────────────────────────────────────────────
const COLORS = {
  brand:   "#3b82f6",
  emerald: "#10b981",
  violet:  "#8b5cf6",
  amber:   "#f59e0b",
  pink:    "#ec4899",
  cyan:    "#06b6d4",
};

const TYPE_COLORS = [
  COLORS.brand, COLORS.emerald, COLORS.violet,
  COLORS.amber,  COLORS.pink,   COLORS.cyan,
];

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: "#94a3b8", font: { family: "DM Sans", size: 11 }, boxWidth: 10, padding: 12 },
    },
    tooltip: {
      backgroundColor: "#1e293b",
      borderColor: "rgba(255,255,255,0.08)",
      borderWidth: 1,
      titleColor: "#e2e8f0",
      bodyColor: "#94a3b8",
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { color: "rgba(255,255,255,0.04)" },
      ticks: { color: "#64748b", font: { family: "DM Sans", size: 11 } },
    },
    y: {
      grid: { color: "rgba(255,255,255,0.04)" },
      ticks: { color: "#64748b", font: { family: "DM Sans", size: 11 } },
    },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function groupOrdersByMonth(orders) {
  const map = {};
  orders.forEach(o => {
    const d = new Date(o.orderDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).sort().slice(-12); // last 12 months
}

function analyzeCustomers(orders) {
  const map = new Map();
  [...orders].sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate)).forEach(o => {
    if (!o.phoneNumber) return;
    if (!map.has(o.phoneNumber)) {
      map.set(o.phoneNumber, { phone: o.phoneNumber, name: o.customerName, count: 0, totalKg: 0, first: o.orderDate, last: o.orderDate });
    }
    const c = map.get(o.phoneNumber);
    c.count++;
    c.last = o.orderDate;
    c.totalKg += o.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;
  });
  return map;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color = "brand" }) {
  const colors = {
    brand:   "from-brand-600/20   border-brand-500/20   text-brand-400",
    emerald: "from-emerald-600/20 border-emerald-500/20 text-emerald-400",
    violet:  "from-violet-600/20  border-violet-500/20  text-violet-400",
    amber:   "from-amber-600/20   border-amber-500/20   text-amber-400",
    pink:    "from-pink-600/20    border-pink-500/20    text-pink-400",
    cyan:    "from-cyan-600/20    border-cyan-500/20    text-cyan-400",
  }[color];

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colors.split(" ")[0]} to-transparent border ${colors.split(" ")[1]} p-5 flex flex-col gap-1`}>
      <div className="text-2xl mb-1">{icon}</div>
      <p className={`text-2xl font-bold font-display ${colors.split(" ")[2]}`}>{value}</p>
      <p className="text-sm font-medium text-slate-300">{label}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, desc }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-5 rounded-full bg-brand-500"></div>
        <h3 className="text-base font-bold text-slate-200 font-display">{title}</h3>
      </div>
      {desc && <p className="text-xs text-slate-500 mt-0.5 ml-3.5">{desc}</p>}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Analytics() {
  const [stats, setStats]               = useState([]);
  const [orders, setOrders]             = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [areaStats, setAreaStats]       = useState([]);
  const [customerMap, setCustomerMap]   = useState(new Map());
  const [loading, setLoading]           = useState(true);
  const [searchPhone, setSearchPhone]   = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [showLoyalList, setShowLoyalList] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [s, o, p, a] = await Promise.all([getStats(), getOrders(), getPopularItems(), getAreaStats()]);
      setStats(s);
      setOrders(o);
      setPopularItems(p);
      setAreaStats(a);
      setCustomerMap(analyzeCustomers(o));
    } catch (e) {
      console.error("Analytics fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm">Loading analytics…</p>
        </div>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const totalOrders       = stats.reduce((s, c) => s + c.count, 0);
  const totalKg           = orders.reduce((s, o) => s + (o.items?.reduce((a, i) => a + (i.quantity || 0), 0) || 0), 0);
  const phoneCount        = orders.filter(o => o.phoneNumber).length;
  const loyalList         = Array.from(customerMap.values()).filter(c => c.count > 1).sort((a, b) => b.count - a.count);
  const loyaltyRate       = customerMap.size > 0 ? ((loyalList.length / customerMap.size) * 100).toFixed(1) : "0.0";
  const monthlyData       = groupOrdersByMonth(orders);

  // ── Bar Chart: Orders by type ───────────────────────────────────────────────
  const barData = {
    labels: stats.map(s => s._id),
    datasets: [{
      label: "Orders",
      data: stats.map(s => s.count),
      backgroundColor: TYPE_COLORS.map(c => c + "99"),
      borderColor: TYPE_COLORS,
      borderWidth: 1.5,
      borderRadius: 6,
    }],
  };

  // ── Line Chart: Orders over time ────────────────────────────────────────────
  const lineData = {
    labels: monthlyData.map(([k]) => {
      const [y, m] = k.split("-");
      return new Date(y, m - 1).toLocaleString("default", { month: "short", year: "2-digit" });
    }),
    datasets: [{
      label: "Monthly Orders",
      data: monthlyData.map(([, v]) => v),
      borderColor: COLORS.brand,
      backgroundColor: "rgba(59,130,246,0.08)",
      borderWidth: 2,
      pointBackgroundColor: COLORS.brand,
      pointRadius: 4,
      tension: 0.4,
      fill: true,
    }],
  };

  // ── Pie Chart: Order type distribution ─────────────────────────────────────
  const pieData = {
    labels: stats.map(s => s._id),
    datasets: [{
      data: stats.map(s => s.count),
      backgroundColor: TYPE_COLORS.map(c => c + "cc"),
      borderColor: TYPE_COLORS,
      borderWidth: 1.5,
    }],
  };

  // ── Bar Chart: Top items by KG ──────────────────────────────────────────────
  const topItemsData = {
    labels: popularItems.slice(0, 8).map(i => i._id),
    datasets: [{
      label: "Total KG",
      data: popularItems.slice(0, 8).map(i => i.totalQuantity),
      backgroundColor: "rgba(16,185,129,0.3)",
      borderColor: COLORS.emerald,
      borderWidth: 1.5,
      borderRadius: 6,
    }],
  };

  // ── Pie: Area distribution ──────────────────────────────────────────────────
  const topAreas = [...areaStats].sort((a, b) => b.count - a.count).slice(0, 8);
  const areaPieData = {
    labels: topAreas.map(a => a._id),
    datasets: [{
      data: topAreas.map(a => a.count),
      backgroundColor: TYPE_COLORS.slice(0, topAreas.length).map(c => c + "cc"),
      borderColor: TYPE_COLORS.slice(0, topAreas.length),
      borderWidth: 1.5,
    }],
  };

  const noScaleOptions = { ...chartDefaults, scales: undefined };

  // ── Search handler ──────────────────────────────────────────────────────────
  const handleSearch = () => {
    if (!searchPhone.trim()) return setSearchResult(null);
    const found = loyalList.find(c => c.phone.includes(searchPhone));
    setSearchResult(found || { notFound: true });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page title */}
      <div>
        <h2 className="text-2xl font-bold text-white font-display">Analytics Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">Real-time insights from your order data</p>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon="📦" label="Total Orders"     value={totalOrders}              color="brand" />
        <KpiCard icon="⚖️" label="Total KG"         value={`${totalKg.toFixed(0)}`}  color="emerald" sub="across all orders" />
        <KpiCard icon="📱" label="With Phone"       value={phoneCount}               color="violet" sub={`${((phoneCount/totalOrders)*100).toFixed(1)}% of orders`} />
        <KpiCard icon="👥" label="Unique Customers" value={customerMap.size}         color="cyan" />
        <KpiCard icon="⭐" label="Loyal Customers"  value={loyalList.length}         color="amber" sub="2+ orders" />
        <KpiCard icon="📊" label="Loyalty Rate"     value={`${loyaltyRate}%`}        color="pink" sub={`${loyalList.length} of ${customerMap.size}`} />
      </div>

      {/* ── Charts Row 1 ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar: Orders by type */}
        <div className="lg:col-span-2 glass-card p-5">
          <SectionHeader title="Orders by Category" desc="Count of orders per customer type" />
          <div className="h-60">
            <Bar data={barData} options={chartDefaults} />
          </div>
        </div>

        {/* Pie: Type distribution */}
        <div className="glass-card p-5">
          <SectionHeader title="Type Distribution" desc="Percentage breakdown" />
          <div className="h-60">
            <Pie data={pieData} options={noScaleOptions} />
          </div>
        </div>
      </div>

      {/* ── Charts Row 2 ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line: Orders over time */}
        <div className="lg:col-span-2 glass-card p-5">
          <SectionHeader title="Monthly Trend" desc="Order volume over the last 12 months" />
          <div className="h-60">
            <Line data={lineData} options={chartDefaults} />
          </div>
        </div>

        {/* Pie: Area distribution */}
        <div className="glass-card p-5">
          <SectionHeader title="Top Delivery Areas" desc="By order count" />
          <div className="h-60">
            <Pie data={areaPieData} options={noScaleOptions} />
          </div>
        </div>
      </div>

      {/* ── Popular Items Bar ────────────────────────────────────────────────── */}
      <div className="glass-card p-5">
        <SectionHeader title="Popular Items" desc="Total KG ordered per product (top 8)" />
        <div className="h-56">
          <Bar data={topItemsData} options={{ ...chartDefaults, indexAxis: "y" }} />
        </div>
      </div>

      {/* ── Customer Analysis ─────────────────────────────────────────────────── */}
      <div className="glass-card p-5 space-y-4">
        <SectionHeader title="Customer Analysis" desc="Loyal customer insights and phone lookup" />

        {/* Search by phone */}
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search loyal customer by phone…"
            value={searchPhone}
            onChange={e => setSearchPhone(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className="input-field flex-1 min-w-48"
          />
          <button onClick={handleSearch} className="btn-primary px-5">🔍 Search</button>
          {searchPhone && (
            <button onClick={() => { setSearchPhone(""); setSearchResult(null); }} className="btn-ghost">Clear</button>
          )}
        </div>

        {searchResult && (
          <div className={`rounded-xl border px-5 py-4 text-sm ${searchResult.notFound
            ? "bg-red-500/10 border-red-500/20 text-red-400"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
          }`}>
            {searchResult.notFound ? (
              <p>❌ No loyal customer found with that phone number.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div><span className="text-slate-500 text-xs">Name</span><br /><strong>{searchResult.name}</strong></div>
                <div><span className="text-slate-500 text-xs">Phone</span><br /><strong>{searchResult.phone}</strong></div>
                <div><span className="text-slate-500 text-xs">Total Orders</span><br /><strong>{searchResult.count}</strong></div>
                <div><span className="text-slate-500 text-xs">Total KG</span><br /><strong>{searchResult.totalKg.toFixed(1)} kg</strong></div>
                <div><span className="text-slate-500 text-xs">First Order</span><br /><strong>{new Date(searchResult.first).toLocaleDateString()}</strong></div>
                <div><span className="text-slate-500 text-xs">Last Order</span><br /><strong>{new Date(searchResult.last).toLocaleDateString()}</strong></div>
              </div>
            )}
          </div>
        )}

        {/* Loyal customers toggle */}
        <button
          onClick={() => setShowLoyalList(p => !p)}
          className="btn-ghost text-sm flex items-center gap-2"
        >
          <span>⭐</span>
          {showLoyalList ? "Hide" : "Show"} Loyal Customers ({loyalList.length})
          <span className="ml-auto text-xs">{showLoyalList ? "▲" : "▼"}</span>
        </button>

        {showLoyalList && (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Total KG</th>
                  <th>First Order</th>
                  <th>Last Order</th>
                </tr>
              </thead>
              <tbody>
                {loyalList.map((c, i) => (
                  <tr key={i}>
                    <td className="font-medium text-slate-200">{c.name}</td>
                    <td className="font-mono text-xs text-slate-400">📞 {c.phone}</td>
                    <td>
                      <span className="badge bg-brand-600/20 text-brand-400 border border-brand-500/30">{c.count}</span>
                    </td>
                    <td className="font-mono text-xs text-emerald-400">{c.totalKg.toFixed(1)} kg</td>
                    <td className="text-xs text-slate-500">{new Date(c.first).toLocaleDateString()}</td>
                    <td className="text-xs text-slate-500">{new Date(c.last).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Popular Items Table ───────────────────────────────────────────────── */}
      <div className="glass-card p-5 space-y-4">
        <SectionHeader title="Items Breakdown" desc="Full product statistics with KG totals and order counts" />
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Item</th>
                <th>Total KG</th>
                <th>Orders</th>
                <th>Avg / Order</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {popularItems.map((item, i) => (
                <tr key={i}>
                  <td>
                    <span className="font-mono text-xs text-slate-600 font-semibold">#{i + 1}</span>
                  </td>
                  <td className="font-medium text-slate-200">{item._id}</td>
                  <td className="font-mono text-xs text-emerald-400">{item.totalQuantity} kg</td>
                  <td className="text-slate-400 text-xs">{item.numberOfOrders}</td>
                  <td className="font-mono text-xs text-slate-400">{(item.totalQuantity / item.numberOfOrders).toFixed(1)} kg</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(item.totalQuantity / totalKg * 100).toFixed(1)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-slate-500 w-10">
                        {(item.totalQuantity / totalKg * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
