import React, { useState, useEffect } from "react";
import { useTheme } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { getOrders, getStats, getPopularItems } from "../api/orders";
import { useNavigate } from "react-router-dom";

function KpiCard({ icon, label, value, sub, color, onClick }) {
  const { isDark } = useTheme();
  const palette = {
    blue:    { bg: isDark ? "rgba(59,130,246,0.12)"  : "#eff6ff", border: isDark ? "rgba(59,130,246,0.25)"  : "#bfdbfe", text: "#3b82f6" },
    emerald: { bg: isDark ? "rgba(16,185,129,0.12)"  : "#f0fdf4", border: isDark ? "rgba(16,185,129,0.25)"  : "#bbf7d0", text: "#10b981" },
    violet:  { bg: isDark ? "rgba(139,92,246,0.12)"  : "#f5f3ff", border: isDark ? "rgba(139,92,246,0.25)"  : "#ddd6fe", text: "#8b5cf6" },
    amber:   { bg: isDark ? "rgba(245,158,11,0.12)"  : "#fffbeb", border: isDark ? "rgba(245,158,11,0.25)"  : "#fde68a", text: "#f59e0b" },
    pink:    { bg: isDark ? "rgba(236,72,153,0.12)"  : "#fdf2f8", border: isDark ? "rgba(236,72,153,0.25)"  : "#fbcfe8", text: "#ec4899" },
    cyan:    { bg: isDark ? "rgba(6,182,212,0.12)"   : "#ecfeff", border: isDark ? "rgba(6,182,212,0.25)"   : "#a5f3fc", text: "#06b6d4" },
    red:     { bg: isDark ? "rgba(239,68,68,0.12)"   : "#fef2f2", border: isDark ? "rgba(239,68,68,0.25)"   : "#fecaca", text: "#ef4444" },
  }[color] || {};

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:scale-105 ${onClick ? "cursor-pointer" : ""}`}
      style={{ background: palette.bg, border: `1px solid ${palette.border}` }}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-mono font-semibold" style={{ color: palette.text }}>{sub}</span>
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: palette.text, fontFamily: "Syne, sans-serif" }}>{value}</p>
        <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      </div>
    </div>
  );
}

function QuickLink({ icon, label, desc, to, color, isDark }) {
  const navigate = useNavigate();
  const colors = {
    blue:   { bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.2)",  text: "#3b82f6" },
    violet: { bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.2)",  text: "#8b5cf6" },
    emerald:{ bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.2)",  text: "#10b981" },
    amber:  { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)",  text: "#f59e0b" },
  }[color] || {};

  return (
    <button onClick={() => navigate(to)}
      className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.02]
        ${isDark ? "hover:bg-white/3" : "hover:bg-slate-50"}`}
      style={{ border: `1px solid ${colors.border}`, background: colors.bg }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
           style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
        {icon}
      </div>
      <div>
        <p className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{label}</p>
        <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{desc}</p>
      </div>
      <span className="ml-auto" style={{ color: colors.text }}>→</span>
    </button>
  );
}

