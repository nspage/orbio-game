// Socket connection
let socket;

// Initialize socket connection
function initSocketConnection() {
    // Connect to the server
    socket = io.connect(window.location.origin, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
    });
    
    // Setup socket event listeners
    setupSocketEvents();
}

function setupSocketEvents() {
    // Connection established
    socket.on('connect', () => {
        console.log('Connected to server');
        document.getElementById('connection-status').textContent = 'Connected';
        disconnected = false;
        
        // If player was already in game, rejoin
        if (gameState === 'playing' && player) {
            joinGame(playerName, playerColor);
        }
    });
    
    // Connection lost
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        document.getElementById('connection-status').textContent = 'Disconnected - trying to reconnect...';
        disconnected = true;
    });
    
    // Player ID assigned
    socket.on('player-id', (id) => {
        playerID = id;
        console.log('Assigned player ID:', playerID);
    });
    
    // Game state update
    socket.on('game-state', (state) => {
        // Update game dimensions
        gameWidth = state.width;
        gameHeight = state.height;
        
        // Update food
        updateFoodFromServer(state.foods);
        
        // Update leaderboard
        leaderboard = state.leaderboard;
        updateLeaderboardUI();
    });
    
    // Player update
    socket.on('player-update', (players) => {
        updatePlayersFromServer(players);
    });
    
    // Player eaten
    socket.on('player-eaten', (eatenBy) => {
        if (gameState === 'playing') {
            gameState = 'dead';
            playerDeath();
        }
    });
    
    // New food appeared
    socket.on('new-food', (food) => {
        foods.push(new Food(
            food.id,
            food.x,
            food.y,
            food.radius,
            color(food.color.r, food.color.g, food.color.b)
        ));
    });
    
    // Food eaten
    socket.on('food-eaten', (foodId) => {
        const index = foods.findIndex(f => f.id === foodId);
        if (index !== -1) {
            foods.splice(index, 1);
        }
    });
}

// Join the game
function joinGame(name, playerColor) {
    if (!socket || !socket.connected) return;
    
    // Convert p5.js color to RGB object
    const colorObj = {
        r: red(playerColor),
        g: green(playerColor),
        b: blue(playerColor)
    };
    
    socket.emit('join-game', {
        name: name,
        color: colorObj
    });
}

// Send position update to server
function sendPositionUpdate(x, y, radius) {
    if (!socket || !socket.connected) return;
    
    socket.emit('position-update', {
        x: x,
        y: y,
        radius: radius
    });
}

// Notify server that player ate food
function eatFood(foodId) {
    if (!socket || !socket.connected) return;
    
    socket.emit('eat-food', foodId);
}

// Notify server that player ate another player
function eatPlayer(targetId) {
    if (!socket || !socket.connected) return;
    
    socket.emit('eat-player', targetId);
}

// Notify server that player died
function playerDied() {
    if (!socket || !socket.connected) return;
    
    socket.emit('player-died');
}

// Update food orbs from server data
function updateFoodFromServer(serverFoods) {
    // If it's the initial update, replace all foods
    if (foods.length === 0) {
        foods = serverFoods.map(food => 
            new Food(
                food.id, 
                food.x, 
                food.y, 
                food.radius, 
                color(food.color.r, food.color.g, food.color.b)
            )
        );
    }
}

// Update players from server data
function updatePlayersFromServer(serverPlayers) {
    for (const id in serverPlayers) {
        const serverPlayer = serverPlayers[id];
        
        if (id === playerID) {
            // Skip self unless we need to sync
            continue;
        }
        
        if (!otherPlayers[id]) {
            // Create new player
            otherPlayers[id] = new Player(
                serverPlayer.x,
                serverPlayer.y,
                serverPlayer.radius,
                color(serverPlayer.color.r, serverPlayer.color.g, serverPlayer.color.b),
                serverPlayer.name
            );
        } else {
            // Update existing player
            otherPlayers[id].setPosition(
                serverPlayer.x,
                serverPlayer.y,
                serverPlayer.radius
            );
        }
    }
    
    // Remove players that are no longer in the game
    for (const id in otherPlayers) {
        if (!serverPlayers[id]) {
            delete otherPlayers[id];
        }
    }
}

// Update leaderboard UI
function updateLeaderboardUI() {
    const leaderboardEl = document.getElementById('leaderboard-entries');
    leaderboardEl.innerHTML = '';
    
    // Display top 10 players
    const topPlayers = leaderboard.slice(0, 10);
    
    topPlayers.forEach((entry, index) => {
        const entryEl = document.createElement('div');
        entryEl.className = 'leaderboard-entry';
        
        // Highlight current player
        const isCurrentPlayer = entry.id === playerID;
        if (isCurrentPlayer) {
            entryEl.style.fontWeight = 'bold';
            entryEl.style.color = '#3498db';
        }
        
        entryEl.innerHTML = `
            ${index + 1}. ${entry.name}
            ${Math.floor(entry.score)}
        `;
        
        leaderboardEl.appendChild(entryEl);
    });
}
