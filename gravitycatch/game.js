// Gravity Catch Game - Physics-based catching game using Newton forces

// Game canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let score = 0;
let lives = 5;
let level = 1;
let gameActive = true;
let netPosition = canvas.width / 2;
let balls = [];
let massPoints = [];

// Mass point class (from Newton physics engine)
class MassPoint {
    constructor(rx, ry, vx = 0, vy = 0) {
        this.rx = rx;
        this.ry = ry;
        this.vx = vx;
        this.vy = vy;
        this.fx = 0;
        this.fy = 0;
        this.links = [];
    }
}

// Ball class
class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vy = 0;
        this.radius = 12;
        this.color = this.randomColor();
        this.caught = false;
    }

    randomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd', '#ff9ff3'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        if (!this.caught) {
            this.vy += 0.3; // Gravity
            this.y += this.vy;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Highlight
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 4, this.radius / 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    }
}

// Create elastic net
function createNet() {
    massPoints = [];
    const netWidth = 8;
    const spacing = 12;
    const netY = canvas.height - 60;

    for (let i = 0; i < netWidth; i++) {
        const x = netPosition - (netWidth * spacing) / 2 + i * spacing;
        massPoints.push(new MassPoint(x, netY));
    }

    // Create links between adjacent points
    for (let i = 0; i < massPoints.length - 1; i++) {
        massPoints[i].links.push(i + 1);
    }
}

// Update net physics
function updateNet() {
    // Clear forces
    massPoints.forEach(m => {
        m.fx = 0;
        m.fy = 0;
    });

    // Compute spring forces
    massPoints.forEach(m => {
        m.links.forEach(linkIdx => {
            const n = massPoints[linkIdx];
            const dx = m.rx - n.rx;
            const dy = m.ry - n.ry;
            const len = Math.sqrt(dx * dx + dy * dy);
            const force = Math.pow((len - 12) * 3, 3);
            
            m.fx += -(force / len) * dx;
            m.fy += -(force / len) * dy;
            n.fx += (force / len) * dx;
            n.fy += (force / len) * dy;
        });
    });

    // Update velocities and positions
    massPoints.forEach(m => {
        m.vx += 0.02 * m.fx;
        m.vy += 0.02 * m.fy;
        m.vx *= 0.95; // Damping
        m.vy *= 0.95;
        m.rx += 0.5 * m.vx;
        m.ry += 0.5 * m.vy;
    });

    // Keep first and last points at target positions
    if (massPoints.length > 0) {
        const netWidth = 8;
        const spacing = 12;
        massPoints[0].rx = netPosition - (netWidth * spacing) / 2;
        massPoints[0].ry = canvas.height - 60;
        massPoints[0].vx = 0;
        massPoints[0].vy = 0;
        
        massPoints[massPoints.length - 1].rx = netPosition + (netWidth * spacing) / 2;
        massPoints[massPoints.length - 1].ry = canvas.height - 60;
        massPoints[massPoints.length - 1].vx = 0;
        massPoints[massPoints.length - 1].vy = 0;
    }
}

// Draw net
function drawNet() {
    // Draw springs
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 3;
    massPoints.forEach((m, idx) => {
        m.links.forEach(linkIdx => {
            const n = massPoints[linkIdx];
            ctx.beginPath();
            ctx.moveTo(m.rx, m.ry);
            ctx.lineTo(n.rx, n.ry);
            ctx.stroke();
        });
    });

    // Draw mass points
    massPoints.forEach(m => {
        ctx.beginPath();
        ctx.arc(m.rx, m.ry, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#34495e';
        ctx.fill();
    });
}

// Spawn new ball
function spawnBall() {
    const x = Math.random() * (canvas.width - 50) + 25;
    balls.push(new Ball(x, -20));
}

// Check collisions
function checkCollisions() {
    // Iterate backwards to safely remove items while iterating
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        if (!ball.caught && ball.y > canvas.height - 80) {
            // Check if ball is within net range
            const netLeft = netPosition - 60;
            const netRight = netPosition + 60;
            
            if (ball.x >= netLeft && ball.x <= netRight && ball.y >= canvas.height - 80 && ball.y <= canvas.height - 40) {
                // Ball caught!
                ball.caught = true;
                score += 10 * level;
                updateScore();
                
                // Apply force to net at impact point
                const impactPoint = Math.floor(((ball.x - netLeft) / (netRight - netLeft)) * massPoints.length);
                if (impactPoint >= 0 && impactPoint < massPoints.length) {
                    massPoints[impactPoint].vy += 20;
                }
                
                // Remove ball after short delay
                setTimeout(() => {
                    const idx = balls.indexOf(ball);
                    if (idx > -1) {
                        balls.splice(idx, 1);
                    }
                }, 200);
            } else if (ball.y > canvas.height + 20) {
                // Ball missed
                balls.splice(i, 1);
                lives--;
                updateLives();
                
                if (lives <= 0) {
                    endGame();
                }
            }
        }
    }
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = score;
    
    // Level up every 100 points
    const newLevel = Math.floor(score / 100) + 1;
    if (newLevel > level) {
        level = newLevel;
        document.getElementById('level').textContent = level;
    }
}

// Update lives display
function updateLives() {
    document.getElementById('lives').textContent = lives;
}

// End game
function endGame() {
    gameActive = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
}

// Restart game
function restartGame() {
    score = 0;
    lives = 5;
    level = 1;
    gameActive = true;
    balls = [];
    netPosition = canvas.width / 2;
    
    updateScore();
    updateLives();
    document.getElementById('level').textContent = level;
    document.getElementById('gameOver').style.display = 'none';
    
    createNet();
    requestAnimationFrame(gameLoop); // Restart animation loop
}

// Keyboard controls
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Game loop
let lastSpawn = 0;
function gameLoop(timestamp) {
    if (!gameActive) {
        return; // Don't request next frame when game is not active
    }

    // Clear canvas
    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(1, '#ffffff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Handle keyboard input
    if (keys['ArrowLeft'] || keys['a']) {
        netPosition = Math.max(60, netPosition - 5);
    }
    if (keys['ArrowRight'] || keys['d']) {
        netPosition = Math.min(canvas.width - 60, netPosition + 5);
    }

    // Spawn balls
    const spawnRate = Math.max(800 - level * 50, 300);
    if (timestamp - lastSpawn > spawnRate) {
        spawnBall();
        lastSpawn = timestamp;
    }

    // Update game objects
    balls.forEach(ball => {
        ball.update();
        ball.draw();
    });

    updateNet();
    drawNet();
    checkCollisions();

    requestAnimationFrame(gameLoop);
}

// Initialize game
createNet();
requestAnimationFrame(gameLoop);
