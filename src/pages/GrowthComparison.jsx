import React, { useState, useEffect, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { getOrders } from "../api/orders";
import { useTheme } from "../components/Layout";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const startOf = {
  week:  (d) => { const r = new Date(d); r.setDate(r.getDate() - r.getDay()); r.setHours(0,0,0,0); return r; },
  month: (d) => new Date(d.getFullYear(), d.getMonth(), 1),
  year:  (d) => new Date(d.getFullYear(), 0, 1),
};

function ordersInRange(orders, from, to) {
  const f = new Date(from); f.setHours(0,0,0,0);
  const t = new Date(to);   t.setHours(23,59,59,999);
  return orders.filter(o => { const d = new Date(o.orderDate); return d >= f && d <= t; });
}

function kgOf(orders) {
  return orders.reduce((s, o) => s + (o.items?.reduce((a, i) => a + (i.quantity || 0), 0) || 0), 0);
}

function pctChange(cur, prev) {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
}

function fmt(n) {
  if (typeof n !== "number" || isNaN(n)) return "0";
  return Number.isInteger(n) ? n : n.toFixed(1);
}

function toInputDate(d) { return d.toISOString().split("T")[0]; }

function daysBetween(a, b) {
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000) + 1);
}

function dailyBuckets(orders, from, to, metric) {
  const days = daysBetween(from, to);
  const labels  = [];
  const buckets = new Array(days).fill(0);
  const base = new Date(from); base.setHours(0,0,0,0);
  for (let i = 0; i < days; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }
  orders.forEach(o => {
    const d = new Date(o.orderDate); d.setHours(0,0,0,0);
    const idx = Math.round((d - base) / 86400000);
    if (idx >= 0 && idx < days) {
      buckets[idx] += metric === "orders"
        ? 1
        : (o.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0);
    }
  });
  return { labels, buckets };
}

// ─── Trend Badge ──────────────────────────────────────────────────────────────
function TrendBadge({ pct, isDark }) {
  const up = pct > 0, zero = pct === 0;
  const color  = zero ? isDark ? "rgba(100,116,139,0.15)" : "#f1f5f9" : up ? "rgba(16,185,129,0.12)"  : "rgba(239,68,68,0.12)";
  const border = zero ? "rgba(100,116,139,0.3)" : up ? "rgba(16,185,129,0.3)"  : "rgba(239,68,68,0.3)";
  const text   = zero ? "#94a3b8" : up ? "#10b981" : "#ef4444";
  return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: color, border: `1px solid ${border}`, color: text }}>
      {zero ? "→" : up ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

// ─── Compare Card ─────────────────────────────────────────────────────────────
function CompareCard({ label, current, previous, unit = "", subLabel, pct, color, isDark }) {
  const p = {
    blue:    { bg: isDark ? "rgba(59,130,246,0.1)"  : "#eff6ff", border: isDark ? "rgba(59,130,246,0.2)"  : "#bfdbfe", text: "#3b82f6" },
    emerald: { bg: isDark ? "rgba(16,185,129,0.1)"  : "#f0fdf4", border: isDark ? "rgba(16,185,129,0.2)"  : "#bbf7d0", text: "#10b981" },
    violet:  { bg: isDark ? "rgba(139,92,246,0.1)"  : "#f5f3ff", border: isDark ? "rgba(139,92,246,0.2)"  : "#ddd6fe", text: "#8b5cf6" },
    amber:   { bg: isDark ? "rgba(245,158,11,0.1)"  : "#fffbeb", border: isDark ? "rgba(245,158,11,0.2)"  : "#fde68a", text: "#f59e0b" },
  }[color];
  return (
    <div className="rounded-2xl p-5 space-y-3 transition-all duration-300 hover:scale-[1.02]"
         style={{ background: p.bg, border: `1px solid ${p.border}` }}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
        <TrendBadge pct={pct} isDark={isDark} />
      </div>
      <div>
        <p className="text-3xl font-bold" style={{ color: p.text, fontFamily: "Syne, sans-serif" }}>
          {fmt(current)}<span className="text-lg ml-1">{unit}</span>
        </p>
        <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          vs <span className="font-semibold">{fmt(previous)}{unit}</span> {subLabel}
        </p>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-200"}`}>
        <div className="h-full rounded-full transition-all duration-700"
             style={{ width: `${Math.min(100, (current / (Math.max(current, previous) || 1)) * 100)}%`, background: p.text }} />
      </div>
    </div>
  );
}

// ─── Chart Options ────────────────────────────────────────────────────────────
const makeChartOpts = (isDark) => ({
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: isDark ? "#94a3b8" : "#475569", font: { family: "DM Sans", size: 11 }, boxWidth: 10, padding: 12 } },
    tooltip: { backgroundColor: isDark ? "#1e293b" : "#fff", borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0", borderWidth: 1, titleColor: isDark ? "#e2e8f0" : "#1e293b", bodyColor: isDark ? "#94a3b8" : "#64748b", padding: 10, cornerRadius: 8 },
  },
  scales: {
    x: { grid: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }, ticks: { color: isDark ? "#64748b" : "#94a3b8", font: { family: "DM Sans", size: 10 }, maxRotation: 45 } },
    y: { grid: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }, ticks: { color: isDark ? "#64748b" : "#94a3b8", font: { family: "DM Sans", size: 11 } }, beginAtZero: true },
  },
});

