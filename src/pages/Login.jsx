import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const from = location.state?.from?.pathname || "/";

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{
        backgroundImage:    "url('/backgroundlogin.png')",
        backgroundSize:     "cover",
        backgroundPosition: "center",
        backgroundRepeat:   "no-repeat",
      }}
    >
      {/* Dark overlay so text stays readable */}
      <div className="absolute inset-0" style={{ background: "rgba(8,15,31,0.55)", backdropFilter: "blur(2px)" }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <div className="rounded-2xl p-8 space-y-6"
             style={{ background: "rgba(12,21,37,0.85)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}>

          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto"
                 style={{ boxShadow: "0 0 24px rgba(59,130,246,0.5)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white"
                   strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
              Welcome back
            </h2>
            <p className="text-sm text-slate-400">Sign in to access Diyaar OMS</p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={onChange}
                required
                className="input-field"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={onChange}
                  required
                  minLength={8}
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-xs">
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-400"
                   style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign In →"}
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
