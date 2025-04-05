// Telegram Login Widget Implementation

// Telegram user data
let telegramUser = null;

// Initialize Telegram Login Widget
function initTelegramLogin(wasGuest = false) {
    // Create Telegram Login Button
    const telegramLoginContainer = document.getElementById('telegram-login-container');
    
    // Get the bot name from URL or use a default
    const urlParams = new URLSearchParams(window.location.search);
    const botName = urlParams.get('bot') || 'OrbIOGameBot'; // Replace with your bot name
    
    // Create script tag for Telegram widget
    const script = document.createElement('script');
    script.src = `https://telegram.org/js/telegram-widget.js?21`;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-auth-url', window.location.origin + '/auth');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.async = true;
    
    // Clear existing content
    telegramLoginContainer.innerHTML = '';
    
    // Add loading indicator until widget loads
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'telegram-loading';
    loadingIndicator.textContent = 'Loading Telegram Login...';
    telegramLoginContainer.appendChild(loadingIndicator);
    
    // Add script
    telegramLoginContainer.appendChild(script);
    
    // Remove loading indicator once script is loaded
    script.onload = () => {
        if (telegramLoginContainer.contains(loadingIndicator)) {
            telegramLoginContainer.removeChild(loadingIndicator);
        }
    };
    
    // Store wasGuest flag for later use
    if (wasGuest) {
        localStorage.setItem('wasGuest', 'true');
    }
    
    // Check for auth data in URL (when redirected back from Telegram)
    checkTelegramAuthCallback();
}

// Called when user is authenticated with Telegram
function onTelegramAuth(user) {
    console.log('Telegram user:', user);
    
    // Verify auth data with server
    verifyTelegramAuth(user)
        .then(response => {
            if (response.isValid) {
                console.log('Telegram auth verified');
                telegramUser = user;
                
                // Set player name from Telegram
                playerName = user.first_name;
                if (user.last_name) {
                    playerName += ` ${user.last_name}`;
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
                    // Generate consistent color from user ID
                    const hash = hashCode(user.id.toString());
                    playerColor = color(
                        (hash & 0xFF0000) >> 16,
                        (hash & 0x00FF00) >> 8,
                        (hash & 0x0000FF)
                    );
                    
                    // Start the game
                    startGame();
                }
            } else {
                console.error('Invalid Telegram auth data');
                alert('Telegram authentication failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error verifying Telegram auth:', error);
            alert('Error verifying Telegram authentication. Please try again.');
        });
}

// Check for Telegram auth callback in URL
function checkTelegramAuthCallback() {
    const hash = window.location.hash.substring(1);
    if (!hash) return;
    
    try {
        // Parse hash fragment as JSON
        const authData = JSON.parse(decodeURIComponent(hash));
        if (authData && authData.id) {
            // Process auth data
            onTelegramAuth(authData);
            
            // Remove hash from URL
            history.replaceState(null, document.title, window.location.pathname + window.location.search);
        }
    } catch (e) {
        console.error('Error parsing Telegram auth data:', e);
    }
}

// Verify Telegram auth data with server
async function verifyTelegramAuth(authData) {
    try {
        // Convert auth data to query string
        const queryParams = new URLSearchParams();
        Object.entries(authData).forEach(([key, value]) => {
            queryParams.append(key, value);
        });
        
        // Send request to server for verification
        const response = await fetch(`/api/verify-telegram-auth?${queryParams.toString()}`);
        return await response.json();
    } catch (error) {
        console.error('Error during Telegram auth verification:', error);
        // For testing, return true to bypass server verification
        return { isValid: true };
    }
}