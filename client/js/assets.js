// Assets creation with P5.js
// This file contains functions to generate game assets using P5.js drawing functions

// Generate orb texture - adds visual detail to player orbs
function generateOrbTexture(size, baseColor) {
    // Create a P5 graphics buffer to draw the texture
    const buffer = createGraphics(size, size);
    
    // Set blend mode for better visual effects
    buffer.blendMode(OVERLAY);
    
    // Get color components
    const r = red(baseColor);
    const g = green(baseColor);
    const b = blue(baseColor);
    
    // Draw base circle
    buffer.noStroke();
    buffer.fill(r, g, b);
    buffer.ellipse(size/2, size/2, size);
    
    // Add highlights
    buffer.fill(255, 100);
    buffer.ellipse(size * 0.35, size * 0.35, size * 0.6);
    
    // Add texture details
    buffer.noFill();
    for (let i = 0; i < 5; i++) {
        const alpha = random(20, 80);
        buffer.stroke(255, alpha);
        buffer.strokeWeight(random(0.5, 2));
        
        const x = random(size * 0.2, size * 0.8);
        const y = random(size * 0.2, size * 0.8);
        const radius = random(size * 0.1, size * 0.3);
        
        buffer.ellipse(x, y, radius * 2);
    }
    
    // Add some noise texture
    buffer.loadPixels();
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            // Get pixel index
            const index = (x + y * size) * 4;
            
            // Only modify pixels inside the circle
            const distFromCenter = dist(x, y, size/2, size/2);
            if (distFromCenter < size/2) {
                // Add noise to each color channel
                const noiseValue = random(-10, 10);
                buffer.pixels[index] = constrain(buffer.pixels[index] + noiseValue, 0, 255);
                buffer.pixels[index+1] = constrain(buffer.pixels[index+1] + noiseValue, 0, 255);
                buffer.pixels[index+2] = constrain(buffer.pixels[index+2] + noiseValue, 0, 255);
            }
        }
    }
    buffer.updatePixels();
    
    return buffer;
}

// Generate food particle effect
function generateFoodParticles(x, y, color, count) {
    const particles = [];
    
    for (let i = 0; i < count; i++) {
        const angle = random(TWO_PI);
        const speed = random(1, 3);
        
        particles.push({
            x: x,
            y: y,
            vx: cos(angle) * speed,
            vy: sin(angle) * speed,
            size: random(2, 5),
            color: color,
            alpha: 255,
            life: random(20, 40)
        });
    }
    
    return particles;
}

// Draw particles
function drawParticles(particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Update particle
        p.x += p.vx;
        p.vy += 0.1; // Add gravity
        p.y += p.vy;
        p.size *= 0.95; // Shrink
        p.alpha -= 255 / p.life; // Fade out
        p.life--;
        
        // Draw particle
        noStroke();
        fill(red(p.color), green(p.color), blue(p.color), p.alpha);
        ellipse(p.x, p.y, p.size);
        
        // Remove dead particles
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Generate background pattern
function generateBackgroundPattern(width, height, gridSize, color) {
    const buffer = createGraphics(width, height);
    
    buffer.background(240);
    buffer.stroke(color);
    buffer.strokeWeight(1);
    
    // Draw grid
    for (let x = 0; x < width; x += gridSize) {
        buffer.line(x, 0, x, height);
    }
    
    for (let y = 0; y < height; y += gridSize) {
        buffer.line(0, y, width, y);
    }
    
    // Add some random dots at grid intersections
    buffer.noStroke();
    buffer.fill(color);
    
    for (let x = 0; x < width; x += gridSize) {
        for (let y = 0; y < height; y += gridSize) {
            if (random() < 0.2) { // 20% chance
                buffer.ellipse(x, y, 3);
            }
        }
    }
    
    return buffer;
}

// Generate explosion effect
function generateExplosion(x, y, color, size) {
    const particles = [];
    const particleCount = floor(size / 2) + 10;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = random(TWO_PI);
        const speed = random(2, 8);
        const distance = random(0.2, 1) * size;
        
        particles.push({
            x: x,
            y: y,
            targetX: x + cos(angle) * distance,
            targetY: y + sin(angle) * distance,
            size: random(5, 15),
            color: color,
            alpha: 255,
            life: random(20, 40),
            progress: 0,
            progressSpeed: random(0.02, 0.08)
        });
    }
    
    return particles;
}

// Draw explosion
function drawExplosion(particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Update particle using easing
        p.progress = min(1, p.progress + p.progressSpeed);
        p.x = lerp(p.x, p.targetX, 0.1);
        p.y = lerp(p.y, p.targetY, 0.1);
        p.size *= 0.95;
        p.alpha = 255 * (1 - p.progress);
        
        // Draw particle
        noStroke();
        fill(red(p.color), green(p.color), blue(p.color), p.alpha);
        ellipse(p.x, p.y, p.size);
        
        // Remove completed particles
        if (p.progress >= 1) {
            particles.splice(i, 1);
        }
    }
    
    return particles.length > 0;
}