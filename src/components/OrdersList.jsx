import React, { useState, useEffect } from "react";
import { getOrders, deleteOrder } from "../api/orders";
import ExcelJS from 'exceljs';

export default function OrdersList({ refresh }) {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null); // For expandable rows
  const [filters, setFilters] = useState({
    type: "",
    startDate: "",
    endDate: ""
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders(filters);
      // Sort orders by date in descending order (latest first)
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

  // Handle search filtering
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.phoneNumber && order.phoneNumber.includes(searchTerm)) ||
        order.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Search in items
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

  // Calculate total kg for an order
  const calculateTotalKg = (items) => {
    if (!items || !items.length) return 0;
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  // Export to Excel using exceljs
  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Dr. Asma Analysis Tool';
      workbook.lastModifiedBy = 'Dr. Asma Analysis Tool';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // Create main orders sheet
      const worksheet = workbook.addWorksheet('Orders', {
        properties: { tabColor: { argb: 'FF2C3E50' } },
        views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
      });
      
      // Add headers with styling
      const headers = ['Date', 'Customer Name', 'Phone', 'Type', 'Items', 'Total KG'];
      const headerRow = worksheet.addRow(headers);
      
      // Style the header row
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2C3E50' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      // Set column widths
      worksheet.columns = [
        { width: 15 },
        { width: 25 },
        { width: 15 },
        { width: 15 },
        { width: 40 },
        { width: 10 }
      ];
      
      // Add data rows
      filteredOrders.forEach((order, index) => {
        // Format items list
        const itemsList = order.items && order.items.length > 0
          ? order.items.map(item => `${item.itemName}: ${item.quantity}kg`).join(', ')
          : 'No items';
        
        const totalKg = calculateTotalKg(order.items);
        
        const row = worksheet.addRow([
          new Date(order.orderDate).toLocaleDateString(),
          order.customerName,
          order.phoneNumber || '-',
          order.type,
          itemsList,
          totalKg
        ]);
        
        // Style data rows
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        // Alternate row colors
        if (index % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF5F5F5' }
            };
          });
        }
      });
      
      // Add summary row
      worksheet.addRow([]);
      const totalKgAll = filteredOrders.reduce((sum, order) => sum + calculateTotalKg(order.items), 0);
      const summaryRow = worksheet.addRow(['TOTAL:', '', '', '', `${filteredOrders.length} orders`, `${totalKgAll} kg`]);
      summaryRow.eachCell((cell) => {
        cell.font = { bold: true, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFE699' }
        };
      });
      
      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export to Excel. Please try again.');
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
          {/* Search Bar */}
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
                title="Clear search"
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
            Clear All
          </button>
        </div>

        {/* Export Button */}
        <div className="export-buttons">
          <button onClick={exportToExcel} className="export-btn excel-btn" title="Export to Excel">
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
                <th></th> {/* Expand/collapse icon column */}
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
                  {/* Main order row */}
                  <tr className={expandedOrder === order._id ? 'expanded-row' : ''}>
                    <td>
                      <button 
                        onClick={() => toggleExpand(order._id)}
                        className="expand-btn"
                        title={expandedOrder === order._id ? "Hide items" : "Show items"}
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
                  
                  {/* Expanded items row */}
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
                              <tr className="items-total">
                                <td><strong>Total</strong></td>
                                <td><strong>{calculateTotalKg(order.items)} kg</strong></td>
                              </tr>
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