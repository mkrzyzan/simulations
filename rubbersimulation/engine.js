// Rubber Sheet Simulation Engine

// Get canvas and context
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

// Draw initial reference lines
ctx.strokeStyle = 'yellow';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(0, 300);
ctx.lineTo(300, 300);
ctx.lineTo(300, 0);
ctx.stroke();

// Mass points container
let p = [];

// Constants for visualization
const MASS_POINT_SIZE = 5;
const MASS_POINT_CENTER_OFFSET = 2;
const LINK_CENTER_OFFSET = 3;

// Mass point class
class MassPoint {
    constructor(rx, ry, vx = 0, vy = 0, fx = 0, fy = 0, links = []) {
        this.rx = rx;  // position x
        this.ry = ry;  // position y
        this.vx = vx;  // velocity x
        this.vy = vy;  // velocity y
        this.fx = fx;  // force x
        this.fy = fy;  // force y
        // links (bounds) - filter out false values
        this.links = links.filter(link => link !== false);
    }

    showUp() {
        // Draw the mass point
        ctx.fillStyle = 'black';
        ctx.fillRect(this.rx, this.ry, MASS_POINT_SIZE, MASS_POINT_SIZE);

        // Draw links
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        for (let linkIndex of this.links) {
            if (p[linkIndex]) {
                ctx.beginPath();
                ctx.moveTo(p[linkIndex].rx + MASS_POINT_CENTER_OFFSET, p[linkIndex].ry + MASS_POINT_CENTER_OFFSET);
                ctx.lineTo(this.rx + LINK_CENTER_OFFSET, this.ry + LINK_CENTER_OFFSET);
                ctx.stroke();
            }
        }
    }

    toString() {
        return `r(${this.rx},${this.ry}), v(${this.vx},${this.vy}), f(${this.fx},${this.fy})`;
    }
}

// Crystal bounds functions
const side = 10;
const b1 = (x, y) => (x < side - 1) ? x + 1 + y * side : false;
const b2 = (x, y) => (y < side - 1) ? x + (y + 1) * side : false;
const b3 = (x, y) => (x < side - 1 && y < side - 1) ? x + 1 + (y + 1) * side : false;

// Create net of mass points
function createNet(m, n) {
    const net = [];
    for (let y = 0; y < side; y++) {
        for (let x = 0; x < side; x++) {
            const links = [b1(x, y), b2(x, y), b3(x, y)];
            net.push(new MassPoint(x * 13 + m, y * 13 + n, 0, 0, 0, 0, links));
        }
    }
    return net;
}

// Simulation functions
function clearForce(m) {
    m.fx = 0;
    m.fy = 0;
}

function computeForce(m) {
    for (let linkIndex of m.links) {
        const n = p[linkIndex];
        if (n) {
            const len = Math.sqrt((m.rx - n.rx) ** 2 + (m.ry - n.ry) ** 2);
            const f = Math.pow((len - 20) * 4, 3);
            m.fx += -(f / len) * (m.rx - n.rx);
            m.fy += -(f / len) * (m.ry - n.ry);
            n.fx += (f / len) * (m.rx - n.rx);
            n.fy += (f / len) * (m.ry - n.ry);
        }
    }
}

function computeSpeed(m) {
    m.vx += 0.03 * m.fx;
    m.vy += 0.03 * m.fy;
    if (m.rx > 300 || m.rx < 0) m.vx = 0;
    if (m.ry > 300 || m.ry < 0) m.vy = 0;
}

function computePosition(m) {
    m.rx += 0.001 * m.vx;
    m.ry += 0.001 * m.vy;
}

function computeAttenuation(m) {
    m.vx *= 0.99;
    m.vy *= 0.99;
}

function computeGravity(m) {
    m.fx += 0;  // No horizontal gravity
    m.fy += 100;  // Vertical gravity (downward)
}

// Main animation frame
function frame() {
    // Clear canvas
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw reference lines
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(300, 300);
    ctx.lineTo(300, 0);
    ctx.stroke();

    // Physics calculations
    p.forEach(clearForce);
    p.forEach(computeForce);
    p.forEach(computeGravity);
    p.forEach(computeSpeed);
    p.forEach(computeAttenuation);
    p.forEach(computePosition);

    // Render
    p.forEach(m => m.showUp());

    // Request next frame
    requestAnimationFrame(frame);
}

// Mouse click handler
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    console.log('Creating new rubber net at', x, y);
    
    // Clear old net
    p = [];
    
    // Create new net
    const newNet = createNet(x, y);
    p.push(...newNet);
    
    console.log('New net created with', p.length, 'points');
});

// Start animation
frame();
