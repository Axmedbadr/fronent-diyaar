import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import "./styles/main.css"


function App() {
  return (
    <Router>
      <Layout>
        <nav className="nav-menu">
          <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""} end>
            Dashboard
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => isActive ? "active" : ""}>
            Analytics
          </NavLink>
        </nav>
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;