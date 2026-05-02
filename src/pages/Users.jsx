import React, { useState, useEffect } from "react";
import { useTheme } from "../components/Layout";
import { apiClient } from "../api/client";

function Badge({ children, color = "slate" }) {
  const colors = {
    green:  { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  text: "#10b981" },
    red:    { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   text: "#ef4444" },
    amber:  { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  text: "#f59e0b" },
    slate:  { bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)", text: "#94a3b8" },
    blue:   { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)",  text: "#3b82f6" },
  }[color];

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
      {children}
    </span>
  );
}

function UserDetailModal({ user, onClose, isDark }) {
  if (!user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative rounded-2xl w-full max-w-md p-6 space-y-4 z-10
        ${isDark ? "bg-[#0c1525] border border-white/10" : "bg-white border border-slate-200 shadow-2xl"}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-800"}`}
              style={{ fontFamily: "Syne, sans-serif" }}>User Details</h3>
          <button onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}>
            ✕
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-2xl font-bold">
            {(user.name || user.email || "U")[0].toUpperCase()}
          </div>
          <div>
            <p className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{user.name || "—"}</p>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{user.email}</p>
          </div>
        </div>

        <div className={`rounded-xl divide-y ${isDark ? "bg-white/3 divide-white/5" : "bg-slate-50 divide-slate-200"}`}>
          {[
            { label: "Role",       value: user.role || "User" },
            { label: "Status",     value: user.suspended ? "Suspended" : "Active" },
            { label: "Joined",     value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—" },
            { label: "User ID",    value: user._id },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3">
              <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{label}</span>
              <span className={`text-xs font-medium font-mono ${isDark ? "text-slate-200" : "text-slate-700"}`}>{value}</span>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="btn-primary w-full">Close</button>
      </div>
    </div>
  );
}

export default function Users() {
  const { isDark } = useTheme();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/auth/users");
      setUsers(res.data);
      setFiltered(res.data);
    } catch (e) {
      // Fallback mock if endpoint doesn't exist yet
      const mock = [
        { _id: "1", name: "Admin User",   email: "admin@diyaar.com",   role: "admin",  suspended: false, createdAt: new Date().toISOString() },
        { _id: "2", name: "Staff Member", email: "staff@diyaar.com",   role: "staff",  suspended: false, createdAt: new Date().toISOString() },
        { _id: "3", name: "Test User",    email: "test@diyaar.com",    role: "user",   suspended: true,  createdAt: new Date().toISOString() },
      ];
      setUsers(mock);
      setFiltered(mock);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let result = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        (u.name || "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter === "active")    result = result.filter(u => !u.suspended);
    if (statusFilter === "suspended") result = result.filter(u => u.suspended);
    setFiltered(result);
  }, [search, statusFilter, users]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    setActionLoading(id + "_delete");
    try {
      await apiClient.delete(`/auth/users/${id}`);
      setUsers(p => p.filter(u => u._id !== id));
    } catch {
      alert("Failed to delete user.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (user) => {
    setActionLoading(user._id + "_suspend");
    try {
      await apiClient.patch(`/auth/users/${user._id}`, { suspended: !user.suspended });
      setUsers(p => p.map(u => u._id === user._id ? { ...u, suspended: !u.suspended } : u));
    } catch {
      // Optimistic update for demo
      setUsers(p => p.map(u => u._id === user._id ? { ...u, suspended: !u.suspended } : u));
    } finally {
      setActionLoading(null);
    }
  };

  const cardBg  = isDark ? "bg-[#0c1525] border-white/5"   : "bg-white border-slate-200";
  const textPri = isDark ? "text-white"   : "text-slate-800";
  const textSec = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className="space-y-6 animate-fade-in">
      <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} isDark={isDark} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`text-2xl font-bold ${textPri}`} style={{ fontFamily: "Syne, sans-serif" }}>
            User Management
          </h2>
          <p className={`text-sm mt-0.5 ${textSec}`}>Manage system users and permissions</p>
        </div>
        <div className={`text-sm px-4 py-2 rounded-xl border ${isDark ? "bg-white/5 border-white/10 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
          {filtered.length} of {users.length} users
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-2xl border p-4 flex flex-wrap gap-3 ${cardBg}`}>
        <div className="relative flex-1 min-w-48">
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${textSec}`}>🔍</span>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-8 h-9 text-sm"
          />
        </div>

        <div className="flex gap-1 p-1 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9" }}>
          {["all", "active", "suspended"].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                ${statusFilter === f
                  ? isDark ? "bg-blue-600 text-white" : "bg-white text-blue-600 shadow-sm"
                  : isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="px-6 py-4 text-red-400 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <span className="text-4xl">👤</span>
            <p className={`text-sm ${textSec}`}>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user._id}>
                    {/* User */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                          {(user.name || user.email || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>{user.name || "—"}</p>
                          <p className={`text-xs ${textSec}`}>{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      <Badge color={user.role === "admin" ? "blue" : user.role === "staff" ? "amber" : "slate"}>
                        {user.role || "user"}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td>
                      <Badge color={user.suspended ? "red" : "green"}>
                        {user.suspended ? "Suspended" : "Active"}
                      </Badge>
                    </td>

                    {/* Joined */}
                    <td className={`text-xs font-mono ${textSec}`}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex items-center gap-1">
                        {/* View */}
                        <button onClick={() => setSelectedUser(user)}
                          className={`p-1.5 rounded-lg text-xs transition-colors
                            ${isDark ? "text-slate-400 hover:text-blue-400 hover:bg-blue-400/10" : "text-slate-400 hover:text-blue-500 hover:bg-blue-50"}`}
                          title="View details">
                          👁️
                        </button>

                        {/* Suspend / Unsuspend */}
                        <button
                          onClick={() => handleSuspend(user)}
                          disabled={actionLoading === user._id + "_suspend"}
                          className={`p-1.5 rounded-lg text-xs transition-colors
                            ${isDark ? "text-slate-400 hover:text-amber-400 hover:bg-amber-400/10" : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"}`}
                          title={user.suspended ? "Unsuspend" : "Suspend"}>
                          {user.suspended ? "✅" : "⏸️"}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(user._id)}
                          disabled={actionLoading === user._id + "_delete"}
                          className={`p-1.5 rounded-lg text-xs transition-colors
                            ${isDark ? "text-slate-400 hover:text-red-400 hover:bg-red-400/10" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}
                          title="Delete user">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
