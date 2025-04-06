// File: server/ton-api.js (create this file)
const axios = require('axios');

// If using TON Access
const TON_API_URL = 'https://tonconsole.com/api/v1/';
const TON_API_KEY = process.env.TON_API_KEY;

async function getBalance(address) {
  try {
    const response = await axios.get(`${TON_API_URL}/${TON_API_KEY}/getAddressBalance`, {
      params: { address }
    });
    return response.data.result;
  } catch (error) {
    console.error('Error fetching TON balance:', error);
    throw error;
  }
}

// Other TON API functions you might need...

module.exports = {
  getBalance,
  // Export other functions...
};