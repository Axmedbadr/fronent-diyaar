import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        await register({ name: form.name, email: form.email, password: form.password });
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      {/* Background orb */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-sm animate-fade-in">
        {/* Card */}
        <div className="glass-card p-8 space-y-6">
          {/* Logo / Title */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-glow mx-auto">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white font-display">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-sm text-slate-500">
              {mode === "login" ? "Sign in to access Diyaar OMS" : "Register a new account"}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-surface-800 rounded-xl p-1 gap-1">
            {["login", "register"].map(m => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                  mode === m ? "bg-brand-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}>
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">Full Name</label>
                <input name="name" placeholder="Your full name" value={form.name}
                  onChange={onChange} required className="input-field" />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Email Address</label>
              <input name="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={onChange} required className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Password</label>
              <input name="password" type="password" placeholder="••••••••"
                value={form.password} onChange={onChange} required minLength={8} className="input-field" />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></span>
                  Please wait…
                </span>
              ) : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          Diyaar Orders Management System · Secure Access
        </p>
      </div>
    </div>
  );
}
