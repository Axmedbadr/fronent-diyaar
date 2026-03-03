import React from "react";


export default function Layout({ children }) {
  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <h1>📊 Diyaar  Analysis Tool</h1>
          <p className="subtitle">Manage and analyze your customer orders</p>
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