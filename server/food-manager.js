class FoodManager {
    constructor() {
        this.foods = {};
        this.foodCount = 0;
    }
    
    init(gameWidth, gameHeight, maxFoodCount) {
        // Spawn initial food
        for (let i = 0; i < maxFoodCount; i++) {
            this.spawnFood(gameWidth, gameHeight);
        }
    }
    
    spawnFood(gameWidth, gameHeight) {
        const id = this.generateFoodId();
        const radius = Math.random() * 5 + 5; // 5-10
        
        const food = {
            id: id,
            x: Math.random() * (gameWidth - 20) + 10,
            y: Math.random() * (gameHeight - 20) + 10,
            radius: radius,
            color: this.generateRandomColor()
        };
        
        this.foods[id] = food;
        this.foodCount++;
        
        return food;
    }
    
    getFood(id) {
        return this.foods[id];
    }
    
    removeFood(id) {
        if (this.foods[id]) {
            delete this.foods[id];
            this.foodCount--;
        }
    }
    
    getFoods() {
        return Object.values(this.foods);
    }
    
    checkAndSpawnFood(gameWidth, gameHeight, maxFoodCount) {
        // Spawn new food if below maximum
        const foodsToSpawn = maxFoodCount - this.foodCount;
        
        for (let i = 0; i < foodsToSpawn; i++) {
            const newFood = this.spawnFood(gameWidth, gameHeight);
        }
    }
    
    generateFoodId() {
        return 'f-' + Math.random().toString(36).substring(2, 15);
    }
    
    generateRandomColor() {
        return {
            r: Math.floor(Math.random() * 155) + 100, // 100-255
            g: Math.floor(Math.random() * 155) + 100, // 100-255
            b: Math.floor(Math.random() * 155) + 100  // 100-255
        };
    }
}

module.exports = FoodManager;
