class PlayerManager {
    constructor() {
        this.players = {};
    }
    
    createPlayer(id, name, color, gameWidth, gameHeight) {
        // Create a new player object
        const player = {
            id: id,
            name: name || `Player-${id.substring(0, 4)}`,
            color: color || this.generateRandomColor(),
            x: Math.random() * (gameWidth - 100) + 50, // Random position away from edges
            y: Math.random() * (gameHeight - 100) + 50,
            radius: 20, // Starting size
            score: 0
        };
        
        this.players[id] = player;
        return player;
    }
    
    getPlayer(id) {
        return this.players[id];
    }
    
    removePlayer(id) {
        delete this.players[id];
    }
    
    getAllPlayers() {
        return this.players;
    }
    
    generateRandomColor() {
        return {
            r: Math.floor(Math.random() * 155) + 100, // 100-255
            g: Math.floor(Math.random() * 155) + 100, // 100-255
            b: Math.floor(Math.random() * 155) + 100  // 100-255
        };
    }
}

module.exports = PlayerManager;
