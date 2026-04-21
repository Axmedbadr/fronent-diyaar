import React, { useState, useEffect } from "react";
import { getStats } from "../api/orders";

// Display names
const TYPE_DISPLAY_NAMES = {
  "Individuals": "👤 INDIVIDUALS",
  "Shops": "🏪 SHOPS",
  "Supermarkets": "🛒 SUPERMARKETS",
  "Pre-Urban": "🏘️ PRE-URBAN",
  "SOFHA Health Centers": "🏥 SOFHA HEALTH CENTERS",
  "Community-Women": "👩‍👩‍👧‍👧 COMMUNITY WOMEN"
};

// Colors
const TYPE_COLORS = {
  "Individuals": { bg: "#3b82f6", light: "#dbeafe" },
  "Shops": { bg: "#22c55e", light: "#dcfce7" },
  "Supermarkets": { bg: "#a855f7", light: "#f3e8ff" },
  "Pre-Urban": { bg: "#f59e0b", light: "#fed7aa" },
  "SOFHA Health Centers": { bg: "#ec4899", light: "#fce7f3" },
  "Community-Women": { bg: "#8b5cf6", light: "#ede9fe" }
};

const EXPECTED_CATEGORIES = [
  "Individuals",
  "Shops",
  "Supermarkets",
  "Pre-Urban",
  "SOFHA Health Centers",
  "Community-Women"
];

export default function OrderStats() {
  const [stats, setStats] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getStats();
      console.log("📊 API data:", data);

      // ✅ Validate API data
      const isValid = EXPECTED_CATEGORIES.every(cat =>
        data.some(item => item._id === cat && typeof item.count === "number")
      );

      if (!isValid) {
        throw new Error("Invalid stats data from API");
      }

      setStats(data);

      const sum = data.reduce((acc, curr) => acc + curr.count, 0);
      setTotal(sum);

    } catch (err) {
      console.error("❌ Stats error:", err);
      setError(true);
      setStats([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Loading UI
  if (loading) {
    return (
      <div className="stats-loading">
        <p>Loading statistics...</p>
      </div>
    );
  }

  // ❌ Error UI (sida aad rabtay)
  if (error) {
    return (
      <div className="stats-error">
        <p>⚠️ System cilad ayaa ku jirta. Fadlan dib isku day.</p>
      </div>
    );
  }

  // 📊 Calculations
  const topCategory = stats.reduce((max, stat) =>
    stat.count > max.count ? stat : max, stats[0]);

  const average = Math.round(total / stats.length);

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h3>📊 Order Statistics</h3>
        <p>
          Total Orders: <strong>{total}</strong> | Categories: <strong>{stats.length}</strong>
        </p>
      </div>

      <div className="stats-grid">
        {stats.map(stat => {
          const color = TYPE_COLORS[stat._id] || { bg: "#64748b", light: "#f1f5f9" };
          const percentage = total > 0
            ? ((stat.count / total) * 100).toFixed(1)
            : "0.0";

          return (
            <div
              key={stat._id}
              className="stat-card"
              style={{
                borderLeft: `8px solid ${color.bg}`,
                background: `linear-gradient(145deg, ${color.light}, white)`
              }}
            >
              <div className="stat-label">
                {TYPE_DISPLAY_NAMES[stat._id] || stat._id}
              </div>

              <div className="stat-value" style={{ color: color.bg }}>
                {stat.count}
              </div>

              <div className="stat-footer">
                <div style={{ color: color.bg }}>
                  {percentage}% of total
                </div>

                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color.bg
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick stats */}
      <div className="quick-stats">
        <p>📊 Average: {average} orders</p>
        <p>🔥 Top: {TYPE_DISPLAY_NAMES[topCategory._id]} ({topCategory.count})</p>
      </div>
    </div>
  );
}