import React, { useState } from "react";
import OrderForm from "../components/OrderForm";
import OrdersList from "../components/OrdersList";
import { useTheme } from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [refreshList, setRefreshList] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const isAdmin = user?.roles?.includes("admin");

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}
              style={{ fontFamily: "Syne, sans-serif" }}>
            Orders Dashboard
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Manage and track customer orders
          </p>
        </div>

        {/* Admin shortcut */}
        {isAdmin && (
          <a href="/admin"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#f87171"
            }}>
            🛡️ Go to Admin Panel
          </a>
        )}
      </div>

      {/* Main layout */}
      <div className="flex gap-4 items-start">

        {/* Form column */}
        <div className={`shrink-0 transition-all duration-300
          ${showForm ? "w-72 xl:w-80" : "w-0 overflow-hidden opacity-0 pointer-events-none"}`}>
          <OrderForm onOrderAdded={() => setRefreshList(p => !p)} />
        </div>

        {/* List column */}
        <div className="flex-1 min-w-0 space-y-3">
          <button
            onClick={() => setShowForm(p => !p)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border
              ${isDark
                ? "bg-white/5 hover:bg-white/10 text-slate-300 border-white/5"
                : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-sm"}`}>
            {showForm ? "← Hide Form" : "+ Add Order"}
          </button>
          <OrdersList refresh={refreshList} />
        </div>
      </div>

      {/* Mobile FAB */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center text-xl transition-all duration-200 md:hidden z-40"
          style={{ boxShadow: "0 0 20px rgba(59,130,246,0.4)" }}>
          +
        </button>
      )}
    </div>
  );
}
