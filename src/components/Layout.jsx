import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-surface-950"
         style={{ backgroundImage: "radial-gradient(ellipse at 20% 0%, rgba(59,130,246,0.08) 0%, transparent 60%)" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-surface-950/80 backdrop-blur-lg">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-glow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white font-display tracking-wide leading-none">Diyaar OMS</h1>
              <p className="text-xs text-slate-500 leading-none mt-0.5">Orders Management</p>
            </div>
          </div>

          {/* Nav slot (injected from App) */}
          <div className="flex-1">{/* children[0] = nav */}</div>

          {/* Right side */}
          {isAuthenticated && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-slate-200">{user?.name || user?.email}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-bold">
                {(user?.name || user?.email || "U")[0].toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-red-400 transition-colors duration-200 p-1.5 rounded-lg hover:bg-red-400/10"
                title="Logout"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Sub-header for nav */}
      {isAuthenticated && (
        <div className="border-b border-white/5 bg-surface-950/60">
          <div className="max-w-screen-2xl mx-auto px-6 h-12 flex items-center">
            {React.Children.toArray(children)[0]}
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-6">
        {isAuthenticated
          ? React.Children.toArray(children).slice(1)
          : children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-4">
        <div className="max-w-screen-2xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-slate-600">© 2026 Diyaar Analysis Tool. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs text-slate-600">System online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
