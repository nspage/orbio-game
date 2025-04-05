// UI related variables
let joystickActive = false;
let joystickX = 0;
let joystickY = 0;
let joystickStartX = 0;
let joystickStartY = 0;
let joystickKnob;
let joystickAngle = 0;
let joystickDistance = 0;

// Initialize UI elements
function initUI() {
    // Initialize joystick if on mobile
    if (isMobile()) {
        setupTouchControls();
    }
    
    // Add event listeners for settings panel
    document.getElementById('settings-button').addEventListener('click', () => {
        document.getElementById('settings-panel').classList.toggle('hidden');
    });
    
    document.getElementById('close-settings').addEventListener('click', () => {
        document.getElementById('settings-panel').classList.add('hidden');
    });
    
    document.getElementById('direction-indicator').addEventListener('change', (e) => {
        if (player) {
            player.directionIndicator = e.target.checked;
        }
    });
}

// Set up touch controls for mobile
function setupTouchControls() {
    const joystickArea = document.getElementById('joystick-area');
    
    // Create joystick knob
    joystickKnob = document.createElement('div');
    joystickKnob.className = 'joystick-knob';
    joystickArea.appendChild(joystickKnob);
    
    // Center the knob initially
    const joystickRect = joystickArea.getBoundingClientRect();
    joystickX = joystickRect.width / 2;
    joystickY = joystickRect.height / 2;
    updateJoystickPosition();
    
    // Set up touch event listeners
    joystickArea.addEventListener('touchstart', handleJoystickStart);
    joystickArea.addEventListener('touchmove', handleJoystickMove);
    joystickArea.addEventListener('touchend', handleJoystickEnd);
}

// Handle joystick touch start
function handleJoystickStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const joystickRect = e.target.getBoundingClientRect();
    
    joystickStartX = touch.clientX - joystickRect.left;
    joystickStartY = touch.clientY - joystickRect.top;
    
    joystickX = joystickStartX;
    joystickY = joystickStartY;
    joystickActive = true;
    
    updateJoystickPosition();
}

// Handle joystick touch move
function handleJoystickMove(e) {
    if (!joystickActive) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const joystickRect = e.target.getBoundingClientRect();
    
    joystickX = touch.clientX - joystickRect.left;
    joystickY = touch.clientY - joystickRect.top;
    
    // Calculate distance from center
    const dx = joystickX - joystickStartX;
    const dy = joystickY - joystickStartY;
    joystickDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Limit distance to joystick area
    const maxDistance = joystickRect.width / 2 - 25; // Half of joystick area minus half of knob size
    
    if (joystickDistance > maxDistance) {
        const angle = Math.atan2(dy, dx);
        joystickX = joystickStartX + Math.cos(angle) * maxDistance;
        joystickY = joystickStartY + Math.sin(angle) * maxDistance;
        joystickDistance = maxDistance;
    }
    
    // Calculate angle
    joystickAngle = Math.atan2(joystickY - joystickStartY, joystickX - joystickStartX);
    
    updateJoystickPosition();
}

// Handle joystick touch end
function handleJoystickEnd(e) {
    e.preventDefault();
    
    // Return joystick to center
    const joystickRect = e.target.getBoundingClientRect();
    joystickX = joystickRect.width / 2;
    joystickY = joystickRect.height / 2;
    joystickActive = false;
    joystickDistance = 0;
    
    updateJoystickPosition();
}

// Update joystick knob position
function updateJoystickPosition() {
    if (joystickKnob) {
        joystickKnob.style.left = (joystickX - 25) + 'px'; // 25 is half of knob size
        joystickKnob.style.top = (joystickY - 25) + 'px';
    }
}

// Start as guest
function startAsGuest() {
    playerName = `Guest-${Math.floor(Math.random() * 1000)}`;
    playerColor = color(random(100, 255), random(100, 255), random(100, 255));
    localStorage.setItem('guestSession', 'active');
    startGame();
}

// Play again after death
function playAgain() {
    document.getElementById('death-screen').classList.add('hidden');
    startGame();
}

// Start the game
function startGame(savedProgress = null) {
    // Hide login screen
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    
    // Reset game state
    gameState = 'playing';
    
    // Apply saved progress if available
    let startRadius = 20; // Default starting radius
    let startPosition = { 
        x: random(gameWidth), 
        y: random(gameHeight) 
    };
    
    if (savedProgress) {
        startRadius = savedProgress.size || startRadius;
        playerColor = savedProgress.color || playerColor;
    }
    
    // Create player
    player = new Player(
        startPosition.x,
        startPosition.y,
        startRadius,
        playerColor,
        playerName
    );
    
    // Send player join request to server
    joinGame(playerName, playerColor);
    
    // Show mobile controls if needed
    if (isMobile()) {
        document.getElementById('mobile-controls').classList.remove('hidden');
        setupTouchControls();
    }
    
    // Update player stats display
    updatePlayerStats();
}

