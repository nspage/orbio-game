// Global variables
let canvas;
let player;
let foods = [];
let otherPlayers = {};
let gameState = 'login'; // login, playing, dead
let gameWidth = 3000;
let gameHeight = 3000;
let zoom = 1;
let leaderboard = [];
let playerID = null;
let playerName = 'Guest';
let playerColor = null;
let disconnected = false;
let savedGuestProgress = null;
let tempCustomImage = null;
let isLandscape = window.innerWidth > window.innerHeight;

// P5.js setup function
function setup() {
    // Create canvas that fills the window
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('game-container');
    
    // Disable default touch behavior to prevent scrolling
    canvas.touchStarted(() => false);
    canvas.touchMoved(() => false);
    canvas.touchEnded(() => false);
    
    // Initialize game with random color if none is set
    if (!playerColor) {
        playerColor = color(random(100, 255), random(100, 255), random(100, 255));
    }
    
    // Set up event listeners for buttons
    document.getElementById('guest-login-button').addEventListener('click', startAsGuest);
    document.getElementById('play-again-button').addEventListener('click', playAgain);
    document.getElementById('ton-connect-button').addEventListener('click', connectTON);
    
    // Initialize Telegram login
    initTelegramLogin();
    
    // Set up UI
    initUI();
    
    // Initialize socket connection
    initSocketConnection();
    
    // Set up image upload
    setupImageUpload();
    
    // Handle orientation
    handleOrientationChange();
    
    // Check for saved guest progress
    checkSavedGuestProgress();
    
    // Set frame rate to ensure smooth gameplay
    frameRate(60);
}

// Listen for orientation changes
window.addEventListener('resize', handleOrientationChange);

function handleOrientationChange() {
    const wasLandscape = isLandscape;
    isLandscape = window.innerWidth > window.innerHeight;
    
    // Only take action if orientation actually changed
    if (wasLandscape !== isLandscape) {
        adjustForOrientation();
        if (gameState === 'playing') {
            showOrientationMessage();
        }
    }
    
    // Always resize canvas when window size changes
    resizeCanvas(windowWidth, windowHeight);
}

function adjustForOrientation() {
    if (isLandscape) {
        // Landscape optimizations
        if (document.getElementById('mobile-controls')) {
            document.getElementById('mobile-controls').classList.add('landscape');
        }
        
        // Adjust joystick position for landscape
        if (document.getElementById('joystick-area')) {
            document.getElementById('joystick-area').style.bottom = '50px';
            document.getElementById('joystick-area').style.left = '100px';
        }
        
        // Adjust UI elements for landscape
        if (document.getElementById('leaderboard')) {
            document.getElementById('leaderboard').style.width = '200px';
            document.getElementById('leaderboard').style.right = '20px';
        }
    } else {
        // Portrait optimizations
        if (document.getElementById('mobile-controls')) {
            document.getElementById('mobile-controls').classList.remove('landscape');
        }
        
        // Adjust joystick position for portrait
        if (document.getElementById('joystick-area')) {
            document.getElementById('joystick-area').style.bottom = '100px';
            document.getElementById('joystick-area').style.left = '50px';
        }
        
        // Adjust UI elements for portrait
        if (document.getElementById('leaderboard')) {
            document.getElementById('leaderboard').style.width = '150px';
            document.getElementById('leaderboard').style.right = '10px';
        }
    }
    
    // Update game camera and viewable area if in game
    if (gameState === 'playing' && player) {
        updateCamera();
    }
}

function showOrientationMessage() {
    const msg = document.createElement('div');
    msg.className = 'orientation-message';
    msg.textContent = isLandscape ? 
        'Switched to landscape mode. Wider view of the game world!' : 
        'Switched to portrait mode. Better for one-handed play!';
    document.body.appendChild(msg);
    
    // Remove after animation completes
    setTimeout(() => {
        if (document.body.contains(msg)) {
            document.body.removeChild(msg);
        }
    }, 3000);
}

// Check for saved guest progress
function checkSavedGuestProgress() {
    const guestProgress = localStorage.getItem('guestProgress');
    if (guestProgress) {
        try {
            savedGuestProgress = JSON.parse(guestProgress);
            
            // If there's a transferredGuestProgress flag, clear saved progress
            if (localStorage.getItem('transferredGuestProgress')) {
                localStorage.removeItem('guestProgress');
                localStorage.removeItem('transferredGuestProgress');
                savedGuestProgress = null;
            }
        } catch (e) {
            console.error('Error parsing saved guest progress:', e);
            localStorage.removeItem('guestProgress');
        }
    }
}

