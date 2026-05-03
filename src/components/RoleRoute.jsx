import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "./Layout";

/**
 * RoleRoute — wraps a page and only renders it if the user has one of the allowed roles.
 *
 * Usage:
 *   <RoleRoute roles={["staff", "admin"]}><Analytics /></RoleRoute>
 *   <RoleRoute roles={["admin"]}><Users /></RoleRoute>
 */
export default function RoleRoute({ children, roles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isDark } = useTheme();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = roles.some(r => user?.roles?.includes(r));

  if (!hasAccess) {
    const roleLabel = user?.roles?.[0] === "admin" ? "Administrator"
                    : user?.roles?.[0] === "staff"  ? "Staff+"
                    : "Staff";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
             style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
          🔒
        </div>
        <div>
          <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}
              style={{ fontFamily: "Syne, sans-serif" }}>
            Access Restricted
          </h2>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Your role <span className="font-semibold text-blue-400">({roleLabel})</span> doesn't have permission to view this page.
          </p>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
            Required: {roles.join(" or ")}
          </p>
        </div>
        <a href="/"
          className="btn-primary text-sm px-6 py-2">
          ← Back to Dashboard
        </a>
      </div>
    );
  }

  return children;
}
