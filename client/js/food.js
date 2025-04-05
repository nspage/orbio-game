class Food {
    constructor(id, x, y, radius, color) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = radius || random(5, 10);
        this.color = color || color(random(100, 255), random(100, 255), random(100, 255));
        this.value = this.radius * 0.8;
        
        // Animation properties
        this.angle = random(TWO_PI);
        this.rotationSpeed = random(0.01, 0.05);
        this.pulseAmount = 0;
        this.pulseSpeed = random(0.02, 0.05);
        this.pulseDirection = 1;
    }
    
    update() {
        // Rotate the food
        this.angle += this.rotationSpeed;
        
        // Pulse animation
        this.pulseAmount += this.pulseSpeed * this.pulseDirection;
        if (this.pulseAmount > 0.2 || this.pulseAmount < 0) {
            this.pulseDirection *= -1;
        }
    }
    
    draw() {
        push();
        translate(this.x, this.y);
        rotate(this.angle);
        
        const displayRadius = this.radius * (1 + this.pulseAmount);
        
        // Draw main orb
        noStroke();
        fill(this.color);
        ellipse(0, 0, displayRadius * 2);
        
        // Draw highlight
        fill(255, 255, 255, 100);
        ellipse(-displayRadius * 0.3, -displayRadius * 0.3, displayRadius * 0.8);
        
        // Update animation
        this.update();
        
        pop();
    }
}
