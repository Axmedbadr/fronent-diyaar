import React, { useState, useEffect, createContext, useContext } from "react";
import { useAuth } from "../context/AuthContext";
import { NavLink, useLocation } from "react-router-dom";

// ─── Theme Context ────────────────────────────────────────────────────────────
export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark(p => !p) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

// ─── Nav items ────────────────────────────────────────────────────────────────
const STAFF_NAV = [
  {
    to: "/",
    end: true,
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
];

const ADMIN_NAV = [
  {
    to: "/admin",
    end: true,
    label: "Admin Panel",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    adminOnly: true,
  },
  {
  to: "/growth",
  label: "Growth",
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  adminOnly: true,
},
  {
    to: "/analytics",
    label: "Analytics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    adminOnly: true,
  },
  {
    to: "/users",
    label: "Users",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    adminOnly: true,
  },
  {
    to: "/settings",
    label: "Settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    ),
  },
];

// ─── Single nav link ──────────────────────────────────────────────────────────
function NavItem({ item, collapsed, isDark, onClick }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-200 group relative
        ${isActive
          ? isDark
            ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
            : "bg-blue-50 text-blue-600 border border-blue-200"
          : isDark
            ? "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
        }
      `}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
      {item.adminOnly && !collapsed && (
        <span className="ml-auto text-xs px-1.5 py-0.5 rounded-md"
              style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: "9px", fontWeight: 700 }}>
          ADMIN
        </span>
      )}
      {collapsed && (
        <div className={`
          absolute left-full ml-2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap
          opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50
          ${isDark ? "bg-slate-800 text-white" : "bg-slate-700 text-white"}
        `}>
          {item.label}
        </div>
      )}
    </NavLink>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onClose }) {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const isAdmin = user?.roles?.includes("admin");

  const allNav = [...STAFF_NAV, ...ADMIN_NAV];
  const visibleNav = allNav.filter(item => isAdmin || !item.adminOnly);

  return (
    <>
      {!collapsed && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
             onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 z-40 h-full flex flex-col
        transition-all duration-300 ease-in-out
        ${collapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "translate-x-0 w-64"}
        ${isDark ? "bg-[#0c1525] border-r border-white/5" : "bg-white border-r border-slate-200"}
      `}>

        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 h-16 border-b shrink-0
          ${isDark ? "border-white/5" : "border-slate-200"}`}>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0"
               style={{ boxShadow: "0 0 16px rgba(59,130,246,0.4)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className={`text-sm font-bold leading-none ${isDark ? "text-white" : "text-slate-800"}`}
                 style={{ fontFamily: "Syne, sans-serif" }}>Diyaar OMS</p>
              <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                {isAdmin ? "Admin Panel" : "Staff Panel"}
              </p>
            </div>
          )}
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-3 pt-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
              ${isAdmin
                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                : "bg-blue-500/10 border border-blue-500/20 text-blue-400"}`}>
              <span>{isAdmin ? "🛡️" : "👤"}</span>
              <span>{isAdmin ? "Administrator" : "Staff Member"}</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {/* Staff section */}
          {!collapsed && (
            <p className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
              Workspace
            </p>
          )}
          {STAFF_NAV.map(item => (
            <NavItem key={item.to} item={item} collapsed={collapsed} isDark={isDark} onClick={onClose} />
          ))}

          {/* Admin section — only visible to admins */}
          {isAdmin && (
            <>
              {!collapsed && (
                <p className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 mt-3 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                  Administration
                </p>
              )}
              {ADMIN_NAV.map(item => (
                <NavItem key={item.to} item={item} collapsed={collapsed} isDark={isDark} onClick={onClose} />
              ))}
            </>
          )}
        </nav>

        {/* Bottom */}
        <div className={`p-3 border-t space-y-1 shrink-0
          ${isDark ? "border-white/5" : "border-slate-200"}`}>

          {/* Theme toggle */}
          <button onClick={toggle}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isDark ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
            <span className="shrink-0 text-base">{isDark ? "☀️" : "🌙"}</span>
            {!collapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
          </button>

          {/* User info */}
          {!collapsed && (
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
              ${isDark ? "bg-white/3" : "bg-slate-50"}`}>
              <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                {(user?.name || user?.email || "U")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                  {user?.name || user?.email}
                </p>
                <p className={`text-xs truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {user?.roles?.[0] || "user"}
                </p>
              </div>
            </div>
          )}

          {/* Logout */}
          <button onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isDark ? "text-slate-400 hover:text-red-400 hover:bg-red-400/10" : "text-slate-500 hover:text-red-500 hover:bg-red-50"}`}>
            <span className="shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const allNav = [...STAFF_NAV, ...ADMIN_NAV];
  const currentPage = allNav.find(i =>
    i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)
  );

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-[#080f1f]" : "bg-slate-50"}`}
           style={isDark ? { backgroundImage: "radial-gradient(ellipse at 20% 0%, rgba(59,130,246,0.08) 0%, transparent 60%)" } : {}}>
        {children}
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${isDark ? "bg-[#080f1f]" : "bg-slate-100"}`}>
      <Sidebar collapsed={collapsed} onClose={() => setCollapsed(true)} />

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? "lg:pl-16" : "lg:pl-64"}`}>

        {/* Top bar */}
        <header className={`sticky top-0 z-20 h-16 flex items-center justify-between px-6 border-b
          ${isDark ? "bg-[#080f1f]/80 border-white/5 backdrop-blur-lg" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setCollapsed(p => !p)}
              className={`p-2 rounded-lg transition-colors
                ${isDark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div>
              <h1 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}
                  style={{ fontFamily: "Syne, sans-serif" }}>
                {currentPage?.label || "Dashboard"}
              </h1>
              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Live</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>

        <footer className={`px-6 py-3 border-t ${isDark ? "border-white/5" : "border-slate-200"}`}>
          <p className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>
            © 2026 Diyaar Analysis Tool. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