export default function AdminDashboard() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [data, setData] = useState({ orders: [], stats: [], items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [orders, stats, items] = await Promise.all([
          getOrders(), getStats(), getPopularItems()
        ]);
        setData({ orders, stats, items });
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const totalOrders  = data.orders.length;
  const totalKg      = data.orders.reduce((s, o) => s + (o.items?.reduce((a, i) => a + (i.quantity || 0), 0) || 0), 0);
  const withPhone    = data.orders.filter(o => o.phoneNumber).length;
  const topItem      = data.items[0]?._id || "—";

  // Orders in last 7 days
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const recentOrders = data.orders.filter(o => new Date(o.orderDate) >= weekAgo);

  // Unique customers
  const uniqueCustomers = new Set(data.orders.filter(o => o.phoneNumber).map(o => o.phoneNumber)).size;

  const textPri = isDark ? "text-white"     : "text-slate-800";
  const textSec = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg  = isDark ? "bg-[#0c1525] border-white/5" : "bg-white border-slate-200";

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
              🛡️ ADMIN ONLY
            </span>
          </div>
          <h2 className={`text-2xl font-bold ${textPri}`} style={{ fontFamily: "Syne, sans-serif" }}>
            Admin Dashboard
          </h2>
          <p className={`text-sm mt-0.5 ${textSec}`}>
            Welcome back, {user?.name || user?.email}. Here's the system overview.
          </p>
        </div>
        <a href="/"
          className={`text-sm px-4 py-2 rounded-xl border font-medium transition-all
            ${isDark ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"}`}>
          ← Back to Orders
        </a>
      </div>

      {/* KPI Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`rounded-2xl h-28 animate-pulse ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon="📦" label="Total Orders"      value={totalOrders}               sub="all time"       color="blue" />
          <KpiCard icon="⚖️" label="Total KG Shipped"  value={`${totalKg.toFixed(0)}`}  sub="kg"             color="emerald" />
          <KpiCard icon="📱" label="With Phone"        value={withPhone}                 sub="contactable"    color="violet" />
          <KpiCard icon="👥" label="Unique Customers"  value={uniqueCustomers}           sub="distinct"       color="cyan" />
          <KpiCard icon="📅" label="Orders This Week"  value={recentOrders.length}       sub="last 7 days"    color="amber" />
          <KpiCard icon="🏷️" label="Order Categories"  value={data.stats.length}         sub="types"          color="pink" />
          <KpiCard icon="🏆" label="Top Item"          value={topItem}                   sub="by volume"      color="red" />
          <KpiCard icon="📊" label="Loyalty Rate"      value={
            uniqueCustomers > 0
              ? `${Math.round((data.orders.filter(o => {
                  const map = {};
                  data.orders.forEach(x => { if(x.phoneNumber) map[x.phoneNumber] = (map[x.phoneNumber]||0)+1; });
                  return o.phoneNumber && map[o.phoneNumber] > 1;
                }).length / data.orders.length) * 100)}%`
              : "0%"
          } sub="repeat buyers" color="blue" />
        </div>
      )}

      {/* Quick links + recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Quick links */}
        <div className={`rounded-2xl border p-5 space-y-3 ${cardBg}`}>
          <div className="flex items-center gap-2 pb-1">
            <div className="w-1.5 h-5 rounded-full bg-blue-500"></div>
            <h3 className={`text-sm font-bold ${textPri}`} style={{ fontFamily: "Syne, sans-serif" }}>
              Quick Actions
            </h3>
          </div>
          <QuickLink icon="📈" label="Analytics"    desc="Charts, trends and item breakdown"  to="/analytics" color="blue"    isDark={isDark} />
          <QuickLink icon="👥" label="Users"        desc="Manage accounts and permissions"    to="/users"     color="violet"  isDark={isDark} />
          <QuickLink icon="⚙️" label="Settings"     desc="System preferences and appearance"  to="/settings"  color="emerald" isDark={isDark} />
          <QuickLink icon="📦" label="All Orders"   desc="View and manage all orders"         to="/"          color="amber"   isDark={isDark} />
        </div>

        {/* Recent orders */}
        <div className={`rounded-2xl border p-5 space-y-3 ${cardBg}`}>
          <div className="flex items-center gap-2 pb-1">
            <div className="w-1.5 h-5 rounded-full bg-emerald-500"></div>
            <h3 className={`text-sm font-bold ${textPri}`} style={{ fontFamily: "Syne, sans-serif" }}>
              Recent Orders
            </h3>
            <span className={`text-xs ml-auto ${textSec}`}>Last 5</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-10 rounded-xl animate-pulse ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {data.orders.slice(0, 5).map(order => {
                const kg = order.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;
                return (
                  <div key={order._id}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl
                      ${isDark ? "hover:bg-white/3" : "hover:bg-slate-50"} transition-colors`}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                        {(order.customerName || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>{order.customerName}</p>
                        <p className={`text-xs ${textSec}`}>{new Date(order.orderDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-emerald-400 font-semibold">{kg} kg</p>
                      <p className={`text-xs ${textSec}`}>{order.type}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Order type breakdown */}
      {!loading && data.stats.length > 0 && (
        <div className={`rounded-2xl border p-5 space-y-3 ${cardBg}`}>
          <div className="flex items-center gap-2 pb-1">
            <div className="w-1.5 h-5 rounded-full bg-violet-500"></div>
            <h3 className={`text-sm font-bold ${textPri}`} style={{ fontFamily: "Syne, sans-serif" }}>
              Orders by Type
            </h3>
          </div>
          <div className="space-y-2">
            {data.stats.map(stat => {
              const pct = totalOrders > 0 ? (stat.count / totalOrders) * 100 : 0;
              return (
                <div key={stat._id} className="flex items-center gap-3">
                  <span className={`text-xs w-36 shrink-0 truncate ${textSec}`}>{stat._id}</span>
                  <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                    <div className="h-full rounded-full bg-blue-500 transition-all duration-700"
                         style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-mono text-blue-400 w-10 text-right shrink-0">{stat.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
