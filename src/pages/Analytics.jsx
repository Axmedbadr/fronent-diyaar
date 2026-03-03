import React, { useState, useEffect } from "react";
import { getStats, getOrders } from "../api/orders";

function Analytics() {
  const [stats, setStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [phoneCount, setPhoneCount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [customerStats, setCustomerStats] = useState({
    newCustomers: 0,
    loyalCustomers: 0,
    uniqueCustomers: 0
  });
  const [loyalCustomersList, setLoyalCustomersList] = useState([]);
  const [searchPhone, setSearchPhone] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [showLoyalList, setShowLoyalList] = useState(false);
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
      
      // Sort orders by date (newest first) and take top 5 for recent orders
      const sortedOrders = [...ordersData].sort((a, b) => 
        new Date(b.orderDate) - new Date(a.orderDate)
      );
      
      setStats(statsData);
      setRecentOrders(sortedOrders.slice(0, 5));
      
      // Count phone numbers in ALL orders
      const ordersWithPhone = ordersData.filter(o => o.phoneNumber).length;
      setPhoneCount(ordersWithPhone);
      
      // Calculate total orders
      const total = statsData.reduce((acc, curr) => acc + curr.count, 0);
      setTotalOrders(total);

      // Analyze new vs loyal customers based on phone numbers
      const { newCustomers, loyalCustomers, uniqueCustomers, loyalList } = analyzeCustomerTypes(ordersData);
      
      setCustomerStats({
        newCustomers,
        loyalCustomers,
        uniqueCustomers
      });
      
      setLoyalCustomersList(loyalList);

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCustomerTypes = (orders) => {
    // Create a map to track customer order history
    const customerMap = new Map();
    
    // Sort orders by date (oldest first) to find first appearance
    const sortedByDate = [...orders].sort((a, b) => 
      new Date(a.orderDate) - new Date(b.orderDate)
    );

    // Track each customer's order history
    sortedByDate.forEach(order => {
      if (order.phoneNumber) {
        if (!customerMap.has(order.phoneNumber)) {
          customerMap.set(order.phoneNumber, {
            phone: order.phoneNumber,
            customerName: order.customerName,
            orders: [],
            firstOrder: order.orderDate,
            lastOrder: order.orderDate,
            orderCount: 0
          });
        }
        
        const customer = customerMap.get(order.phoneNumber);
        customer.orders.push(order);
        customer.orderCount++;
        customer.lastOrder = order.orderDate;
      }
    });

    // Calculate statistics
    const uniqueCustomers = customerMap.size;
    
    // Find loyal customers (those with more than 1 order)
    const loyalList = Array.from(customerMap.values())
      .filter(customer => customer.orderCount > 1)
      .sort((a, b) => b.orderCount - a.orderCount);

    const loyalCustomers = loyalList.length;

    // Count new vs loyal in recent orders
    let newCustomers = 0;
    let loyalInRecent = 0;

    recentOrders.forEach(order => {
      if (order.phoneNumber) {
        const customer = customerMap.get(order.phoneNumber);
        if (customer) {
          // If this is their first order (only 1 order total), they're new
          if (customer.orderCount === 1) {
            newCustomers++;
          } else {
            loyalInRecent++;
          }
        }
      }
    });

    return {
      newCustomers,
      loyalCustomers: loyalInRecent, // Loyal customers in recent orders
      uniqueCustomers,
      loyalList // Full list of loyal customers (for display)
    };
  };

  const handleSearchByPhone = () => {
    if (!searchPhone.trim()) {
      setSearchResult(null);
      return;
    }

    // Search in loyal customers list
    const found = loyalCustomersList.find(customer => 
      customer.phone.includes(searchPhone)
    );

    if (found) {
      setSearchResult(found);
    } else {
      setSearchResult({ notFound: true, phone: searchPhone });
    }
  };

  const clearSearch = () => {
    setSearchPhone("");
    setSearchResult(null);
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  // Calculate loyalty rate (ensuring it's between 0-100%)
  const loyaltyRate = customerStats.uniqueCustomers > 0
    ? Math.min(100, (loyalCustomersList.length / customerStats.uniqueCustomers) * 100).toFixed(1)
    : 0;

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
          <p className="big-number">{phoneCount}</p>
          <small>{((phoneCount/totalOrders) * 100).toFixed(1)}% of orders</small>
        </div>
      </div>

      {/* Customer Statistics Cards */}
      <div className="customer-stats">
        <h3>👥 Customer Analysis</h3>
        <div className="customer-cards">
          <div className="customer-card new">
            <div className="customer-icon">🆕</div>
            <div className="customer-info">
              <h4>New Customers</h4>
              <p className="big-number">{customerStats.newCustomers}</p>
              <small>In recent orders</small>
            </div>
          </div>

          <div 
            className="customer-card loyal clickable"
            onClick={() => setShowLoyalList(!showLoyalList)}
          >
            <div className="customer-icon">⭐</div>
            <div className="customer-info">
              <h4>Loyal Customers</h4>
              <p className="big-number">{loyalCustomersList.length}</p>
              <small>Click to {showLoyalList ? 'hide' : 'view'} list</small>
            </div>
          </div>

          <div className="customer-card retention">
            <div className="customer-icon">📊</div>
            <div className="customer-info">
              <h4>Loyalty Rate</h4>
              <p className="big-number">{loyaltyRate}%</p>
              <small>Of all customers ({loyalCustomersList.length} of {customerStats.uniqueCustomers})</small>
            </div>
          </div>
        </div>
      </div>

      {/* Loyal Customers List (Collapsible) */}
      {showLoyalList && (
        <div className="loyal-customers-section">
          <h4>⭐ Loyal Customers ({loyalCustomersList.length})</h4>
          
          {/* Search by Phone */}
          <div className="phone-search">
            <input
              type="text"
              placeholder="Search loyal customer by phone number..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="phone-search-input"
            />
            <button onClick={handleSearchByPhone} className="search-btn">🔍 Search</button>
            {searchPhone && <button onClick={clearSearch} className="clear-search-btn">✕ Clear</button>}
          </div>

          {/* Search Result */}
          {searchResult && (
            <div className="search-result">
              {searchResult.notFound ? (
                <p className="not-found">❌ No loyal customer found with phone: {searchResult.phone}</p>
              ) : (
                <div className="customer-detail">
                  <h5>⭐ Loyal Customer Found:</h5>
                  <p><strong>Name:</strong> {searchResult.customerName}</p>
                  <p><strong>Phone:</strong> {searchResult.phone}</p>
                  <p><strong>Total Orders:</strong> {searchResult.orderCount}</p>
                  <p><strong>First Order:</strong> {new Date(searchResult.firstOrder).toLocaleDateString()}</p>
                  <p><strong>Last Order:</strong> {new Date(searchResult.lastOrder).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          )}

          {/* Loyal Customers Table */}
          <div className="table-responsive">
            <table className="loyal-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>Total Orders</th>
                  <th>First Order</th>
                  <th>Last Order</th>
                </tr>
              </thead>
              <tbody>
                {loyalCustomersList.map((customer, index) => (
                  <tr key={index}>
                    <td><strong>{customer.customerName}</strong></td>
                    <td>📞 {customer.phone}</td>
                    <td className="order-count">{customer.orderCount}</td>
                    <td>{new Date(customer.firstOrder).toLocaleDateString()}</td>
                    <td>{new Date(customer.lastOrder).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
          <h3>Recent Orders with Customer Status</h3>
          <ul className="recent-list">
            {recentOrders.map(order => {
              // Determine if this is a new or loyal customer
              const isLoyal = loyalCustomersList.some(c => 
                c.phone === order.phoneNumber
              );
              
              return (
                <li key={order._id} className={isLoyal ? 'loyal-customer' : 'new-customer'}>
                  <span className="recent-name">{order.customerName}</span>
                  <span className="customer-badge">
                    {order.phoneNumber ? (
                      isLoyal ? '⭐ Loyal' : '🆕 New'
                    ) : (
                      '📱 No Phone'
                    )}
                  </span>
                  <span className={`recent-type ${order.type.toLowerCase()}`}>
                    {order.type}
                  </span>
                </li>
              );
            })}
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
    'Pre-Urban': '#8e24aa',
    'SOFHA Health Centers': '#c62828'
  };
  return colors[type] || '#999';
}

export default Analytics;