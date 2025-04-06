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
// Add after other global variables
let powerups = [];
let powerupTypes = ["speed", "shield", "size"];
let powerupColors = {
    "speed": color(0, 255, 255),  // Cyan
    "shield": color(255, 215, 0),  // Gold
    "size": color(173, 255, 47)    // Green-yellow
};// Add after other global variables
let aiPlayers = [];
const AI_PLAYER_COUNT = 10; // Number of AI players

// Function to initialize AI players
function initAIPlayers() {
    // Clear any existing AI players
    aiPlayers = [];
    
    // Create AI players
    for (let i = 0; i < AI_PLAYER_COUNT; i++) {
        const aiName = `Bot-${i + 1}`;
        const aiColor = color(random(100, 255), random(100, 255), random(100, 255));
        const aiSize = random(15, 40); // Random starting size
        
        aiPlayers.push({
            id: `ai-${i}`,
            x: random(100, gameWidth - 100),
            y: random(100, gameHeight - 100),
            radius: aiSize,
            targetX: random(100, gameWidth - 100),
            targetY: random(100, gameHeight - 100),
            color: aiColor,
            name: aiName,
            vx: 0,
            vy: 0,
            speed: 5 * (1 - min(0.8, aiSize / 300)) // Speed based on size
        });
    }
}
// Function to update AI players
function updateAIPlayers() {
    for (let i = 0; i < aiPlayers.length; i++) {
        const ai = aiPlayers[i];
        
        // Occasionally change target
        if (random() < 0.01) { // 1% chance per frame
            ai.targetX = random(100, gameWidth - 100);
            ai.targetY = random(100, gameHeight - 100);
        }
        
        // Find closest food if no target
        if (random() < 0.05) { // 5% chance per frame
            let closestFood = null;
            let closestDist = 9999;
            
            for (const food of foods) {
                const d = dist(ai.x, ai.y, food.x, food.y);
                if (d < closestDist) {
                    closestDist = d;
                    closestFood = food;
                }
            }
            
            if (closestFood) {
                ai.targetX = closestFood.x;
                ai.targetY = closestFood.y;
            }
        }
        
        // Find smaller players to chase
        if (random() < 0.03) { // 3% chance per frame
            // Look for smaller players (including other AI)
            let targets = [...Object.values(otherPlayers), ...aiPlayers];
            
            // Filter out self and larger players
            targets = targets.filter(target => 
                target.id !== ai.id && target.radius < ai.radius * 0.9
            );
            
            if (targets.length > 0) {
                // Choose a random smaller player to chase
                const target = random(targets);
                ai.targetX = target.x;
                ai.targetY = target.y;
            }
        }
        
        // Avoid larger players
        for (const other of [...Object.values(otherPlayers), ...aiPlayers]) {
            if (other.id !== ai.id && other.radius > ai.radius * 1.1) {
                const d = dist(ai.x, ai.y, other.x, other.y);
                
                // If too close to a bigger player, flee
                if (d < other.radius * 5) {
                    const fleeAngle = atan2(ai.y - other.y, ai.x - other.x);
                    ai.targetX = ai.x + cos(fleeAngle) * 300;
                    ai.targetY = ai.y + sin(fleeAngle) * 300;
                }
            }
        }
        
        // Avoid walls
        const margin = 100;
        if (ai.x < margin) ai.targetX = ai.x + 200;
        if (ai.y < margin) ai.targetY = ai.y + 200;
        if (ai.x > gameWidth - margin) ai.targetX = ai.x - 200;
        if (ai.y > gameHeight - margin) ai.targetY = ai.y - 200;
        
        // Calculate direction to target
        const dx = ai.targetX - ai.x;
        const dy = ai.targetY - ai.y;
        const dist = sqrt(dx * dx + dy * dy);
        
        // Update velocity
        if (dist > 0) {
            // Calculate speed based on size
            ai.speed = 5 * (1 - min(0.8, ai.radius / 300));
            
            ai.vx = (dx / dist) * ai.speed;
            ai.vy = (dy / dist) * ai.speed;
        }
        
        // Update position
        ai.x += ai.vx;
        ai.y += ai.vy;
        
        // Constrain to game boundaries
        ai.x = constrain(ai.x, ai.radius, gameWidth - ai.radius);
        ai.y = constrain(ai.y, ai.radius, gameHeight - ai.radius);
        
        // Check for food collisions
        for (let j = foods.length - 1; j >= 0; j--) {
            const food = foods[j];
            const d = dist(ai.x, ai.y, food.x, food.y);
            
            if (d < ai.radius + food.radius) {
                // AI collected food
                ai.radius += food.value * 0.2;
                
                // Remove food locally
                foods.splice(j, 1);
                
                // Notify server about food being eaten
                if (socket && socket.connected) {
                    socket.emit('eat-food', food.id);
                }
            }
        }
        
        // Check for AI-AI collisions
        for (let j = 0; j < aiPlayers.length; j++) {
            if (i !== j) {
                const other = aiPlayers[j];
                const d = dist(ai.x, ai.y, other.x, other.y);
                
                if (d < ai.radius + other.radius) {
                    // Collision detected
                    if (ai.radius > other.radius * 1.1) {
                        // AI can eat the other AI
                        const sizeGain = other.radius * 0.5;
                        ai.radius += sizeGain * 0.2;
                        
                        // Respawn the eaten AI
                        other.x = random(100, gameWidth - 100);
                        other.y = random(100, gameHeight - 100);
                        other.radius = random(15, 40);
                    }
                }
            }
        }
        
        // Check for player-AI collisions
        if (player && player.active) {
            const d = dist(player.x, player.y, ai.x, ai.y);
            
            if (d < player.radius + ai.radius) {
                // Collision detected
                if (player.radius > ai.radius * 1.1) {
                    // Player can eat the AI
                    const sizeGain = ai.radius * 0.5;
                    player.grow(sizeGain);
                    updatePlayerStats();
                    
                    // Respawn the eaten AI
                    ai.x = random(100, gameWidth - 100);
                    ai.y = random(100, gameHeight - 100);
                    ai.radius = random(15, 40);
                } else if (ai.radius > player.radius * 1.1 && !player.hasShield) {
                    // AI eats the player
                    playerDeath();
                }
            }
        }
    }
}
// Function to draw AI players
function drawAIPlayers() {
    for (const ai of aiPlayers) {
        push();
        translate(ai.x, ai.y);
        
        // Draw AI player
        noStroke();
        fill(ai.color);
        ellipse(0, 0, ai.radius * 2);
        
        // Draw highlight
        fill(255, 255, 255, 70);
        let highlightSize = ai.radius * 0.6;
        ellipse(-ai.radius * 0.25, -ai.radius * 0.25, highlightSize, highlightSize);
        
        // Draw name
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(max(10, ai.radius / 3));
        text(ai.name, 0, -ai.radius - 10);
        
        pop();
    }
}



