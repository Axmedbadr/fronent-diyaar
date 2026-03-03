import React, { useState, useEffect } from "react";
import { getOrders, deleteOrder } from "../api/orders";
import ExcelJS from 'exceljs';

export default function OrdersList({ refresh }) {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
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
        order.type.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Export to Excel using exceljs
  const exportToExcel = async () => {
    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Dr. Asma Analysis Tool';
      workbook.lastModifiedBy = 'Dr. Asma Analysis Tool';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // Add worksheet
      const worksheet = workbook.addWorksheet('Orders', {
        properties: { tabColor: { argb: 'FF2C3E50' } },
        views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
      });
      
      // Add headers with styling
      const headers = ['Date', 'Customer Name', 'Phone Number', 'Order Type'];
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
        { width: 30 },
        { width: 20 },
        { width: 20 }
      ];
      
      // Add data rows
      filteredOrders.forEach((order, index) => {
        const row = worksheet.addRow([
          new Date(order.orderDate).toLocaleDateString(),
          order.customerName,
          order.phoneNumber || '-',
          order.type
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
        
        // Alternate row colors for better readability
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
      
      // Add empty row
      worksheet.addRow([]);
      
      // Add summary row
      const summaryRow = worksheet.addRow(['TOTAL:', '', '', `${filteredOrders.length} orders`]);
      summaryRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true, size: 11 };
        cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'right' : 'left' };
        if (colNumber === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE699' }
          };
        }
      });
      
      // Merge cells for total row
      worksheet.mergeCells(`A${summaryRow.number}:B${summaryRow.number}`);
      
      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Create download link
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
              placeholder="Search by customer, phone, or type..."
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
          <button onClick={exportToExcel} className="export-btnexcel-btn" title="Export to Excel">
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
                <th>Date</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
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