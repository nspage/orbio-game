// File: server/index.js
// Current code at the top of your file:
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const crypto = require('crypto');
require('dotenv').config();
// Add this new import for rate limiting
// Define rate limiting middleware to protect against abuse
const rateLimit = require("express-rate-limit");
// File: server/index.js
// After adding the rateLimit import (from previous step) and before GameServer:
const express = require("express");
const app = express();
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
app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running...");
});

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
  
  // Your existing line:
  const GameServer = require('./game-server');

// Initialize express app
const app = express();
const server = http.createServer(app);
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

// Initialize game server
const gameServer = new GameServer(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Keep-alive ping to prevent Glitch from sleeping
setInterval(() => {
    console.log("Keep-alive ping");
    if (process.env.PROJECT_DOMAIN) {
        http.get(`https://${process.env.PROJECT_DOMAIN}.glitch.me/`);
    }
}, 280000); // Every 4.6 minutes

// API endpoints for Telegram auth verification
app.get('/api/verify-telegram-auth', (req, res) => {
    try {
}});
// File: server/index.js
// ADD THIS CODE after the Socket.io initialization (after line 38 in the example above):

// Apply security middleware
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