// P5.js setup function
// Add after other functions
// Spawn powerups periodically
function spawnPowerups() {
    // Maximum number of powerups on screen
    const maxPowerups = 5;
    
    // Only spawn if below max
    if (powerups.length < maxPowerups && random() < 0.01) { // 1% chance per frame
        const type = random(powerupTypes);
        const powerup = {
            id: 'p-' + generateID(),
            x: random(50, gameWidth - 50),
            y: random(50, gameHeight - 50),
            radius: 15,
            type: type,
            color: powerupColors[type],
            pulseAmount: 0,
            pulseDirection: 1,
            rotationAngle: 0
        };
        
        powerups.push(powerup);
        
        // If multiplayer, notify server about new powerup
        if (socket && socket.connected) {
            socket.emit('new-powerup', powerup);
        }
    }
};
// Add after other functions
// Spawn powerups periodically
function spawnPowerups() {
    // Maximum number of powerups on screen
    const maxPowerups = 5;
    
    // Only spawn if below max
    if (powerups.length < maxPowerups && random() < 0.01) { // 1% chance per frame
        const type = random(powerupTypes);
        const powerup = {
            id: 'p-' + generateID(),
            x: random(50, gameWidth - 50),
            y: random(50, gameHeight - 50),
            radius: 15,
            type: type,
            color: powerupColors[type],
            pulseAmount: 0,
            pulseDirection: 1,
            rotationAngle: 0
        };
        
        powerups.push(powerup);
        
        // If multiplayer, notify server about new powerup
        if (socket && socket.connected) {
            socket.emit('new-powerup', powerup);
        }
    }
};
// Add after drawFood function
// Draw powerups
function drawPowerups() {
    for (const powerup of powerups) {
        push();
        translate(powerup.x, powerup.y);
        
        // Pulse animation
        powerup.pulseAmount += 0.02 * powerup.pulseDirection;
        if (powerup.pulseAmount > 0.3 || powerup.pulseAmount < 0) {
            powerup.pulseDirection *= -1;
        }
        
        // Rotation animation
        powerup.rotationAngle += 0.03;
        rotate(powerup.rotationAngle);
        
        // Draw powerup
        noStroke();
        fill(powerup.color);
        const displayRadius = powerup.radius * (1 + powerup.pulseAmount);
        
        // Draw different shapes based on type
        if (powerup.type === "speed") {
            // Lightning bolt for speed
            beginShape();
            vertex(-displayRadius/2, -displayRadius);
            vertex(displayRadius/2, -displayRadius/3);
            vertex(0, 0);
            vertex(displayRadius/2, 0);
            vertex(-displayRadius/2, displayRadius);
            vertex(0, displayRadius/3);
            vertex(-displayRadius/4, 0);
            endShape(CLOSE);
        } else if (powerup.type === "shield") {
            // Shield
            ellipse(0, 0, displayRadius * 2);
            fill(0, 0, 0, 50);
            arc(0, 0, displayRadius * 1.4, displayRadius * 1.4, PI + 0.5, TWO_PI + PI - 0.5);
        } else if (powerup.type === "size") {
            // Size boost (star shape)
            let angle = TWO_PI / 10;
            beginShape();
            for (let i = 0; i < 10; i++) {
                let r = (i % 2 === 0) ? displayRadius : displayRadius * 0.5;
                let x = cos(i * angle - HALF_PI) * r;
                let y = sin(i * angle - HALF_PI) * r;
                vertex(x, y);
            }
            endShape(CLOSE);
        }
        
        // Draw highlight
        fill(255, 255, 255, 70);
        ellipse(-displayRadius * 0.2, -displayRadius * 0.2, displayRadius * 0.5);
        
        pop();
    }
};
// Add after checkFoodCollisions function
// Check for powerup collisions
function checkPowerupCollisions() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        const d = dist(player.x, player.y, powerup.x, powerup.y);
        
        if (d < player.radius + powerup.radius) {
            // Player collected powerup
            applyPowerup(powerup.type);
            
            // Remove powerup locally
            powerups.splice(i, 1);
            
            // Notify server
            if (socket && socket.connected) {
                socket.emit('collect-powerup', powerup.id);
            }
        }
    }
};
// Add this function to apply powerup effects
function applyPowerup(type) {
    switch(type) {
        case "speed":
            // Speed boost for 10 seconds
            const originalSpeed = player.maxSpeed;
            player.maxSpeed = player.maxSpeed * 1.5;
            
            // Create visual effect
            displayPowerupMessage("Speed Boost!");
            
            // Reset after 10 seconds
            setTimeout(() => {
                player.maxSpeed = originalSpeed;
                displayPowerupMessage("Speed boost ended");
            }, 10000);
            break;
            
        case "shield":
            // Shield for 15 seconds
            player.hasShield = true;
            
            // Create visual effect
            displayPowerupMessage("Shield Activated!");
            
            // Reset after 15 seconds
            setTimeout(() => {
                player.hasShield = false;
                displayPowerupMessage("Shield deactivated");
            }, 15000);
            break;
            
        case "size":
            // Instant size increase
            player.grow(player.radius * 0.3);
            updatePlayerStats();
            
            // Create visual effect
            displayPowerupMessage("Size Boost!");
            break;
    }
};
// Add function to display powerup messages
function displayPowerupMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'powerup-message';
    messageElement.textContent = message;
    document.getElementById('game-ui').appendChild(messageElement);
    
    // Remove after animation
    setTimeout(() => {
        if (document.body.contains(messageElement)) {
            document.getElementById('game-ui').removeChild(messageElement);
        }
    }, 3000);
};
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
            if (!player || !player.active) return;
            
            // Update player movement based on input (mouse or touch)
            updatePlayerMovement();
            
            // Check for food collisions
            checkFoodCollisions();
            
            // Check for player collisions
            checkPlayerCollisions();
            
            // Check for powerup collisions
            checkPowerupCollisions();
            
            // Spawn powerups occasionally
            spawnPowerups();
            
            // Update camera position and zoom
            updateCamera();
        };
        drawGame();
    };

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
// Modify drawGame function to draw powerups
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
    
    // Draw powerups
    drawPowerups();
    
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
// Add after other functions
// Spawn powerups periodically
function spawnPowerups() {
    // Maximum number of powerups on screen
    const maxPowerups = 5;
    
    // Only spawn if below max
    if (powerups.length < maxPowerups && random() < 0.01) { // 1% chance per frame
        const type = random(powerupTypes);
        const powerup = {
            id: 'p-' + generateID(),
            x: random(50, gameWidth - 50),
            y: random(50, gameHeight - 50),
            radius: 15,
            type: type,
            color: powerupColors[type],
            pulseAmount: 0,
            pulseDirection: 1,
            rotationAngle: 0
        };
        
        powerups.push(powerup);
        
        // If multiplayer, notify server about new powerup
        if (socket && socket.connected) {
            socket.emit('new-powerup', powerup);
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
    
    // Initialize AI players
    initAIPlayers();
    
    // Send player join request to server
    joinGame(playerName, playerColor);
    
    // Show mobile controls if needed
    if (isMobile()) {
        document.getElementById('mobile-controls').classList.remove('hidden');
        setupTouchControls();
    }
    
    // Update player stats display
    updatePlayerStats();
    
    // Load saved custom image if available
    loadSavedCustomImage();
}

    }
}