// ─── Date Range Picker ────────────────────────────────────────────────────────
function DateRangePicker({ label, color, from, to, onFrom, onTo, count, kg, isDark }) {
  const c = {
    blue:   { accent: "#3b82f6", bg: isDark ? "rgba(59,130,246,0.08)"  : "#eff6ff", border: isDark ? "rgba(59,130,246,0.2)"  : "#bfdbfe" },
    violet: { accent: "#8b5cf6", bg: isDark ? "rgba(139,92,246,0.08)"  : "#f5f3ff", border: isDark ? "rgba(139,92,246,0.2)"  : "#ddd6fe" },
  }[color];
  const today = toInputDate(new Date());
  return (
    <div className="rounded-2xl p-4 space-y-3 flex-1 min-w-60" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.accent }} />
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: c.accent }}>{label}</p>
        </div>
        <div className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          {daysBetween(from, to)} days
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={`block text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>From</label>
          <input type="date" value={from} max={to}
            onChange={e => onFrom(e.target.value)} className="input-field text-xs h-8 px-2" />
        </div>
        <div>
          <label className={`block text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>To</label>
          <input type="date" value={to} min={from} max={today}
            onChange={e => onTo(e.target.value)} className="input-field text-xs h-8 px-2" />
        </div>
      </div>

      {/* Mini summary */}
      <div className="flex items-center gap-3 pt-1 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0" }}>
        <div className="text-center flex-1">
          <p className="text-lg font-bold" style={{ color: c.accent, fontFamily: "Syne, sans-serif" }}>{count}</p>
          <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>orders</p>
        </div>
        <div className={`w-px h-8 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
        <div className="text-center flex-1">
          <p className="text-lg font-bold text-emerald-400" style={{ fontFamily: "Syne, sans-serif" }}>{kg.toFixed(0)}</p>
          <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>kg</p>
        </div>
      </div>
    </div>
  );
}

// ─── Preset Button ────────────────────────────────────────────────────────────
function PresetBtn({ label, active, onClick, isDark }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
        ${active
          ? "bg-blue-600 text-white shadow-sm"
          : isDark
            ? "text-slate-400 hover:text-white hover:bg-white/10 border border-white/10"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200"}`}>
      {label}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GrowthComparison() {
  const { isDark } = useTheme();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric]   = useState("orders");
  const [activePreset, setActivePreset] = useState("this-vs-last-month");

  const now = new Date();

  // Default: this month vs last month
  const [rangeA, setRangeA] = useState({
    from: toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to:   toInputDate(now),
  });
  const [rangeB, setRangeB] = useState({
    from: toInputDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    to:   toInputDate(new Date(now.getFullYear(), now.getMonth(), 0)),
  });

  useEffect(() => {
    getOrders().then(setOrders).catch(console.error).finally(() => setLoading(false));
  }, []);

  // ── Presets ──────────────────────────────────────────────────────────────
  const PRESETS = [
    {
      id: "this-vs-last-week", label: "Week vs Week",
      apply: () => {
        const ts = startOf.week(now);
        const ls = new Date(ts.getTime() - 7 * 86400000);
        const le = new Date(ts.getTime() - 86400000);
        setRangeA({ from: toInputDate(ts), to: toInputDate(now) });
        setRangeB({ from: toInputDate(ls), to: toInputDate(le) });
      },
    },
    {
      id: "this-vs-last-month", label: "Month vs Month",
      apply: () => {
        setRangeA({ from: toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: toInputDate(now) });
        setRangeB({ from: toInputDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: toInputDate(new Date(now.getFullYear(), now.getMonth(), 0)) });
      },
    },
    {
      id: "this-vs-last-quarter", label: "Quarter vs Quarter",
      apply: () => {
        const q = Math.floor(now.getMonth() / 3);
        setRangeA({ from: toInputDate(new Date(now.getFullYear(), q * 3, 1)), to: toInputDate(now) });
        setRangeB({ from: toInputDate(new Date(now.getFullYear(), (q - 1) * 3, 1)), to: toInputDate(new Date(now.getFullYear(), q * 3, 0)) });
      },
    },
    {
      id: "this-vs-last-year", label: "Year vs Year",
      apply: () => {
        setRangeA({ from: toInputDate(new Date(now.getFullYear(), 0, 1)), to: toInputDate(now) });
        setRangeB({ from: toInputDate(new Date(now.getFullYear() - 1, 0, 1)), to: toInputDate(new Date(now.getFullYear() - 1, 11, 31)) });
      },
    },
    {
      id: "last-7", label: "Last 7 days",
      apply: () => {
        const aS = new Date(now.getTime() - 6 * 86400000);
        const bE = new Date(aS.getTime() - 86400000);
        const bS = new Date(bE.getTime() - 6 * 86400000);
        setRangeA({ from: toInputDate(aS), to: toInputDate(now) });
        setRangeB({ from: toInputDate(bS), to: toInputDate(bE) });
      },
    },
    {
      id: "last-30", label: "Last 30 days",
      apply: () => {
        const aS = new Date(now.getTime() - 29 * 86400000);
        const bE = new Date(aS.getTime() - 86400000);
        const bS = new Date(bE.getTime() - 29 * 86400000);
        setRangeA({ from: toInputDate(aS), to: toInputDate(now) });
        setRangeB({ from: toInputDate(bS), to: toInputDate(bE) });
      },
    },
    { id: "custom", label: "✏️ Custom", apply: () => {} },
  ];

  const applyPreset = (p) => { setActivePreset(p.id); p.apply(); };

  // ── Sliced data ───────────────────────────────────────────────────────────
  const aOrders = useMemo(() => ordersInRange(orders, rangeA.from, rangeA.to), [orders, rangeA]);
  const bOrders = useMemo(() => ordersInRange(orders, rangeB.from, rangeB.to), [orders, rangeB]);
  const aKg     = useMemo(() => kgOf(aOrders), [aOrders]);
  const bKg     = useMemo(() => kgOf(bOrders), [bOrders]);

  const ordersChange = pctChange(aOrders.length, bOrders.length);
  const kgChange     = pctChange(aKg, bKg);

  // ── Bar buckets (cap display labels to 31 to avoid crowding) ─────────────
  const { labels: aLabels, buckets: aBuckets } = useMemo(
    () => dailyBuckets(aOrders, rangeA.from, rangeA.to, metric), [aOrders, rangeA, metric]
  );
  const { buckets: bBuckets } = useMemo(
    () => dailyBuckets(bOrders, rangeB.from, rangeB.to, metric), [bOrders, rangeB, metric]
  );

  const step = Math.ceil(aLabels.length / 31);
  const barLabels  = aLabels.filter((_, i) => i % step === 0);
  const barA       = aBuckets.filter((_, i) => i % step === 0);
  const barB       = bBuckets.filter((_, i) => i % step === 0);

  // ── 12-month trend ────────────────────────────────────────────────────────
  const trend12 = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d   = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const os  = ordersInRange(orders, toInputDate(d), toInputDate(end));
      return { label: d.toLocaleString("default", { month: "short", year: "2-digit" }), value: metric === "orders" ? os.length : kgOf(os) };
    });
  }, [orders, metric]);

  // ── Type comparison ───────────────────────────────────────────────────────
  const typeComp = useMemo(() => {
    const types = [...new Set(orders.map(o => o.type))].filter(Boolean);
    return types.map(type => ({
      type,
      a: aOrders.filter(o => o.type === type).length,
      b: bOrders.filter(o => o.type === type).length,
      pct: pctChange(aOrders.filter(o => o.type === type).length, bOrders.filter(o => o.type === type).length),
    })).sort((x, y) => y.a - x.a);
  }, [aOrders, bOrders, orders]);

  const chartOpts = makeChartOpts(isDark);
  const textPri   = isDark ? "text-white"     : "text-slate-800";
  const textSec   = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg    = isDark ? "bg-[#0c1525] border-white/5" : "bg-white border-slate-200 shadow-sm";

  const barData = {
    labels: barLabels,
    datasets: [
      { label: `Range A`, data: barA, backgroundColor: "rgba(59,130,246,0.7)",  borderColor: "#3b82f6", borderWidth: 1.5, borderRadius: 4 },
      { label: `Range B`, data: barB, backgroundColor: "rgba(139,92,246,0.45)", borderColor: "#8b5cf6", borderWidth: 1.5, borderRadius: 4 },
    ],
  };

  const lineData = {
    labels: trend12.map(d => d.label),
    datasets: [{
      label: metric === "orders" ? "Orders / month" : "KG / month",
      data: trend12.map(d => d.value),
      borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.08)",
      borderWidth: 2, pointBackgroundColor: "#3b82f6", pointRadius: 4, tension: 0.4, fill: true,
    }],
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className={`text-sm ${textSec}`}>Loading comparison data…</p>
      </div>
    </div>
  );

  const growing  = ordersChange > 5;
  const declining = ordersChange < -5;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${textPri}`} style={{ fontFamily: "Syne, sans-serif" }}>Growth & Comparison</h2>
          <p className={`text-sm mt-0.5 ${textSec}`}>Compare any two date ranges to measure progress</p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9" }}>
          {["orders", "kg"].map(m => (
            <button key={m} onClick={() => setMetric(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all
                ${metric === m ? "bg-emerald-600 text-white" : isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"}`}>
              {m === "orders" ? "📦 Orders" : "⚖️ KG"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter Panel ──────────────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 space-y-4 ${cardBg}`}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full bg-blue-500" />
          <h3 className={`text-sm font-bold ${textPri}`} style={{ fontFamily: "Syne, sans-serif" }}>Date Range Filter</h3>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <PresetBtn key={p.id} label={p.label} active={activePreset === p.id} isDark={isDark} onClick={() => applyPreset(p)} />
          ))}
        </div>

        {/* Pickers */}
        <div className="flex flex-wrap gap-3">
          <DateRangePicker
            label="Range A — Current" color="blue"
            from={rangeA.from} to={rangeA.to}
            onFrom={v => { setRangeA(p => ({ ...p, from: v })); setActivePreset("custom"); }}
            onTo={v   => { setRangeA(p => ({ ...p, to: v }));   setActivePreset("custom"); }}
            count={aOrders.length} kg={aKg} isDark={isDark}
          />
          <DateRangePicker
            label="Range B — Compare to" color="violet"
            from={rangeB.from} to={rangeB.to}
            onFrom={v => { setRangeB(p => ({ ...p, from: v })); setActivePreset("custom"); }}
            onTo={v   => { setRangeB(p => ({ ...p, to: v }));   setActivePreset("custom"); }}
            count={bOrders.length} kg={bKg} isDark={isDark}
          />
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CompareCard label="Total Orders"   current={aOrders.length} previous={bOrders.length} subLabel="Range B" pct={ordersChange} color="blue"    isDark={isDark} />
        <CompareCard label="Total KG"       current={aKg}  previous={bKg}  unit=" kg" subLabel="Range B" pct={kgChange}     color="emerald" isDark={isDark} />
        <CompareCard label="Avg Order Size"
          current={aOrders.length > 0 ? aKg / aOrders.length : 0}
          previous={bOrders.length > 0 ? bKg / bOrders.length : 0}
          unit=" kg" subLabel="Range B"
          pct={pctChange(aOrders.length > 0 ? aKg / aOrders.length : 0, bOrders.length > 0 ? bKg / bOrders.length : 0)}
          color="violet" isDark={isDark}
        />
        <CompareCard label="Orders / Day"
          current={+(aOrders.length / daysBetween(rangeA.from, rangeA.to)).toFixed(2)}
          previous={+(bOrders.length / daysBetween(rangeB.from, rangeB.to)).toFixed(2)}
          subLabel="Range B"
          pct={pctChange(aOrders.length / daysBetween(rangeA.from, rangeA.to), bOrders.length / daysBetween(rangeB.from, rangeB.to))}
          color="amber" isDark={isDark}
        />
      </div>

      {/* ── Status Banner ─────────────────────────────────────────────────── */}
      {(() => {
        const bg     = growing ? "rgba(16,185,129,0.1)"  : declining ? "rgba(239,68,68,0.1)"  : "rgba(245,158,11,0.1)";
        const border = growing ? "rgba(16,185,129,0.25)" : declining ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.25)";
        const color  = growing ? "#10b981" : declining ? "#ef4444" : "#f59e0b";
        const emoji  = growing ? "🚀" : declining ? "📉" : "📊";
        const status = growing ? "Growing" : declining ? "Declining" : "Stable";
        const msg    = growing
          ? `Range A is up ${ordersChange.toFixed(1)}% vs Range B. Great progress!`
          : declining
            ? `Range A is down ${Math.abs(ordersChange).toFixed(1)}% vs Range B. Time to review.`
            : `Performance is stable (${ordersChange.toFixed(1)}%) between the two ranges.`;
        return (
          <div className="rounded-2xl px-5 py-4 flex items-center gap-3" style={{ background: bg, border: `1px solid ${border}` }}>
            <span className="text-2xl">{emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color }}>{status}</p>
              <p className={`text-xs mt-0.5 ${textSec}`}>{msg}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-bold font-mono" style={{ color }}>{ordersChange > 0 ? "+" : ""}{ordersChange.toFixed(1)}%</p>
              <p className={`text-xs ${textSec}`}>vs Range B</p>
            </div>
          </div>
        );
      })()}

      {/* ── Bar Chart ─────────────────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 ${cardBg}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-5 rounded-full bg-blue-500" />
          <h3 className={`text-sm font-bold ${textPri}`} style={{ fontFamily: "Syne, sans-serif" }}>Day-by-Day Breakdown</h3>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> A: {rangeA.from} → {rangeA.to}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" /> B: {rangeB.from} → {rangeB.to}</span>
          </div>
        </div>
        <div className="h-64"><Bar data={barData} options={chartOpts} /></div>
      </div>

      {/* ── Trend + Type ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className={`rounded-2xl border p-5 ${cardBg}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-5 rounded-full bg-blue-500" />
            <h3 className={`text-sm font-bold ${textPri}`} style={{ fontFamily: "Syne, sans-serif" }}>12-Month Trend</h3>
            <span className={`text-xs ml-auto ${textSec}`}>all orders</span>
          </div>
          <div className="h-52"><Line data={lineData} options={chartOpts} /></div>
        </div>

        <div className={`rounded-2xl border p-5 ${cardBg}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
            <h3 className={`text-sm font-bold ${textPri}`} style={{ fontFamily: "Syne, sans-serif" }}>By Customer Type</h3>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {typeComp.length === 0
              ? <p className={`text-sm text-center py-6 ${textSec}`}>No orders in selected ranges</p>
              : typeComp.map(({ type, a, b, pct }) => (
                <div key={type} className={`flex items-center gap-3 p-2 rounded-xl ${isDark ? "hover:bg-white/3" : "hover:bg-slate-50"} transition-colors`}>
                  <p className={`text-xs w-28 shrink-0 truncate font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>{type}</p>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 flex-1 rounded-full overflow-hidden ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(2, (a / (Math.max(a, b) || 1)) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-mono text-blue-400 w-5 text-right">{a}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 flex-1 rounded-full overflow-hidden ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.max(2, (b / (Math.max(a, b) || 1)) * 100)}%` }} />
                      </div>
                      <span className={`text-xs font-mono w-5 text-right ${isDark ? "text-slate-500" : "text-slate-400"}`}>{b}</span>
                    </div>
                  </div>
                  <TrendBadge pct={pct} isDark={isDark} />
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* ── Summary Table ─────────────────────────────────────────────────── */}
      <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
        <div className="p-5 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0" }}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-amber-500" />
              <h3 className={`text-sm font-bold ${textPri}`} style={{ fontFamily: "Syne, sans-serif" }}>Summary Table</h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /><span className={textSec}>A: {rangeA.from} → {rangeA.to}</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /><span className={textSec}>B: {rangeB.from} → {rangeB.to}</span></span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Metric</th><th>Range A 🔵</th><th>Range B 🟣</th><th>Δ Change</th><th>Trend</th></tr>
            </thead>
            <tbody>
              {[
                { metric: "Total Orders",    a: aOrders.length,   b: bOrders.length,   pct: ordersChange },
                { metric: "Total KG",        a: +aKg.toFixed(1),  b: +bKg.toFixed(1),  pct: kgChange },
                { metric: "Avg KG / Order",  a: aOrders.length > 0 ? +(aKg / aOrders.length).toFixed(2) : 0, b: bOrders.length > 0 ? +(bKg / bOrders.length).toFixed(2) : 0, pct: pctChange(aOrders.length > 0 ? aKg / aOrders.length : 0, bOrders.length > 0 ? bKg / bOrders.length : 0) },
                { metric: "Orders / Day",    a: +(aOrders.length / daysBetween(rangeA.from, rangeA.to)).toFixed(2), b: +(bOrders.length / daysBetween(rangeB.from, rangeB.to)).toFixed(2), pct: pctChange(aOrders.length / daysBetween(rangeA.from, rangeA.to), bOrders.length / daysBetween(rangeB.from, rangeB.to)) },
                { metric: "With Phone",      a: aOrders.filter(o => o.phoneNumber).length, b: bOrders.filter(o => o.phoneNumber).length, pct: pctChange(aOrders.filter(o => o.phoneNumber).length, bOrders.filter(o => o.phoneNumber).length) },
                { metric: "Unique Types",    a: new Set(aOrders.map(o => o.type)).size, b: new Set(bOrders.map(o => o.type)).size, pct: pctChange(new Set(aOrders.map(o => o.type)).size, new Set(bOrders.map(o => o.type)).size) },
                { metric: "Days in Range",   a: daysBetween(rangeA.from, rangeA.to), b: daysBetween(rangeB.from, rangeB.to), pct: pctChange(daysBetween(rangeA.from, rangeA.to), daysBetween(rangeB.from, rangeB.to)) },
              ].map(row => (
                <tr key={row.metric}>
                  <td className={`font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>{row.metric}</td>
                  <td className="font-mono text-blue-400 font-semibold">{row.a}</td>
                  <td className="font-mono text-violet-400">{row.b}</td>
                  <td><span className={`font-mono text-xs font-semibold ${row.pct > 0 ? "text-emerald-400" : row.pct < 0 ? "text-red-400" : textSec}`}>{row.pct > 0 ? "+" : ""}{row.pct.toFixed(1)}%</span></td>
                  <td><TrendBadge pct={row.pct} isDark={isDark} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
