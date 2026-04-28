import { apiClient } from "./client";

// ==================== BASIC CRUD OPERATIONS ====================

// Fetch all orders with optional filters
export const getOrders = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.type) params.append("type", filters.type);
    if (filters.area) params.append("area", filters.area);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    
    const queryString = params.toString() ? `/?${params.toString()}` : '/';
    const response = await apiClient.get(`/orders${queryString}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

// Add new order with items and area
export const addOrder = async (order) => {
  try {
    console.log('➕ Adding new order:', order);
    const response = await apiClient.post("/orders/", order);
    return response.data;
  } catch (error) {
    console.error("Error adding order:", error);
    throw error;
  }
};

// Update order
export const updateOrder = async (id, order) => {
  try {
    const response = await apiClient.put(`/orders/${id}`, order);
    return response.data;
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

// Delete order
export const deleteOrder = async (id) => {
  try {
    const response = await apiClient.delete(`/orders/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
};

// ==================== STATISTICS & ANALYTICS ====================

// Get statistics by order type (NOW INCLUDES COMMUNITY WOMEN!)
export const getStats = async () => {
  try {
    const response = await apiClient.get("/orders/stats");
    console.log("📊 Stats from API:", response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error("Error fetching stats:", error);
    throw error;
  }
};

// Get statistics by area
export const getAreaStats = async () => {
  try {
    const response = await apiClient.get("/orders/stats/area");
    return response.data;
  } catch (error) {
    console.error("Error fetching area stats:", error);
    throw error;
  }
};

// Get statistics by type and area combined
export const getTypeAreaStats = async () => {
  try {
    const response = await apiClient.get("/orders/stats/type-area");
    return response.data;
  } catch (error) {
    console.error("Error fetching type-area stats:", error);
    throw error;
  }
};

// Get popular items statistics (with optional area filter)
export const getPopularItems = async (area = null) => {
  try {
    let url = "/orders/stats/items";
    if (area) {
      url += `?area=${encodeURIComponent(area)}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching popular items:", error);
    throw error;
  }
};

// ==================== SEARCH & CUSTOMER ====================

// Search orders by item name (with optional area filter)
export const searchOrdersByItem = async (itemName, area = null) => {
  try {
    let url = `/orders/search/item?name=${encodeURIComponent(itemName)}`;
    if (area) {
      url += `&area=${encodeURIComponent(area)}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error("Error searching orders by item:", error);
    throw error;
  }
};

// Get customer history by phone
export const getCustomerHistory = async (phone) => {
  try {
    const response = await apiClient.get(`/orders/customer/${phone}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching customer history:", error);
    throw error;
  }
};

// ==================== UTILITY FUNCTIONS ====================

// Test connection
export const testConnection = async () => {
  try {
    const response = await apiClient.get("/orders/");
    console.log("✅ API Connection test:", response.data);
    return true;
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    return false;
  }
};

// Get orders by specific area
export const getOrdersByArea = async (area) => {
  try {
    const response = await apiClient.get(`/orders/?area=${encodeURIComponent(area)}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching orders for area ${area}:`, error);
    throw error;
  }
};

// Get orders by type in specific area
export const getOrdersByTypeAndArea = async (type, area) => {
  try {
    const response = await apiClient.get(
      `/orders/?type=${encodeURIComponent(type)}&area=${encodeURIComponent(area)}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching orders for type ${type} in area ${area}:`, error);
    throw error;
  }
};

// ==================== EXPORT ALL FUNCTIONS ====================
export default {
  getOrders,
  addOrder,
  updateOrder,
  deleteOrder,
  getStats,
  getAreaStats,
  getTypeAreaStats,
  getPopularItems,
  searchOrdersByItem,
  getCustomerHistory,
  testConnection,
  getOrdersByArea,
  getOrdersByTypeAndArea
};