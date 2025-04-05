// Utility functions

// Generate a unique ID
function generateID() {
    return Math.random().toString(36).substr(2, 9);
}

// Linear interpolation
function lerp(start, end, amt) {
    return start * (1 - amt) + end * amt;
}

// Convert HSL to RGB
function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

// Generate a color with a specific hue range
function generateColorInRange(hueMin, hueMax) {
    const hue = hueMin + Math.random() * (hueMax - hueMin);
    const saturation = 0.7 + Math.random() * 0.3; // 0.7 - 1.0
    const lightness = 0.4 + Math.random() * 0.3; // 0.4 - 0.7
    
    const rgb = hslToRgb(hue / 360, saturation, lightness);
    return color(rgb.r, rgb.g, rgb.b);
}

// Calculate distance between two points
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// Safely parse JSON with a fallback
function safeJSONParse(str, fallback) {
    try {
        return JSON.parse(str);
    } catch (e) {
        console.error('Error parsing JSON:', e);
        return fallback;
    }
}

// Debounce function to limit how often a function can run
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Format a number with commas as thousands separators
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Check if device is mobile
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Generate a hash code from a string
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    // Ensure positive values and limit range
    return ((hash & 0x7FFFFFFF) % 0x1000000) | 0x404040; // Add base color to ensure visibility
}

// Validate image file
function validateImageFile(file) {
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        return false;
    }
    
    // Check file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
        return false;
    }
    
    return true;
}
