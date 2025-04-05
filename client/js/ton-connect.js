// TON Connect Integration

// TON Connect instance
let tonConnector = null;
let tonWallet = null;

// Initialize TON Connect
async function initTONConnect() {
    // Initialize TON Connect SDK
    try {
        // Use window.TonConnect if available from CDN
        if (window.TonConnect) {
            tonConnector = new window.TonConnect.TonConnect({
                manifestUrl: 'https://raw.githubusercontent.com/yourusername/orbio/main/tonconnect-manifest.json'
            });
        } else {
            console.error('TonConnect SDK not available');
            return;
        }
        
        // Restore connection if one exists
        await restoreConnection();
        
        // Listen for connection state changes
        tonConnector.onStatusChange((wallet) => {
            handleConnectionChange(wallet);
        });
    } catch (e) {
        console.error('Error initializing TON Connect:', e);
    }
}

// Restore existing connection
async function restoreConnection() {
    try {
        const activeWallet = await tonConnector.getWallet();
        
        if (activeWallet) {
            console.log('Restored TON wallet connection:', activeWallet);
            tonWallet = activeWallet;
            
            // Update UI to show connected state
            document.getElementById('ton-connect-button').textContent = 'TON Wallet Connected';
        }
    } catch (e) {
        console.error('Error restoring TON connection:', e);
    }
}

// Handle connection state changes
function handleConnectionChange(wallet) {
    tonWallet = wallet;
    
    if (wallet) {
        console.log('TON wallet connected:', wallet);
        
        // Update UI
        document.getElementById('ton-connect-button').textContent = 'TON Wallet Connected';
        
        // Set player name from wallet if not already set
        if (!playerName || playerName.startsWith('Guest-')) {
            playerName = `TON-${wallet.address.substring(0, 6)}`;
        }
        
        // Check if this was a guest converting to registered user
        const wasGuest = localStorage.getItem('wasGuest') === 'true';
        localStorage.removeItem('wasGuest');
        
        if (wasGuest && savedGuestProgress) {
            // Apply guest progress
            playerColor = savedGuestProgress.color;
            localStorage.setItem('transferredGuestProgress', 'true');
            startGame(savedGuestProgress);
        } else {
            // Generate color from wallet address
            const hash = hashCode(wallet.address);
            playerColor = color(
                (hash & 0xFF0000) >> 16,
                (hash & 0x00FF00) >> 8,
                (hash & 0x0000FF)
            );
            
            // If already playing, update player details
            if (gameState === 'playing' && player) {
                player.name = playerName;
                player.color = playerColor;
            } else {
                startGame();
            }
        }
    } else {
        console.log('TON wallet disconnected');
        document.getElementById('ton-connect-button').textContent = 'Connect TON Wallet';
    }
}

// Connect to TON wallet
async function connectTON(wasGuest = false) {
    try {
        if (!tonConnector) {
            await initTONConnect();
        }
        
        if (tonWallet) {
            // Already connected
            if (wasGuest) {
                handleConnectionChange(tonWallet);
            } else {
                startGame();
            }
            return;
        }
        
        // Store wasGuest flag for later use
        if (wasGuest) {
            localStorage.setItem('wasGuest', 'true');
        }
        
        // Generate connection URL
        const universalLink = tonConnector.connect();
        
        // For mobile, open in new tab
        if (isMobile()) {
            window.open(universalLink, '_blank');
        } else {
            // For desktop, show QR code
            showTONConnectQR(universalLink);
        }
    } catch (e) {
        console.error('Error connecting to TON wallet:', e);
        alert('Failed to connect to TON wallet. Please try again.');
    }
}

// Show QR code for TON Connect
function showTONConnectQR(universalLink) {
    // Create modal for QR code
    const modal = document.createElement('div');
    modal.className = 'ton-connect-modal';
    modal.innerHTML = `
        <div class="ton-connect-modal-content">
            <h3>Connect TON Wallet</h3>
            <p>Scan this QR code with your TON wallet app</p>
            <div id="ton-connect-qr"></div>
            <button id="ton-connect-close">Close</button>
        </div>
    `;
    
    // Add modal to document
    document.body.appendChild(modal);
    
    // Create QR code
    const qrContainer = document.getElementById('ton-connect-qr');
    
    // Use a simple QR code library
    // For a real implementation, use a proper QR code library
    const qrCodeImg = document.createElement('img');
    qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(universalLink)}`;
    qrContainer.appendChild(qrCodeImg);
    
    // Close button
    document.getElementById('ton-connect-close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .ton-connect-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .ton-connect-modal-content {
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            max-width: 300px;
        }
        #ton-connect-qr {
            margin: 20px 0;
        }
        #ton-connect-close {
            padding: 8px 16px;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
}

// Send transaction to TON blockchain
async function sendTONTransaction(amount, message = '') {
    if (!tonWallet) {
        console.error('TON wallet not connected');
        return;
    }
    
    try {
        // Create transaction
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
            messages: [
                {
                    // Game wallet address (replace with your actual game wallet)
                    address: 'EQBIhPuWmjT7fP-VomuTWKO8_CxYroQJ4nU-2hQYm5GTLf_Y',
                    amount: amount.toString(),
                    payload: message
                }
            ]
        };
        
        // Send transaction
        const result = await tonConnector.sendTransaction(transaction);
        
        console.log('TON transaction sent:', result);
        return result;
    } catch (e) {
        console.error('Error sending TON transaction:', e);
        alert('Failed to send TON transaction. Please try again.');
    }
}

// Register high score on TON blockchain
async function registerHighScore(score) {
    if (!tonWallet || score < 100) return; // Minimum score threshold
    
    try {
        // Encode score as message
        const message = `OrbIO High Score: ${Math.floor(score)}`;
        
        // Send minimal transaction with message
        const result = await sendTONTransaction(10000000, message); // 0.01 TON
        
        if (result) {
            alert(`High score of ${Math.floor(score)} registered on TON blockchain!`);
        }
    } catch (e) {
        console.error('Error registering high score:', e);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initTONConnect);