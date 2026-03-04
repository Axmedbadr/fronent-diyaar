import React, { useState, useEffect } from "react";
import { getOrders, deleteOrder } from "../api/orders";
import ExcelJS from 'exceljs';

export default function OrdersList({ refresh }) {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [filters, setFilters] = useState({
    type: "",
    startDate: "",
    endDate: ""
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders(filters);
      const sortedData = [...data].sort((a, b) => 
        new Date(b.orderDate) - new Date(a.orderDate)
      );
      setOrders(sortedData);
      setFilteredOrders(sortedData);
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

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.phoneNumber && order.phoneNumber.includes(searchTerm)) ||
        order.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.items && order.items.some(item => 
          item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

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
    setSearchTerm("");
  };

  const getTypeClass = (type) => {
    return type.toLowerCase().replace(/\s+/g, '-');
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const calculateTotalKg = (items) => {
    if (!items || !items.length) return 0;
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Dr. Asma Analysis Tool';
      
      const worksheet = workbook.addWorksheet('Orders');
      
      const headers = ['Date', 'Customer Name', 'Phone', 'Type', 'Items', 'Total KG'];
      const headerRow = worksheet.addRow(headers);
      
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2C3E50' }
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      });
      
      worksheet.columns = [
        { width: 15 },
        { width: 25 },
        { width: 15 },
        { width: 15 },
        { width: 40 },
        { width: 10 }
      ];
      
      filteredOrders.forEach((order, index) => {
        const itemsList = order.items && order.items.length > 0
          ? order.items.map(item => `${item.itemName}: ${item.quantity}kg`).join(', ')
          : 'No items';
        
        const totalKg = calculateTotalKg(order.items);
        
        worksheet.addRow([
          new Date(order.orderDate).toLocaleDateString(),
          order.customerName,
          order.phoneNumber || '-',
          order.type,
          itemsList,
          totalKg
        ]);
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export to Excel');
    }
  };

  if (loading && orders.length === 0) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="orders-list-container">
      <div className="orders-header">
        <h2>Orders ({filteredOrders.length})</h2>
        
        <div className="filters">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by customer, phone, type, or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")} 
                className="clear-search-btn"
              >
                ✕
              </button>
            )}
          </div>

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
            <option value="SOFHA Health Centers">SOFHA Health Centers</option>
          </select>

          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="filter-date"
          />

          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="filter-date"
          />

          <button onClick={clearFilters} className="clear-filters-btn">
            Clear All
          </button>
        </div>

        <div className="export-buttons">
          <button onClick={exportToExcel} className="export-btn excel-btn">
            📊 Export to Excel
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {filteredOrders.length === 0 ? (
        <p className="no-orders">
          {searchTerm ? "No orders match your search" : "No orders found"}
        </p>
      ) : (
        <div className="table-responsive">
          <table className="orders-table">
            <thead>
              <tr>
                <th></th>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Items</th>
                <th>Total KG</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <React.Fragment key={order._id}>
                  <tr>
                    <td>
                      <button 
                        onClick={() => toggleExpand(order._id)}
                        className="expand-btn"
                      >
                        {expandedOrder === order._id ? '▼' : '▶'}
                      </button>
                    </td>
                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td>{order.customerName}</td>
                    <td>{order.phoneNumber || '-'}</td>
                    <td>
                      <span className={`type-badge ${getTypeClass(order.type)}`}>
                        {order.type}
                      </span>
                    </td>
                    <td>
                      {order.items && order.items.length > 0 ? (
                        <span className="items-count">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="no-items">No items</span>
                      )}
                    </td>
                    <td className="total-kg">{calculateTotalKg(order.items)} kg</td>
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
                  
                  {expandedOrder === order._id && order.items && order.items.length > 0 && (
                    <tr className="items-detail-row">
                      <td colSpan="8">
                        <div className="items-detail">
                          <h4>Order Items:</h4>
                          <table className="items-detail-table">
                            <thead>
                              <tr>
                                <th>Item Name</th>
                                <th>Quantity (kg)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.itemName}</td>
                                  <td>{item.quantity} kg</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}