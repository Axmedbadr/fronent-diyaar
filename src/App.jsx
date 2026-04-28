import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import "./styles/main.css"


function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Layout>
        {isAuthenticated && (
          <nav className="nav-menu">
            <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""} end>
              Dashboard
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => isActive ? "active" : ""}>
              Analytics
            </NavLink>
          </nav>
        )}
        
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;