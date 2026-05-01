import React, { useState, useEffect } from "react";
import { getStats } from "../api/orders";

const TYPE_DISPLAY = {
  "Individuals":         { label: "Individuals",          icon: "👤", color: "from-brand-600/20 to-brand-700/10 border-brand-500/20",  text: "text-brand-400" },
  "Shops":               { label: "Shops",                icon: "🏪", color: "from-emerald-600/20 to-emerald-700/10 border-emerald-500/20", text: "text-emerald-400" },
  "Supermarkets":        { label: "Supermarkets",         icon: "🛒", color: "from-violet-600/20 to-violet-700/10 border-violet-500/20",  text: "text-violet-400" },
  "Pre-Urban":           { label: "Pre-Urban",            icon: "🏘️", color: "from-amber-600/20 to-amber-700/10 border-amber-500/20",    text: "text-amber-400" },
  "SOFHA Health Centers":{ label: "SOFHA Health",         icon: "🏥", color: "from-pink-600/20 to-pink-700/10 border-pink-500/20",       text: "text-pink-400" },
  "Community-Women":     { label: "Community Women",      icon: "👩‍👩‍👧", color: "from-cyan-600/20 to-cyan-700/10 border-cyan-500/20",      text: "text-cyan-400" },
};

export default function OrderStats() {
  const [stats, setStats] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
      setTotal(data.reduce((acc, cur) => acc + cur.count, 0));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card p-5 animate-pulse h-28 bg-white/5" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-4 border-red-500/20 text-red-400 text-sm">
        ⚠️ Failed to load statistics. Please refresh.
      </div>
    );
  }

  const topCategory = stats.reduce((max, s) => s.count > max.count ? s : max, stats[0]);

  return (
    <div className="space-y-3">
      {/* Top summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full bg-brand-500"></div>
          <h3 className="text-sm font-semibold text-slate-200 font-display">Order Statistics</h3>
        </div>
        <div className="text-xs text-slate-500">
          <span className="text-slate-300 font-semibold">{total}</span> total · 
          <span className="ml-1">Top: <span className="text-brand-400">{TYPE_DISPLAY[topCategory?._id]?.label || topCategory?._id}</span></span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat) => {
          const cfg = TYPE_DISPLAY[stat._id] || { label: stat._id, icon: "📦", color: "from-slate-600/20 to-slate-700/10 border-slate-500/20", text: "text-slate-400" };
          const pct = total > 0 ? ((stat.count / total) * 100).toFixed(1) : "0.0";

          return (
            <div
              key={stat._id}
              className={`rounded-2xl bg-gradient-to-br ${cfg.color} border p-4 flex flex-col gap-2 transition-all duration-300 hover:scale-105`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{cfg.icon}</span>
                <span className={`text-xs font-mono font-medium ${cfg.text}`}>{pct}%</span>
              </div>
              <div>
                <p className={`text-2xl font-bold font-display ${cfg.text}`}>{stat.count}</p>
                <p className="text-xs text-slate-400 leading-tight mt-0.5">{cfg.label}</p>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${cfg.text.replace("text-", "bg-")}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