// Update player stats display
function updatePlayerStats() {
    document.getElementById('player-score').textContent = `Score: ${Math.floor(player.score)}`;
    document.getElementById('player-size').textContent = `Size: ${Math.floor(player.radius)}`;
}

// Player death handling
function playerDeath() {
    gameState = 'dead';
    
    // Save guest progress if playing as guest
    if (playerName.startsWith('Guest-') && !telegramUser && !tonWallet) {
        savedGuestProgress = {
            score: Math.floor(player.score),
            size: Math.floor(player.radius),
            color: playerColor
        };
        localStorage.setItem('guestProgress', JSON.stringify(savedGuestProgress));
        
        // Show registration prompt
        showRegistrationPrompt();
    }
    
    // Update UI
    document.getElementById('death-screen').classList.remove('hidden');
    document.getElementById('game-ui').classList.add('hidden');
    
    document.getElementById('final-score').textContent = `Your Score: ${Math.floor(player.score)}`;
    
    // Find player rank
    const rank = leaderboard.findIndex(entry => entry.id === playerID) + 1;
    document.getElementById('final-rank').textContent = `Your Rank: #${rank || '-'}`;
    
    // Notify server
    playerDied();
}

// Show registration prompt
function showRegistrationPrompt() {
    const registrationPrompt = document.createElement('div');
    registrationPrompt.className = 'registration-prompt';
    registrationPrompt.innerHTML = `
        <div class="prompt-content">
            <h3>Save Your Progress!</h3>
            <p>Your score: ${savedGuestProgress.score}</p>
            <p>Register to save your progress and continue playing with the same stats.</p>
            <div class="prompt-buttons">
                <button id="register-telegram" class="prompt-button">Register with Telegram</button>
                <button id="register-ton" class="prompt-button">Connect TON Wallet</button>
                <button id="stay-guest" class="prompt-button secondary">Continue as Guest</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(registrationPrompt);
    
    // Add event listeners
    document.getElementById('register-telegram').addEventListener('click', () => {
        document.body.removeChild(registrationPrompt);
        initTelegramLogin(true); // true indicates registration after guest play
    });
    
    document.getElementById('register-ton').addEventListener('click', () => {
        document.body.removeChild(registrationPrompt);
        connectTON(true); // true indicates registration after guest play
    });
    
    document.getElementById('stay-guest').addEventListener('click', () => {
        document.body.removeChild(registrationPrompt);
    });
}

// Set up image upload functionality
function setupImageUpload() {
    const uploadBtn = document.getElementById('upload-image-btn');
    const fileInput = document.getElementById('image-upload');
    const previewContainer = document.getElementById('custom-image-preview');
    
    // Handle upload button click
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file
        if (!validateImageFile(file)) {
            alert('Please upload a valid image file (JPG, PNG, GIF) under 2MB');
            return;
        }
        
        // Process image
        processPlayerImage(file);
    });
}

// Process player image
function processPlayerImage(file) {
    const reader = new FileReader();
    const previewContainer = document.getElementById('custom-image-preview');
    
    reader.onload = (e) => {
        // Show preview
        previewContainer.innerHTML = `
            <img src="${e.target.result}" alt="Custom orb image">
            <div class="image-preview-actions">
                <button id="apply-image" class="preview-button apply-button">Apply</button>
                <button id="cancel-image" class="preview-button cancel-button">Cancel</button>
            </div>
        `;
        previewContainer.classList.remove('hidden');
        
        // Create P5 image object
        loadImage(e.target.result, (img) => {
            // Store temporary image
            tempCustomImage = img;
            
            // Setup buttons
            document.getElementById('apply-image').addEventListener('click', () => {
                if (player && tempCustomImage) {
                    player.setCustomImage(tempCustomImage);
                    
                    // Save image to localStorage for persistence (base64)
                    try {
                        localStorage.setItem('playerCustomImage', e.target.result);
                    } catch (error) {
                        console.error('Error saving image to localStorage:', error);
                        // Image might be too large for localStorage
                    }
                }
                previewContainer.classList.add('hidden');
            });
            
            document.getElementById('cancel-image').addEventListener('click', () => {
                tempCustomImage = null;
                previewContainer.classList.add('hidden');
            });
        });
    };
    
    // Read file as data URL (base64)
    reader.readAsDataURL(file);
}

// Load saved custom image from localStorage if available
function loadSavedCustomImage() {
    const savedImage = localStorage.getItem('playerCustomImage');
    if (savedImage && player) {
        loadImage(savedImage, (img) => {
            player.setCustomImage(img);
        });
    }
}