const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const crypto = require('crypto');
const axios = require('axios');
const rateLimit = require("express-rate-limit");
const tonApi = require('./ton-api');
require('dotenv').config();

// Initialize express app
const app = express();
const server = http.createServer(app);
// Disable caching for all routes
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, must-revalidate");
    next();
  });  
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// Serve static files and other routes
app.use(express.static("client"));


const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: "Too many requests from this IP, please try again after 15 minutes"
  });
  // Create a stricter rate limit for sensitive authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 login attempts per hour
    standardHeaders: true,
    message: "Too many login attempts, please try again later"
  });
  
const GameServer = require('./game-server');

const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Apply rate limiting to all requests
app.use(apiLimiter);

// Add security headers to prevent common web vulnerabilities
app.use((req, res, next) => {
  // Helps prevent XSS attacks
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Helps prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Prevents browser from MIME-sniffing a response from declared content type
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Sets Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Apply the stricter rate limit to authentication endpoints
app.use('/api/verify-telegram-auth', authLimiter);
// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, '../client')));

// Serve the game
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});
// File: server/index.js
// Add after your existing API endpoints

// NFT ownership verification endpoint
app.post('/api/verify-nft-ownership', express.json(), async (req, res) => {
    try {
      const { userAddress, collectionAddress, nftIndex } = req.body;
      
      // Use TON API to verify ownership
      // This is a simplified example - in production, use proper TON API
      const isOwned = await verifyNFTOwnershipOnChain(userAddress, collectionAddress, nftIndex);
      
      res.json({ owned: isOwned });
    } catch (error) {
      console.error('Error verifying NFT ownership:', error);
      res.status(500).json({ error: 'Failed to verify NFT ownership' });
    }
  });
  
  // Get NFT image endpoint
  app.get('/api/get-nft-image', async (req, res) => {
    try {
      const { collection, index } = req.query;
      
      // Use TON API to get NFT metadata
      // This is a simplified example - in production, use proper TON API
      const metadata = await getNFTMetadata(collection, index);
      
      res.json({ 
        imageUrl: metadata.image,
        metadata: metadata
      });
    } catch (error) {
      console.error('Error getting NFT image:', error);
      res.status(500).json({ error: 'Failed to get NFT image' });
    }
  });
  
  // Helper function to verify NFT ownership on TON blockchain
async function verifyNFTOwnershipOnChain(userAddress, collectionAddress, nftIndex) {
    // Example implementation using TONCenter API
    try {
      const response = await axios.get('https://toncenter.com/api/v2/getAddressBalance', {
        params: {
          address: userAddress,
          api_key: process.env.TON_API_KEY
        }
      });
      return true; // Replace with actual verification result
    } catch (error) {
      console.error('TON API error:', error);
      return false;
    }
  }

// Helper function to get NFT metadata
async function getNFTMetadata(collectionAddress, nftIndex) {
  try {
    // For TON NFTs, you might need multiple calls:
    // 1. Get the NFT item address from collection and index
    // 2. Get the content URI from the NFT item
    // 3. Fetch the actual metadata from that URI (might be on IPFS)
    const response = await axios.get(`https://api.ton.cat/v1/nft/${collectionAddress}/${nftIndex}`, {
      headers: { 'Authorization': `Bearer ${process.env.TON_API_KEY}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    // Return placeholder data in case of error
    return {
      name: `NFT #${nftIndex}`,
      image: 'https://via.placeholder.com/500',
      description: 'NFT description not available'
    };
  }
  // For testing, return placeholder data
  return {
    name: `Test NFT #${nftIndex}`,
    image: 'https://via.placeholder.com/500',
    description: 'A test NFT'
  };
}

// File: server/index.js
// Add after your existing API endpoints

// NFT ownership verification endpoint
app.post('/api/verify-nft-ownership', express.json(), async (req, res) => {
  try {
    const { userAddress, collectionAddress, nftIndex } = req.body;
    
    // Use TON API to verify ownership
    // This is a simplified example - in production, use proper TON API
    const isOwned = await verifyNFTOwnershipOnChain(userAddress, collectionAddress, nftIndex);
    
    res.json({ owned: isOwned });
  } catch (error) {
    console.error('Error verifying NFT ownership:', error);
    res.status(500).json({ error: 'Failed to verify NFT ownership' });
  }
});

// Get NFT image endpoint
app.get('/api/get-nft-image', async (req, res) => {
  try {
    const { collection, index } = req.query;
    
    // Use TON API to get NFT metadata
    // This is a simplified example - in production, use proper TON API
    const metadata = await getNFTMetadata(collection, index);
    
    res.json({ 
      imageUrl: metadata.image,
      metadata: metadata
    });
  } catch (error) {
    console.error('Error getting NFT image:', error);
    res.status(500).json({ error: 'Failed to get NFT image' });
  }
});

// Helper function to verify NFT ownership on TON blockchain
async function verifyNFTOwnershipOnChain(userAddress, collectionAddress, nftIndex) {
  // For now, just return true for testing
  // In a real implementation, you would query the TON blockchain
  try {
    // If you're using TONCenter
    const response = await axios.get('https://toncenter.com/api/v2/getAddressBalance', {
      params: {
        address: userAddress,
        api_key: process.env.TON_API_KEY
      }
    });
    
    // For testing, return true
    // In production, implement proper ownership verification
    return true;
  } catch (error) {
    console.error('Error in TON API call:', error);
    return false;
  }
}

// Helper function to get NFT metadata
async function getNFTMetadata(collectionAddress, nftIndex) {
  try {
    // For TON NFTs, you might need multiple calls:
    // 1. Get the NFT item address from collection and index
    // 2. Get the content URI from the NFT item
    // 3. Fetch the actual metadata from that URI (might be on IPFS)
    const response = await axios.get(`https://api.ton.cat/v1/nft/${collectionAddress}/${nftIndex}`, {
      headers: { 'Authorization': `Bearer ${process.env.TON_API_KEY}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    // Return placeholder data in case of error
    return {
      name: `NFT #${nftIndex}`,
      image: 'https://via.placeholder.com/500',
      description: 'NFT description not available'
    };
  }
}

// Initialize game server
const gameServer = new GameServer(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Keep-alive ping to prevent server from sleeping
setInterval(() => {
    console.log("Keep-alive ping");
    if (process.env.PROJECT_DOMAIN) {
        http.get(`https://${process.env.PROJECT_DOMAIN}.glitch.me/`);
    }
}, 280000); // Every 4.6 minutes

// Telegram auth verification endpoint
app.get('/api/verify-telegram-auth', (req, res) => {
  try {
    // TODO: Implement Telegram auth verification
    res.json({ verified: true });
  } catch (error) {
    console.error('Error verifying Telegram auth:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TON wallet verification endpoint
app.post('/api/verify-ton-signature', express.json(), (req, res) => {
    try {
        // Get the signature and message from the request body
        const { signature, message, address } = req.body;
        
        // For development/testing: simply return success
        // In production, you would verify the signature against the TON blockchain
        console.log('TON authentication request received:', { address });
        
        // Return success response
        res.json({ 
            verified: true,
            address: address
        });
    } catch (error) {
        console.error('Error verifying TON signature:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});