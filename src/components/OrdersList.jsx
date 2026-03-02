import React, { useState, useEffect } from "react";
import { getOrders, deleteOrder } from "../api/orders";


export default function OrdersList({ refresh }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    startDate: "",
    endDate: ""
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders(filters);
      setOrders(data);
      setError("");
    } catch (err) {
      setError("Failed to fetch orders");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [refresh, filters]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    
    try {
      await deleteOrder(id);
      fetchOrders();
    } catch (err) {
      setError("Failed to delete order");
      console.error(err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ type: "", startDate: "", endDate: "" });
  };

  const getTypeClass = (type) => {
    return type.toLowerCase().replace(/\s+/g, '-');
  };

  if (loading && orders.length === 0) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="orders-list-container">
      <div className="orders-header">
        <h2>Orders ({orders.length})</h2>
        
        <div className="filters">
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="Individuals">Individuals</option>
            <option value="Shops">Shops</option>
            <option value="Supermarkets">Supermarkets</option>
            <option value="Pre-Urban">Pre-Urban</option>
          </select>

          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="filter-date"
            placeholder="Start Date"
          />

          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="filter-date"
            placeholder="End Date"
          />

          <button onClick={clearFilters} className="clear-filters-btn">
            Clear
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {orders.length === 0 ? (
        <p className="no-orders">No orders found</p>
      ) : (
        <div className="table-responsive">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                  <td>{order.customerName}</td>
                  <td>{order.phoneNumber || '-'}</td>
                  <td>
                    <span className={`type-badge ${getTypeClass(order.type)}`}>
                      {order.type}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(order._id)}
                      className="delete-btn"
                      title="Delete order"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}