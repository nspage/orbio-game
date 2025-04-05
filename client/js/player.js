class Player {
    constructor(x, y, radius, color, name) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.name = name;
        this.vx = 0;
        this.vy = 0;
        this.maxSpeed = 5;
        this.active = true;
        this.score = 0;
        
        // Animation properties
        this.pulseAmount = 0;
        this.pulseDirection = 1;
        this.pulseSpeed = 0.02;
        
        // Direction indicator properties
        this.directionIndicator = true;
        this.lastDirection = { x: 0, y: 0 };
        this.directionAngle = 0;
        this.movementHistory = [];
        this.maxHistoryLength = 8;
        
        // Custom image properties
        this.customImage = null;
        this.hasCustomImage = false;
        
        // Initialize blob segments for more organic look
        this.segments = [];
        this.segmentCount = 12;
        this.initSegments();
    }
    
    initSegments() {
        for (let i = 0; i < this.segmentCount; i++) {
            const angle = (i / this.segmentCount) * TWO_PI;
            const variance = 0.15; // How much each segment can vary
            
            this.segments.push({
                angle: angle,
                radiusMultiplier: 1 + random(-variance, variance),
                pulseFactor: random(0.8, 1.2)
            });
        }
    }
    
    update() {
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Update score based on size
        this.score = this.radius * this.radius / 20;
        
        // Update pulse animation
        this.pulseAmount += this.pulseSpeed * this.pulseDirection;
        if (this.pulseAmount > 0.1 || this.pulseAmount < 0) {
            this.pulseDirection *= -1;
        }
        
        // Update direction if moving
        if (this.vx !== 0 || this.vy !== 0) {
            // Calculate movement direction
            const movementLength = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (movementLength > 0.1) {
                this.lastDirection.x = this.vx / movementLength;
                this.lastDirection.y = this.vy / movementLength;
                this.directionAngle = Math.atan2(this.vy, this.vx);
                
                // Add current position to history for trail effect
                this.movementHistory.unshift({ x: this.x, y: this.y });
                
                // Limit history length
                if (this.movementHistory.length > this.maxHistoryLength) {
                    this.movementHistory.pop();
                }
            }
        }
    }
    
    draw() {
        push();
        translate(this.x, this.y);
        
        // Draw movement trail (optional visual effect)
        if (this.movementHistory.length > 1) {
            noFill();
            stroke(red(this.color), green(this.color), blue(this.color), 70);
            strokeWeight(3);
            beginShape();
            for (let i = 0; i < this.movementHistory.length; i++) {
                const pos = this.movementHistory[i];
                const alpha = map(i, 0, this.movementHistory.length - 1, 0.7, 0);
                stroke(red(this.color), green(this.color), blue(this.color), alpha * 70);
                vertex(pos.x - this.x, pos.y - this.y);
            }
            endShape();
        }
        
        // Draw player body
        if (this.hasCustomImage && this.customImage) {
            // Draw with custom image
            imageMode(CENTER);
            
            // Draw circular mask first
            let maskSize = this.radius * 2;
            
            // Create circular mask by using the existing orb shape
            noStroke();
            fill(255, 255);
            ellipse(0, 0, maskSize, maskSize);
            
            // Draw the image with blend mode to apply to the mask
            blendMode(MULTIPLY);
            image(this.customImage, 0, 0, maskSize, maskSize);
            blendMode(NORMAL);
            
            // Draw border
            noFill();
            stroke(255, 100);
            strokeWeight(2);
            ellipse(0, 0, maskSize, maskSize);
        } else {
            // Draw blob body
            noStroke();
            fill(this.color);
            
            beginShape();
            for (let i = 0; i < this.segmentCount; i++) {
                const segment = this.segments[i];
                const angle = segment.angle;
                const radiusMultiplier = segment.radiusMultiplier;
                const pulseFactor = segment.pulseFactor;
                
                // Calculate radius with pulse effect
                const r = this.radius * radiusMultiplier * (1 + this.pulseAmount * pulseFactor);
                
                const x = cos(angle) * r;
                const y = sin(angle) * r;
                
                curveVertex(x, y);
            }
            
            // Need to repeat the first few points to close the curve properly
            for (let i = 0; i < 3; i++) {
                const segment = this.segments[i];
                const angle = segment.angle;
                const radiusMultiplier = segment.radiusMultiplier;
                const pulseFactor = segment.pulseFactor;
                
                const r = this.radius * radiusMultiplier * (1 + this.pulseAmount * pulseFactor);
                
                const x = cos(angle) * r;
                const y = sin(angle) * r;
                
                curveVertex(x, y);
            }
            
            endShape();
            
            // Draw highlight
            fill(255, 255, 255, 70);
            let highlightSize = this.radius * 0.6;
            ellipse(-this.radius * 0.25, -this.radius * 0.25, highlightSize, highlightSize);
        }
        
        // Draw direction indicator if enabled and moving
        if (this.directionIndicator && (this.vx !== 0 || this.vy !== 0)) {
            const movementLength = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (movementLength > 0.1) {
                // Draw outer ring
                noFill();
                stroke(255, 180);
                strokeWeight(2);
                ellipse(0, 0, this.radius * 2.4);
                
                // Draw direction arrow/indicator
                const indicatorLength = this.radius * 1.2;
                const arrowX = this.lastDirection.x * indicatorLength;
                const arrowY = this.lastDirection.y * indicatorLength;
                
                stroke(255, 220);
                strokeWeight(3);
                line(0, 0, arrowX, arrowY);
                
                // Draw arrow head
                push();
                translate(arrowX, arrowY);
                rotate(this.directionAngle);
                fill(255, 220);
                noStroke();
                triangle(
                    0, 0,
                    -10, -5,
                    -10, 5
                );
                pop();
            }
        }
        
        // Draw name
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(max(10, this.radius / 3));
        text(this.name, 0, -this.radius - 10);
        
        pop();
    }
    
    grow(amount) {
        this.radius += amount * 0.2; // Scale growth for balance
        this.score += amount;
    }
    
    calculateSpeed() {
        // Speed decreases as player gets bigger
        return this.maxSpeed * (1 - min(0.8, this.radius / 300));
    }
    
    // Used for receiving updates from server
    setPosition(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
    }
    
    // Method to set custom image
    setCustomImage(img) {
        this.customImage = img;
        this.hasCustomImage = true;
    }
    
    // Method to remove custom image
    removeCustomImage() {
        this.customImage = null;
        this.hasCustomImage = false;
    }
    
    // Method to toggle direction indicator
    toggleDirectionIndicator() {
        this.directionIndicator = !this.directionIndicator;
        return this.directionIndicator;
    }
}
