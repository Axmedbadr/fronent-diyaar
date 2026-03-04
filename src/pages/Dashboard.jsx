import React, { useState } from "react";
import OrderForm from "../components/OrderForm";
import OrdersList from "../components/OrdersList";
import OrderStats from "../components/OrderStats";

export default function Dashboard() {
  const [refreshList, setRefreshList] = useState(false);
  const [showForm, setShowForm] = useState(true); // For mobile toggle

  const handleOrderAdded = () => {
    setRefreshList(prev => !prev);
  };

  return (
    <div className="dashboard">
      {/* Stats at the top - full width */}
      <div className="stats-wrapper">
        <OrderStats />
      </div>

      {/* Main content area with two columns */}
      <div className="dashboard-main">
        {/* Left Column - Form (30% width) */}
        <div className={`form-wrapper ${!showForm ? 'hidden-mobile' : ''}`}>
          <div className="form-header">
            <h3>➕ Add New Order</h3>
            <button 
              className="mobile-toggle"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '→' : '←'}
            </button>
          </div>
          <OrderForm onOrderAdded={handleOrderAdded} />
        </div>

        {/* Right Column - Orders List (70% width) */}
        <div className={`list-wrapper ${showForm ? '' : 'full-width'}`}>
          <OrdersList refresh={refreshList} />
        </div>
      </div>

      {/* Mobile quick add button (floating) */}
      <button 
        className="mobile-add-btn"
        onClick={() => setShowForm(true)}
        style={{ display: showForm ? 'none' : 'flex' }}
      >
        ➕
      </button>
    </div>
  );
}