import React, { useState } from "react";
import { useTheme } from "../components/Layout";
import { useAuth } from "../context/AuthContext";

function Section({ title, desc, children, isDark }) {
  return (
    <div className={`rounded-2xl border p-6 space-y-4 ${isDark ? "bg-[#0c1525] border-white/5" : "bg-white border-slate-200"}`}>
      <div className="border-b pb-3" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0" }}>
        <h3 className={`font-bold ${isDark ? "text-white" : "text-slate-800"}`}
            style={{ fontFamily: "Syne, sans-serif" }}>{title}</h3>
        {desc && <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, desc, value, onChange, isDark }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>{label}</p>
        {desc && <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-all duration-200 shrink-0
          ${value ? "bg-blue-600" : isDark ? "bg-slate-700" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
          ${value ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { isDark, toggle } = useTheme();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [notifs, setNotifs] = useState({ email: true, orders: true, reports: false });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const textPri = isDark ? "text-white" : "text-slate-800";
  const textSec = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className={`text-2xl font-bold ${textPri}`} style={{ fontFamily: "Syne, sans-serif" }}>Settings</h2>
        <p className={`text-sm mt-0.5 ${textSec}`}>Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Section title="Profile" desc="Your account information" isDark={isDark}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-2xl font-bold">
            {(user?.name || user?.email || "U")[0].toUpperCase()}
          </div>
          <div>
            <p className={`font-semibold ${textPri}`}>{user?.name || "—"}</p>
            <p className={`text-sm ${textSec}`}>{user?.email}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1"
                  style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#3b82f6" }}>
              Administrator
            </span>
          </div>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" desc="Customize how the dashboard looks" isDark={isDark}>
        <Toggle
          label="Dark Mode"
          desc="Use dark theme across the application"
          value={isDark}
          onChange={toggle}
          isDark={isDark}
        />
      </Section>

      {/* Notifications */}
      <Section title="Notifications" desc="Control what alerts you receive" isDark={isDark}>
        <div className="space-y-4">
          <Toggle label="Email Notifications" desc="Receive updates via email"
            value={notifs.email} onChange={v => setNotifs(p => ({ ...p, email: v }))} isDark={isDark} />
          <Toggle label="New Order Alerts" desc="Get notified when orders are placed"
            value={notifs.orders} onChange={v => setNotifs(p => ({ ...p, orders: v }))} isDark={isDark} />
          <Toggle label="Weekly Reports" desc="Receive a weekly analytics summary"
            value={notifs.reports} onChange={v => setNotifs(p => ({ ...p, reports: v }))} isDark={isDark} />
        </div>
      </Section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="btn-primary">
          {saved ? "✅ Saved!" : "Save Changes"}
        </button>
        {saved && <span className={`text-sm ${textSec}`}>Settings updated successfully</span>}
      </div>
    </div>
  );
}
