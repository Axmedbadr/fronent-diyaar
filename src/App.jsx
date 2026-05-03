import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout, { ThemeProvider } from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

// Pages
import Dashboard      from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Analytics      from "./pages/Analytics";
import GrowthComparison from "./pages/GrowthComparison";
import Users          from "./pages/Users";
import Settings       from "./pages/Settings";
import Login          from "./pages/Login";

/**
 * Role matrix:
 *   user  (Staff)    → /  only
 *   staff (Staff+)   → /, /admin, /analytics, /growth, /settings
 *   admin            → everything including /users
 */
function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* All authenticated users — Staff, Staff+, Admin */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />

            {/* Staff+ and Admin only */}
            <Route path="/admin" element={
              <RoleRoute roles={["staff", "admin"]}>
                <AdminDashboard />
              </RoleRoute>
            } />

            <Route path="/analytics" element={
              <RoleRoute roles={["staff", "admin"]}>
                <Analytics />
              </RoleRoute>
            } />

            <Route path="/growth" element={
              <RoleRoute roles={["staff", "admin"]}>
                <GrowthComparison />
              </RoleRoute>
            } />

            {/* Admin only */}
            <Route path="/users" element={
              <RoleRoute roles={["admin"]}>
                <Users />
              </RoleRoute>
            } />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
