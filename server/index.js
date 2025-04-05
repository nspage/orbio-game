const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const crypto = require('crypto');
require('dotenv').config();

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
        const { hash, ...data } = req.query;
        
        // If no Telegram bot token is set, bypass verification for testing
        if (!process.env.TELEGRAM_BOT_TOKEN) {
            console.log('No Telegram bot token set. Bypassing verification for testing.');
            return res.json({ isValid: true, userData: data });
        }
        
        // Sort data alphabetically
        const dataCheckString = Object.keys(data)
            .sort()
            .map(key => `${key}=${data[key]}`)
            .join('\n');
        
        // Create a secret key by hashing the bot token
        const secretKey = crypto
            .createHash('sha256')
            .update(process.env.TELEGRAM_BOT_TOKEN)
            .digest();
        
        // Calculate HMAC-SHA-256 signature using the secret key
        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');
        
        // Verify that the calculated hash matches the received hash
        const isValid = calculatedHash === hash;
        
        res.json({ 
            isValid,
            userData: isValid ? data : null
        });
    } catch (error) {
        console.error('Error verifying Telegram auth:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// TON wallet verification endpoint
app.post('/api/verify-ton-signature', express.json(), (req, res) => {
    // In a real implementation, this would verify the TON blockchain signature
    // For this example, we'll just return success
    res.json({ verified: true });
});