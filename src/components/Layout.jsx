import React from "react";
import { useAuth } from "../context/AuthContext";


export default function Layout({ children }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <h1>📊 Diyaar Orders Management System</h1>
          <p className="subtitle">Manage and analyze your customer orders</p>
          {isAuthenticated && (
            <div className="auth-header-row">
              <span className="auth-user">Signed in as {user?.name || user?.email}</span>
              <button className="logout-btn" onClick={logout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      
      <main className="main">
        <div className="container">
          {children}
        </div>
      </main>
      
      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 Diyaar Analysis Tool. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}