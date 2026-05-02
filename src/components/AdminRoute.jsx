import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "./Layout";

export default function AdminRoute({ children }) {
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

  const isAdmin = user?.roles?.includes("admin");

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
             style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
          🔒
        </div>
        <div>
          <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}
              style={{ fontFamily: "Syne, sans-serif" }}>
            Access Denied
          </h2>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            You need admin privileges to view this page.
          </p>
        </div>
        <Navigate to="/" replace />
      </div>
    );
  }

  return children;
}
