import React, { useState, useEffect } from "react";
import { useTheme } from "../components/Layout";
import { apiClient } from "../api/client";

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ children, color = "slate" }) {
  const palette = {
    green:  { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  text: "#10b981" },
    red:    { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   text: "#ef4444" },
    amber:  { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  text: "#f59e0b" },
    blue:   { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)",  text: "#3b82f6" },
    violet: { bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.3)",  text: "#8b5cf6" },
    slate:  { bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)", text: "#94a3b8" },
  }[color];
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{ background: palette.bg, border: `1px solid ${palette.border}`, color: palette.text }}>
      {children}
    </span>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated, isDark }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim())  return setError("Name is required");
    if (!form.email.trim()) return setError("Email is required");
    if (form.password.length < 8) return setError("Password must be at least 8 characters");

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/users", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      onCreated(res.data.user);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isDark ? "bg-[#0c1525] border-white/10" : "bg-white border-slate-200 shadow-2xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative rounded-2xl w-full max-w-md p-6 space-y-5 z-10 border ${cardBg}`}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-800"}`}
                style={{ fontFamily: "Syne, sans-serif" }}>Create New User</h3>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Admin-created accounts only
            </p>
          </div>
          <button onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}>
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Ahmed Mohamed"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="input-field"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="user@diyaar.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="input-field"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input-field pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {/* Password strength indicator */}
            {form.password && (
              <div className="mt-1.5 flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                       style={{
                         background: form.password.length > i * 3
                           ? form.password.length < 8 ? "#f59e0b"
                           : form.password.length < 12 ? "#3b82f6"
                           : "#10b981"
                           : isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"
                       }} />
                ))}
              </div>
            )}
          </div>

          {/* Role */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "user",  label: "Staff",  icon: "👤", desc: "Orders only" },
                { value: "staff", label: "Staff+", icon: "📋", desc: "Extended access" },
                { value: "admin", label: "Admin",  icon: "🛡️", desc: "Full access" },
              ].map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, role: r.value }))}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    form.role === r.value
                      ? "border-blue-500/50 bg-blue-600/20 text-blue-400"
                      : isDark
                        ? "border-white/10 bg-white/3 text-slate-400 hover:border-white/20"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                  }`}>
                  <div className="text-lg mb-1">{r.icon}</div>
                  <div className="text-xs font-semibold">{r.label}</div>
                  <div className={`text-xs mt-0.5 ${isDark ? "text-slate-600" : "text-slate-400"}`}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm text-red-400"
                 style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                ${isDark ? "border-white/10 text-slate-400 hover:bg-white/5" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </span>
              ) : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── User Detail Modal ────────────────────────────────────────────────────────
function UserDetailModal({ user, onClose, isDark }) {
  if (!user) return null;
  const cardBg = isDark ? "bg-[#0c1525] border-white/10" : "bg-white border-slate-200 shadow-2xl";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative rounded-2xl w-full max-w-md p-6 space-y-4 z-10 border ${cardBg}`}>
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
            <div className="mt-1 flex gap-1">
              <Badge color={user.roles?.[0] === "admin" ? "red" : user.roles?.[0] === "staff" ? "amber" : "blue"}>
                {user.roles?.[0] || "user"}
              </Badge>
              <Badge color={user.suspended ? "red" : "green"}>
                {user.suspended ? "Suspended" : "Active"}
              </Badge>
            </div>
          </div>
        </div>
        <div className={`rounded-xl divide-y ${isDark ? "bg-white/3 divide-white/5" : "bg-slate-50 divide-slate-200"}`}>
          {[
            { label: "User ID",  value: user._id },
            { label: "Joined",   value: user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—" },
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

// ─── Main Users Page ──────────────────────────────────────────────────────────
export default function Users() {
  const { isDark } = useTheme();
  const [users, setUsers]             = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading]     = useState(null);
  const [successMsg, setSuccessMsg]   = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/auth/users");
      setUsers(res.data);
    } catch (e) {
      setError("Failed to load users. Make sure the backend user endpoints are set up.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let result = [...users];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        (u.name || "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter === "active")    result = result.filter(u => !u.suspended);
    if (statusFilter === "suspended") result = result.filter(u => u.suspended);
    if (statusFilter === "admin")     result = result.filter(u => u.roles?.includes("admin"));
    setFiltered(result);
  }, [search, statusFilter, users]);

  const flash = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleUserCreated = (newUser) => {
    setUsers(p => [newUser, ...p]);
    flash(`✅ User "${newUser.name}" created successfully`);
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete "${user.name}"? This cannot be undone.`)) return;
    setActionLoading(user._id + "_delete");
    try {
      await apiClient.delete(`/auth/users/${user._id}`);
      setUsers(p => p.filter(u => u._id !== user._id));
      flash(`✅ User "${user.name}" deleted`);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (user) => {
    const action = user.suspended ? "unsuspend" : "suspend";
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${user.name}"?`)) return;
    setActionLoading(user._id + "_suspend");
    try {
      await apiClient.patch(`/auth/users/${user._id}`, { suspended: !user.suspended });
      setUsers(p => p.map(u => u._id === user._id ? { ...u, suspended: !u.suspended } : u));
      flash(`✅ User "${user.name}" ${action}ed`);
    } catch {
      // Optimistic update anyway
      setUsers(p => p.map(u => u._id === user._id ? { ...u, suspended: !u.suspended } : u));
    } finally {
      setActionLoading(null);
    }
  };

  const cardBg  = isDark ? "bg-[#0c1525] border-white/5"   : "bg-white border-slate-200";
  const textPri = isDark ? "text-white"   : "text-slate-800";
  const textSec = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          isDark={isDark}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleUserCreated}
        />
      )}
      <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} isDark={isDark} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`text-2xl font-bold ${textPri}`} style={{ fontFamily: "Syne, sans-serif" }}>
            User Management
          </h2>
          <p className={`text-sm mt-0.5 ${textSec}`}>
            Admin-controlled accounts — users cannot self-register
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2">
          <span className="text-base leading-none">+</span>
          Create User
        </button>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="rounded-xl px-4 py-3 text-sm text-emerald-400 animate-fade-in"
             style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
          {successMsg}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-400"
             style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Users",   value: users.length,                                  color: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.2)",  text: "#3b82f6" },
          { label: "Active",        value: users.filter(u => !u.suspended).length,        color: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.2)",  text: "#10b981" },
          { label: "Suspended",     value: users.filter(u => u.suspended).length,         color: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.2)",   text: "#ef4444" },
          { label: "Admins",        value: users.filter(u => u.roles?.includes("admin")).length, color: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.2)", text: "#f59e0b" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center"
               style={{ background: s.color, border: `1px solid ${s.border}` }}>
            <p className="text-2xl font-bold" style={{ color: s.text, fontFamily: "Syne, sans-serif" }}>{s.value}</p>
            <p className={`text-xs mt-0.5 ${textSec}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={`rounded-2xl border p-4 flex flex-wrap gap-3 ${cardBg}`}>
        <div className="relative flex-1 min-w-48">
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${textSec}`}>🔍</span>
          <input type="text" placeholder="Search by name or email…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-8 h-9 text-sm" />
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9" }}>
          {["all", "active", "suspended", "admin"].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                ${statusFilter === f
                  ? isDark ? "bg-blue-600 text-white" : "bg-white text-blue-600 shadow-sm"
                  : isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"}`}>
              {f}
            </button>
          ))}
        </div>
        <span className={`self-center text-xs ${textSec}`}>
          {filtered.length} of {users.length} users
        </span>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-4xl">👤</span>
            <p className={`text-sm ${textSec}`}>No users found</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary text-xs px-4 py-2">
              + Create First User
            </button>
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
                      <Badge color={user.roles?.[0] === "admin" ? "red" : user.roles?.[0] === "staff" ? "amber" : "blue"}>
                        {user.roles?.[0] === "admin" ? "🛡️ Admin" : user.roles?.[0] === "staff" ? "📋 Staff+" : "👤 Staff"}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td>
                      <Badge color={user.suspended ? "red" : "green"}>
                        {user.suspended ? "⏸ Suspended" : "✓ Active"}
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
                        <button onClick={() => setSelectedUser(user)} title="View details"
                          className={`p-1.5 rounded-lg text-xs transition-colors
                            ${isDark ? "text-slate-400 hover:text-blue-400 hover:bg-blue-400/10" : "text-slate-400 hover:text-blue-500 hover:bg-blue-50"}`}>
                          👁️
                        </button>

                        {/* Suspend / Unsuspend */}
                        <button onClick={() => handleSuspend(user)}
                          disabled={actionLoading === user._id + "_suspend"}
                          title={user.suspended ? "Unsuspend" : "Suspend"}
                          className={`p-1.5 rounded-lg text-xs transition-colors
                            ${isDark ? "text-slate-400 hover:text-amber-400 hover:bg-amber-400/10" : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"}`}>
                          {actionLoading === user._id + "_suspend"
                            ? <span className="w-3 h-3 border border-amber-500/30 border-t-amber-500 rounded-full animate-spin inline-block" />
                            : user.suspended ? "▶️" : "⏸️"}
                        </button>

                        {/* Delete */}
                        <button onClick={() => handleDelete(user)}
                          disabled={actionLoading === user._id + "_delete"}
                          title="Delete user"
                          className={`p-1.5 rounded-lg text-xs transition-colors
                            ${isDark ? "text-slate-400 hover:text-red-400 hover:bg-red-400/10" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}>
                          {actionLoading === user._id + "_delete"
                            ? <span className="w-3 h-3 border border-red-500/30 border-t-red-500 rounded-full animate-spin inline-block" />
                            : "🗑️"}
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
