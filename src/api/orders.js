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
    fullURL: `${request.baseURL}${request.url}`,
    data: request.data // This will show the items being sent
  });
  return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('✅ Response Success:', {
      status: response.status,
      url: response.config.url,
      dataCount: Array.isArray(response.data) ? response.data.length : 'N/A',
      sampleData: Array.isArray(response.data) && response.data.length > 0 
        ? { 
            firstOrder: {
              id: response.data[0]._id,
              customerName: response.data[0].customerName,
              itemsCount: response.data[0].items?.length || 0
            }
          }
        : 'No data'
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
    
    // Log items data to verify it's being received
    if (response.data && response.data.length > 0) {
      console.log('📦 Orders received with items:', 
        response.data.map(order => ({
          customer: order.customerName,
          itemsCount: order.items?.length || 0,
          items: order.items || []
        }))
      );
    }
    
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

// Add new order with items
export const addOrder = async (order) => {
  try {
    // Validate that items array is present
    if (!order.items) {
      console.warn('⚠️ Order has no items field, adding empty array');
      order.items = [];
    }
    
    // Validate each item has required fields
    if (order.items.length > 0) {
      order.items.forEach((item, index) => {
        if (!item.itemName) {
          throw new Error(`Item at index ${index} has no itemName`);
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Item at index ${index} has invalid quantity`);
        }
      });
    }
    
    console.log('➕ Adding new order with items:', {
      customerName: order.customerName,
      type: order.type,
      phoneNumber: order.phoneNumber,
      orderDate: order.orderDate,
      itemsCount: order.items.length,
      items: order.items
    });
    
    const response = await api.post("/", order);
    console.log('✅ Order added successfully:', {
      id: response.data._id,
      customerName: response.data.customerName,
      itemsCount: response.data.items?.length || 0
    });
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
    console.log('✏️ Updating order:', id, {
      customerName: order.customerName,
      itemsCount: order.items?.length || 0
    });
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

// Helper function to get orders by item (search functionality)
export const getOrdersByItem = async (itemName) => {
  try {
    console.log('🔍 Searching orders by item:', itemName);
    const response = await api.get(`/search/item?name=${encodeURIComponent(itemName)}`);
    return response.data;
  } catch (error) {
    console.error("Error searching orders by item:", error);
    throw error;
  }
};

// Get popular items statistics
export const getPopularItems = async () => {
  try {
    console.log('📊 Fetching popular items...');
    const response = await api.get("/stats/items");
    return response.data;
  } catch (error) {
    console.error("Error fetching popular items:", error);
    throw error;
  }
};