// P5.js draw function - called each frame
function draw() {
    if (gameState === 'playing') {
        updateGame();
        drawGame();
    }
}

// Update game state
function updateGame() {
    if (!player || !player.active) return;
    
    // Update player movement based on input (mouse or touch)
    updatePlayerMovement();
    
    // Check for food collisions
    checkFoodCollisions();
    
    // Check for player collisions
    checkPlayerCollisions();
    
    // Update camera position and zoom
    updateCamera();
}

// Draw the game
function drawGame() {
    // Clear the canvas
    background(240);
    
    // Translate to center the view on the player
    translate(width / 2, height / 2);
    scale(zoom);
    translate(-player.x, -player.y);
    
    // Draw grid
    drawGrid();
    
    // Draw game boundary
    drawBoundary();
    
    // Draw food
    drawFood();
    
    // Draw other players
    drawOtherPlayers();
    
    // Draw player
    player.draw();
}

// Draw the grid
function drawGrid() {
    stroke(230);
    strokeWeight(1);
    
    const gridSize = 100;
    const startX = Math.floor(player.x / gridSize) * gridSize - width / zoom / 2 - gridSize;
    const endX = startX + width / zoom + gridSize * 2;
    const startY = Math.floor(player.y / gridSize) * gridSize - height / zoom / 2 - gridSize;
    const endY = startY + height / zoom + gridSize * 2;
    
    for (let x = startX; x < endX; x += gridSize) {
        line(x, startY, x, endY);
    }
    
    for (let y = startY; y < endY; y += gridSize) {
        line(startX, y, endX, y);
    }
}

// Draw the game boundary
function drawBoundary() {
    noFill();
    stroke(100);
    strokeWeight(3);
    rect(0, 0, gameWidth, gameHeight);
}

// Draw food orbs
function drawFood() {
    for (const food of foods) {
        food.draw();
    }
}

// Draw other players
function drawOtherPlayers() {
    for (const id in otherPlayers) {
        if (id !== playerID) {
            otherPlayers[id].draw();
        }
    }
}

// Update player movement based on input
function updatePlayerMovement() {
    if (!player) return;
    
    let targetX, targetY;
    
    if (isMobile() && joystickActive) {
        // Use joystick direction for mobile
        const angle = joystickAngle;
        const distance = min(joystickDistance, 50) / 50; // Normalize to 0-1
        
        targetX = player.x + cos(angle) * player.maxSpeed * distance;
        targetY = player.y + sin(angle) * player.maxSpeed * distance;
    } else {
        // Use mouse position for desktop
        // Convert mouse position to world coordinates
        targetX = player.x + (mouseX - width / 2) / zoom;
        targetY = player.y + (mouseY - height / 2) / zoom;
    }
    
    // Calculate direction vector
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const length = sqrt(dx * dx + dy * dy);
    
    if (length > 0) {
        const speed = player.calculateSpeed();
        player.vx = (dx / length) * speed;
        player.vy = (dy / length) * speed;
    }
    
    // Update position
    player.update();
    
    // Keep player within boundaries
    player.x = constrain(player.x, player.radius, gameWidth - player.radius);
    player.y = constrain(player.y, player.radius, gameHeight - player.radius);
    
    // Send position update to server
    sendPositionUpdate(player.x, player.y, player.radius);
}

// Update camera position and zoom
function updateCamera() {
    // Adjust zoom based on player size
    const targetZoom = 1 / (1 + player.radius / 100);
    zoom = lerp(zoom, targetZoom, 0.05);
}

// Check for food collisions
function checkFoodCollisions() {
    for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i];
        const d = dist(player.x, player.y, food.x, food.y);
        
        if (d < player.radius + food.radius) {
            // Player collected food
            player.grow(food.value);
            updatePlayerStats();
            
            // Remove food locally
            foods.splice(i, 1);
            
            // Notify server
            eatFood(food.id);
        }
    }
}

// Check for player collisions
function checkPlayerCollisions() {
    for (const id in otherPlayers) {
        if (id !== playerID) {
            const otherPlayer = otherPlayers[id];
            const d = dist(player.x, player.y, otherPlayer.x, otherPlayer.y);
            
            if (d < player.radius + otherPlayer.radius) {
                // Collision detected
                if (player.radius > otherPlayer.radius * 1.1) {
                    // Player can eat the other player
                    const sizeGain = otherPlayer.radius * 0.5;
                    player.grow(sizeGain);
                    updatePlayerStats();
                    
                    // Notify server
                    eatPlayer(id);
                } else if (otherPlayer.radius > player.radius * 1.1) {
                    // Player gets eaten
                    playerDeath();
                }
            }
        }
    }
}

// Window resize handling
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
