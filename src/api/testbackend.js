// test-api.js
const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing API connection...');
    const response = await axios.get('http://localhost:5000/api/orders/stats');
    console.log('✅ API is working!');
    console.log('Stats:', response.data);
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('👉 Make sure your backend server is running on port 5000');
    }
  }
}

testAPI();