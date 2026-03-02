import axios from "axios";

// Use Railway URL as default, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://diyaar-project-customer-analysis-tool-production.up.railway.app";
const API_URL = `${API_BASE_URL}/api/orders`;

console.log('🌐 API Base URL:', API_BASE_URL); // For debugging

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Increased to 15 seconds for Railway
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('🚀 Starting Request:', {
    url: request.url,
    method: request.method,
    baseURL: request.baseURL,
    fullURL: `${request.baseURL}${request.url}`
  });
  return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('✅ Response Success:', {
      status: response.status,
      url: response.config.url,
      dataCount: Array.isArray(response.data) ? response.data.length : 'N/A'
    });
    return response;
  },
  error => {
    console.error('❌ API Error:', {
      message: error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

    // Specific error messages for common issues
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout - server took too long to respond');
    } else if (!error.response) {
      console.error('🔌 Network error - server might be down or unreachable');
    } else if (error.response.status === 404) {
      console.error('🔍 Endpoint not found - check if URL is correct');
    } else if (error.response.status === 500) {
      console.error('💥 Server error - something went wrong on the backend');
    }

    return Promise.reject(error);
  }
);

// Fetch all orders with optional filters
export const getOrders = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.type) params.append("type", filters.type);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    
    const queryString = params.toString() ? `/?${params.toString()}` : '/';
    console.log('📦 Fetching orders with params:', filters);
    
    const response = await api.get(queryString);
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

// Add new order
export const addOrder = async (order) => {
  try {
    console.log('➕ Adding new order:', order);
    const response = await api.post("/", order);
    console.log('✅ Order added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error("Error adding order:", error);
    throw error;
  }
};

// Get statistics
export const getStats = async () => {
  try {
    console.log('📊 Fetching statistics...');
    const response = await api.get("/stats");
    console.log('📊 Statistics received:', response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching stats:", error);
    throw error;
  }
};

// Update order
export const updateOrder = async (id, order) => {
  try {
    console.log('✏️ Updating order:', id, order);
    const response = await api.put(`/${id}`, order);
    console.log('✅ Order updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

// Delete order
export const deleteOrder = async (id) => {
  try {
    console.log('🗑️ Deleting order:', id);
    const response = await api.delete(`/${id}`);
    console.log('✅ Order deleted successfully');
    return response.data;
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
};

// Test connection function (useful for debugging)
export const testConnection = async () => {
  try {
    console.log('🔍 Testing API connection...');
    const response = await api.get('/');
    console.log('✅ API connection successful:', response.data);
    return true;
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    return false;
  }
};