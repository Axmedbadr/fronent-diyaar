import React, { useState, useEffect } from "react";
import { getStats } from "../api/orders";

const TYPE_DISPLAY_NAMES = {
  "Individuals": "Individuals",
  "Shops": "Shops",
  "Supermarkets": "Supermarkets",
  "Pre-Urban": "Pre-Urban",
  "SOFHA Health Centers": "SOFHA Health Centers"
};

export default function OrderStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
      const sum = data.reduce((acc, curr) => acc + curr.count, 0);
      setTotal(sum);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="stats-loading">Loading statistics...</div>;
  }

  return (
    <div className="stats-container">
      <h3>📊 Order Statistics</h3>
      <div className="stats-grid">
        {stats.map(stat => (
          <div key={stat._id} className="stat-card">
            <div className="stat-label">
              {TYPE_DISPLAY_NAMES[stat._id] || stat._id}
            </div>
            <div className="stat-value">{stat.count}</div>
            <div className="stat-percentage">
              {((stat.count / total) * 100).toFixed(1)}%
            </div>
          </div>
        ))}
        <div className="stat-card total">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{total}</div>
          <div className="stat-percentage">100%</div>
        </div>
      </div>
    </div>
  );
}