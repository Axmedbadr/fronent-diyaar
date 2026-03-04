import axios from "axios";

// Use Railway URL as default
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://diyaar-project-customer-analysis-tool-production.up.railway.app";
const API_URL = `${API_BASE_URL}/api/orders`;

console.log('🌐 API Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Fetch all orders with optional filters
export const getOrders = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.type) params.append("type", filters.type);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    
    const queryString = params.toString() ? `/?${params.toString()}` : '/';
    const response = await api.get(queryString);
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

// Add new order with items
export const addOrder = async (order) => {
  try {
    console.log('➕ Adding new order:', order);
    const response = await api.post("/", order);
    return response.data;
  } catch (error) {
    console.error("Error adding order:", error);
    throw error;
  }
};

// Get statistics by order type
export const getStats = async () => {
  try {
    const response = await api.get("/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching stats:", error);
    throw error;
  }
};

// Get popular items statistics
export const getPopularItems = async () => {
  try {
    const response = await api.get("/stats/items");
    return response.data;
  } catch (error) {
    console.error("Error fetching popular items:", error);
    throw error;
  }
};

// Update order
export const updateOrder = async (id, order) => {
  try {
    const response = await api.put(`/${id}`, order);
    return response.data;
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

// Delete order
export const deleteOrder = async (id) => {
  try {
    const response = await api.delete(`/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
};

// Search orders by item name
export const searchOrdersByItem = async (itemName) => {
  try {
    const response = await api.get(`/search/item?name=${encodeURIComponent(itemName)}`);
    return response.data;
  } catch (error) {
    console.error("Error searching orders by item:", error);
    throw error;
  }
};

// Get customer history by phone
export const getCustomerHistory = async (phone) => {
  try {
    const response = await api.get(`/customer/${phone}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching customer history:", error);
    throw error;
  }
};

// Test connection
export const testConnection = async () => {
  try {
    const response = await api.get('/');
    return true;
  } catch (error) {
    console.error('API connection failed:', error.message);
    return false;
  }
};