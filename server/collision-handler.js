class CollisionHandler {
    constructor() {
        // Nothing to initialize
    }
    
    // Check if a player can eat food
    checkFoodCollision(player, food) {
        const distance = this.getDistance(
            player.x, player.y,
            food.x, food.y
        );
        
        return distance < player.radius + food.radius;
    }
    
    // Check if a player can eat another player
    checkPlayerCollision(player1, player2) {
        const distance = this.getDistance(
            player1.x, player1.y,
            player2.x, player2.y
        );
        
        // Players can eat others if they are 10% larger
        if (distance < player1.radius + player2.radius) {
            if (player1.radius > player2.radius * 1.1) {
                return { canEat: true, predator: player1, prey: player2 };
            } else if (player2.radius > player1.radius * 1.1) {
                return { canEat: true, predator: player2, prey: player1 };
            }
        }
        
        return { canEat: false };
    }
    
    // Helper function to calculate distance
    getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

module.exports = CollisionHandler;
