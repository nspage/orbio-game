const PlayerManager = require('./player-manager');
const FoodManager = require('./food-manager');
const CollisionHandler = require('./collision-handler');

class GameServer {
    constructor(io) {
        this.io = io;
        this.players = {};
        this.playerManager = new PlayerManager();
        this.foodManager = new FoodManager();
        this.collisionHandler = new CollisionHandler();
        
        // Game settings
        this.gameWidth = 3000;
        this.gameHeight = 3000;
        this.maxFoodCount = 300;
        this.updateInterval = 50; // ms
        this.leaderboard = [];
        
        // Initialize the game
        this.init();
    }
    
    init() {
        // Initialize food
        this.foodManager.init(this.gameWidth, this.gameHeight, this.maxFoodCount);
        
        // Set up Socket.IO connection handling
        this.setupSocketHandlers();
        
        // Start the game loop
        this.startGameLoop();
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`New connection: ${socket.id}`);
            
            // Send player ID
            socket.emit('player-id', socket.id);
            
            // Handle joining the game
            socket.on('join-game', (data) => this.handlePlayerJoin(socket, data));
            
            // Handle player position updates
            socket.on('position-update', (data) => this.handlePositionUpdate(socket, data));
            
            // Handle player eating food
            socket.on('eat-food', (foodId) => this.handleEatFood(socket, foodId));
            
            // Handle player eating another player
            socket.on('eat-player', (targetId) => this.handleEatPlayer(socket, targetId));
            
            // Handle player death
            socket.on('player-died', () => this.handlePlayerDeath(socket));
            
            // Handle disconnection
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }
    
    handlePlayerJoin(socket, data) {
        console.log(`Player joined: ${socket.id}, Name: ${data.name}`);
        
        // Create new player
        const player = this.playerManager.createPlayer(
            socket.id,
            data.name,
            data.color,
            this.gameWidth,
            this.gameHeight
        );
        
        this.players[socket.id] = player;
        
        // Send current game state to new player
        this.sendGameState(socket);
    }
    
    handlePositionUpdate(socket, data) {
        const player = this.players[socket.id];
        if (!player) return;
        
        // Update player position
        player.x = data.x;
        player.y = data.y;
        player.radius = data.radius;
        
        // Update score based on size
        player.score = player.radius * player.radius / 20;
    }
    
    handleEatFood(socket, foodId) {
        const player = this.players[socket.id];
        if (!player) return;
        
        // Check if the food exists
        const food = this.foodManager.getFood(foodId);
        if (!food) return;
        
        // Calculate distance to verify the collision
        const distance = Math.sqrt(
            Math.pow(player.x - food.x, 2) + 
            Math.pow(player.y - food.y, 2)
        );
        
        if (distance < player.radius + food.radius) {
            // Player can eat the food
            const value = food.radius * 0.8;
            player.radius += value * 0.2;
            player.score += value;
            
            // Remove the food
            this.foodManager.removeFood(foodId);
            
            // Broadcast food being eaten
            this.io.emit('food-eaten', foodId);
            
            // Spawn new food
            const newFood = this.foodManager.spawnFood(this.gameWidth, this.gameHeight);
            this.io.emit('new-food', newFood);
        }
    }
    
    handleEatPlayer(socket, targetId) {
        const player = this.players[socket.id];
        const target = this.players[targetId];
        
        if (!player || !target) return;
        
        // Calculate distance to verify the collision
        const distance = Math.sqrt(
            Math.pow(player.x - target.x, 2) + 
            Math.pow(player.y - target.y, 2)
        );
        
        if (distance < player.radius + target.radius && player.radius > target.radius * 1.1) {
            // Player can eat the target
            const sizeGain = target.radius * 0.5;
            player.radius += sizeGain * 0.2;
            player.score += target.score * 0.5;
            
            // Notify the eaten player
            this.io.to(targetId).emit('player-eaten', {
                eatenBy: socket.id,
                eatenByName: player.name
            });
            
            // Remove the eaten player
            delete this.players[targetId];
        }
    }
    
    handlePlayerDeath(socket) {
        // Player is already marked as dead in the client
        delete this.players[socket.id];
    }
    
    handleDisconnect(socket) {
        console.log(`Player disconnected: ${socket.id}`);
        
        // Remove player
        delete this.players[socket.id];
    }
    
    startGameLoop() {
        setInterval(() => {
            this.update();
        }, this.updateInterval);
    }
    
    update() {
        // Update game state
        this.updateLeaderboard();
        
        // Spawn new food if needed
        this.foodManager.checkAndSpawnFood(this.gameWidth, this.gameHeight, this.maxFoodCount);
        
        // Send game state to all players
        this.sendGameStateToAll();
    }
    
    updateLeaderboard() {
        // Create leaderboard from players
        const leaderboard = Object.values(this.players)
            .map(player => ({
                id: player.id,
                name: player.name,
                score: player.score
            }))
            .sort((a, b) => b.score - a.score);
        
        // Limit to top 10
        this.leaderboard = leaderboard.slice(0, 10);
    }
    
    sendGameState(socket) {
        // Send game state to a specific player
        socket.emit('game-state', {
            width: this.gameWidth,
            height: this.gameHeight,
            foods: this.foodManager.getFoods(),
            leaderboard: this.leaderboard || []
        });
        
        // Send all players
        socket.emit('player-update', this.players);
    }
    
    sendGameStateToAll() {
        // Send game state to all connected players
        this.io.emit('game-state', {
            width: this.gameWidth,
            height: this.gameHeight,
            foods: this.foodManager.getFoods(),
            leaderboard: this.leaderboard || []
        });
        
        // Send player updates
        this.io.emit('player-update', this.players);
    }
}

module.exports = GameServer;