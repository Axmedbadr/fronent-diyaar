import React, { useState, useEffect } from "react";
import { getStats, getOrders } from "../api/orders";


function Analytics() {
  const [stats, setStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [statsData, ordersData] = await Promise.all([
        getStats(),
        getOrders()
      ]);
      setStats(statsData);
      setRecentOrders(ordersData.slice(0, 5));
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  const totalOrders = stats.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="analytics">
      <h2>📈 Analytics Dashboard</h2>
      
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Orders</h3>
          <p className="big-number">{totalOrders}</p>
        </div>
        <div className="summary-card">
          <h3>Order Types</h3>
          <p className="big-number">{stats.length}</p>
        </div>
        <div className="summary-card">
          <h3>With Phone</h3>
          <p className="big-number">
            {recentOrders.filter(o => o.phoneNumber).length}
          </p>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="chart-card">
          <h3>Orders by Type</h3>
          <div className="type-breakdown">
            {stats.map(stat => (
              <div key={stat._id} className="type-bar">
                <span className="type-name">{stat._id}</span>
                <div className="bar-container">
                  <div 
                    className="bar"
                    style={{ 
                      width: `${(stat.count / totalOrders) * 100}%`,
                      backgroundColor: getTypeColor(stat._id)
                    }}
                  />
                </div>
                <span className="type-count">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="recent-card">
          <h3>Recent Orders</h3>
          <ul className="recent-list">
            {recentOrders.map(order => (
              <li key={order._id}>
                <span className="recent-name">{order.customerName}</span>
                <span className={`recent-type ${order.type.toLowerCase()}`}>
                  {order.type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function getTypeColor(type) {
  const colors = {
    'Individuals': '#1976d2',
    'Shops': '#f57c00',
    'Supermarkets': '#388e3c',
    'Pre-Urban': '#8e24aa'
  };
  return colors[type] || '#999';
}

// ✅ ADD THIS DEFAULT EXPORT
export default Analytics;