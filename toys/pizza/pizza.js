// Pizza Bomb Delivery Game - Basic Structure
// Main game canvas setup
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
document.getElementById('game-container').appendChild(canvas);

// After creating the canvas and getting ctx:
ctx.imageSmoothingEnabled = false;  // keep pixel art sharp when scaled&#8203;:contentReference[oaicite:3]{index=3}

// Load sprite images
const playerImg = new Image();
playerImg.src = "driver.png";      // path to player sprite image (Dom Slice)
const deliveryImg = new Image();
deliveryImg.src = "pizza.png";    // path to delivery point sprite (pizza box)

// (Optional) You can set up onload handlers if needed:
playerImg.onload = () => console.log("Player sprite loaded");
deliveryImg.onload = () => console.log("Delivery sprite loaded");


// Game state
const gameState = {
  status: 'menu', // 'menu', 'playing', 'gameover'
  score: 0,
  highScore: 0,
  bombTimer: 60, // seconds
  currentLevel: 0
};

// Player object
const player = {
  x: 400,
  y: 300,
  width: 32,
  height: 32,
  speed: 5,
  hasPizza: true,
  direction: 'down',
  isMoving: false,
  health: 3, // ❤️ start with 3 hearts
  maxHealth: 3
};

// Controls
const keys = {
  up: false,
  down: false,
  left: false,
  right: false
};

// Level data (obstacles, delivery locations)
const levels = [
  {
    obstacles: [],
    deliveryPoint: {} // will be assigned dynamically
  }
];
function generateRandomObstacles(count = 5) {
  const obstacles = [];
  let attempts = 0;

  while (obstacles.length < count && attempts < count * 10) {
    const width = 60 + Math.random() * 60;
    const height = 30 + Math.random() * 20;

    // Random direction: true = horizontal, false = vertical
    const horizontal = Math.random() < 0.5;

    let x = Math.random() * (canvas.width - width);
    let y = Math.random() * (canvas.height - height);

    const tooCloseToPlayer = Math.abs(x - player.x) < 80 && Math.abs(y - player.y) < 80;
    const tooCloseToDelivery = Math.abs(x - 700) < 80 && Math.abs(y - 500) < 80;

    if (!tooCloseToPlayer && !tooCloseToDelivery) {
      obstacles.push({
        x, y,
        width: horizontal ? width : height,
        height: horizontal ? height : width,
        vx: horizontal ? (Math.random() < 0.5 ? -1 : 1) * 1.5 : 0,
        vy: horizontal ? 0 : (Math.random() < 0.5 ? -1 : 1) * 1.5
      });
    }

    attempts++;
  }

  return obstacles;
}
function generateRandomDeliveryPoint() {
  const width = 50;
  const height = 50;
  let x, y;
  let tries = 0;
  const maxTries = 100;
  let isColliding = false;

  do {
    x = Math.random() * (canvas.width - width);
    y = Math.random() * (canvas.height - height);

    isColliding = false;

    // Prevent spawning too close to player
    if (Math.abs(x - player.x) < 100 && Math.abs(y - player.y) < 100) {
      isColliding = true;
    }

    // Prevent overlapping with obstacles
    const obstacles = levels[gameState.currentLevel].obstacles;
    for (const obstacle of obstacles) {
      if (
        x < obstacle.x + obstacle.width &&
        x + width > obstacle.x &&
        y < obstacle.y + obstacle.height &&
        y + height > obstacle.y
      ) {
        isColliding = true;
        break;
      }
    }

    tries++;
  } while (isColliding && tries < maxTries);

  return { x, y, width, height };
}

// Input handlers
function setupInputHandlers() {
  window.addEventListener('keydown', (e) => {
    switch(e.key) {
      case 'ArrowUp': keys.up = true; break;
      case 'ArrowDown': keys.down = true; break;
      case 'ArrowLeft': keys.left = true; break;
      case 'ArrowRight': keys.right = true; break;
      case ' ': // Space bar
        if (gameState.status !== 'playing') {
          startGame();
        }
        break;
    }
  });

  window.addEventListener('keyup', (e) => {
    switch(e.key) {
      case 'ArrowUp': keys.up = false; break;
      case 'ArrowDown': keys.down = false; break;
      case 'ArrowLeft': keys.left = false; break;
      case 'ArrowRight': keys.right = false; break;
    }
  });
}

// Collision detection
function checkCollision(obj1, obj2) {
  return obj1.x < obj2.x + obj2.width &&
         obj1.x + obj1.width > obj2.x &&
         obj1.y < obj2.y + obj2.height &&
         obj1.y + obj1.height > obj2.y;
}

// Game logic
function updatePlayer() {
  player.isMoving = false;
  
  // Update player position based on input
  if (keys.up) {
    player.y -= player.speed;
    player.direction = 'up';
    player.isMoving = true;
  }
  if (keys.down) {
    player.y += player.speed;
    player.direction = 'down';
    player.isMoving = true;
  }
  if (keys.left) {
    player.x -= player.speed;
    player.direction = 'left';
    player.isMoving = true;
  }
  if (keys.right) {
    player.x += player.speed;
    player.direction = 'right';
    player.isMoving = true;
  }
  
  // Keep player within canvas bounds
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
  
  // Check collision with obstacles
  const currentLevel = levels[gameState.currentLevel];
  for (const obstacle of currentLevel.obstacles) {
    if (checkCollision(player, obstacle)) {
      player.health--;

      if (player.health <= 0) {
        gameOver();
      } else {
        // Optional: Push the player back slightly or flash
        player.x = 400;
        player.y = 300;
      }

      return; // only count 1 hit per frame
    }
  }

  // Check delivery
  if (player.hasPizza && checkCollision(player, currentLevel.deliveryPoint)) {
    successfulDelivery();
  }
}

function updateTimer() {
  if (gameState.status !== 'playing') return;
  
  gameState.bombTimer -= 1/60; // Assuming 60 FPS
  
  if (gameState.bombTimer <= 0) {
    gameOver();
  }
}
function successfulDelivery() {
  gameState.bombTimer = 60;
  gameState.score++;
  gameState.currentLevel = (gameState.currentLevel + 1) % levels.length;
  player.x = 400;
  player.y = 300;

  levels[gameState.currentLevel].obstacles = generateRandomObstacles();
  levels[gameState.currentLevel].deliveryPoint = generateRandomDeliveryPoint();
}

function gameOver() {
  gameState.status = 'gameover';
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
  }
}
function startGame() {
  gameState.status = 'playing';
  gameState.score = 0;
  gameState.bombTimer = 60;
  gameState.currentLevel = 0;
  player.x = 400;
  player.y = 300;
  player.hasPizza = true;
  player.health = player.maxHealth;

  levels[0].obstacles = generateRandomObstacles();
  levels[0].deliveryPoint = generateRandomDeliveryPoint();
}

// Rendering
function render() {
  // Clear canvas
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  if (gameState.status === 'menu') {
    renderMenu();
  } else if (gameState.status === 'playing') {
    renderGame();
  } else if (gameState.status === 'gameover') {
    renderGameOver();
  }
}

function renderMenu() {
  ctx.fillStyle = '#fff';
  ctx.font = '36px Arial';
  ctx.textAlign = 'center';
}

function renderGame() {
  const currentLevel = levels[gameState.currentLevel];
  
  // Draw obstacles
  ctx.fillStyle = '#888'; // default
  for (const obstacle of currentLevel.obstacles) {
    // Differentiate horizontal/vertical visually
    ctx.fillStyle = obstacle.vx !== 0 ? '#aa3333' : '#3333aa';
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  }

  // Animate pulse using sine wave
  // Speed up pulse as timer gets lower
  const timeFactor = Math.max(0.5, gameState.bombTimer / 60); // 1.0 → 0.5
  const pulseSpeed = 1 / timeFactor; // Faster as time goes down
  const pulse = Math.sin(performance.now() / (200 / pulseSpeed)) * 5 + 10;
  const dp = currentLevel.deliveryPoint;
  const centerX = dp.x + dp.width / 2;
  const centerY = dp.y + dp.height / 2;

  // Glowing ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulse + 20, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(54, 229, 252, 0.2)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Pulsing inner fill
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulse, 0, Math.PI * 2);
  ctx.fillStyle = '#36e5fc';
  ctx.fill();
  
  // Draw player (Dom Slice)
  if (playerImg.complete) {
    // Image loaded: draw the sprite
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    // (drawImage(image, dx, dy, dWidth, dHeight) draws the image at (dx,dy) scaled to dWidth×dHeight&#8203;:contentReference[oaicite:6]{index=6})
  } else {
    // Fallback: draw a colored rectangle if sprite not ready
    ctx.fillStyle = player.hasPizza ? "#f00" : "#00f";
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }
  
  // Draw HUD (Heads-Up Display)
  renderHUD();
}
function renderHUD() {
  const hudPadding = 10;
  const hudHeight = 50;
  const barWidth = 200;
  const barHeight = 20;
  const barX = (canvas.width - barWidth) / 2;
  const barY = hudPadding + 10;

  // === HUD background panel ===
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, hudHeight + hudPadding * 2);

  // === Pixel-style text ===
  ctx.fillStyle = '#36e5fc';
  ctx.font = '16px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${gameState.score}`, 20, 30);

  ctx.textAlign = 'right';
  ctx.fillText(`TIME: ${Math.ceil(gameState.bombTimer)}`, canvas.width - 20, 30);

  // === Timer bar ===
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  const fillWidth = (gameState.bombTimer / 60) * barWidth;
  ctx.fillStyle = gameState.bombTimer < 10 ? '#f00' : '#0f0';
  ctx.fillRect(barX, barY, fillWidth, barHeight);

  // === Border for timer bar ===
  ctx.strokeStyle = '#36e5fc';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  const heartSize = 16;
  for (let i = 0; i < player.maxHealth; i++) {
    const filled = i < player.health;
    ctx.font = '16px Arial';
    ctx.fillStyle = filled ? '#f44' : '#444';
    ctx.fillText('❤', 20 + i * (heartSize + 6), 60); // adjust spacing if needed
  }
}

function renderGameOver() {
  ctx.fillStyle = '#fff';
  ctx.font = '36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width/2, 200);
  ctx.font = '24px Arial';
  ctx.fillText(`Score: ${gameState.score}`, canvas.width/2, 250);
  ctx.fillText('Press SPACE to restart', canvas.width/2, 300);
}
function updateObstacles() {
  const currentLevel = levels[gameState.currentLevel];

  for (const obs of currentLevel.obstacles) {
    obs.x += obs.vx;
    obs.y += obs.vy;

    // Horizontal wrapping
    if (obs.vx !== 0) {
      if (obs.x > canvas.width) obs.x = -obs.width;
      if (obs.x + obs.width < 0) obs.x = canvas.width;
    }

    // Vertical wrapping
    if (obs.vy !== 0) {
      if (obs.y > canvas.height) obs.y = -obs.height;
      if (obs.y + obs.height < 0) obs.y = canvas.height;
    }
  }
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  
  if (gameState.status === 'playing') {
    updatePlayer();
    updateTimer();
    updateObstacles(); // <- Add this line

  }
  document.getElementById('score').textContent = `SCORE: ${gameState.score}`;
  document.getElementById('timer').textContent = `TIME: ${Math.ceil(gameState.bombTimer)}`;

  render();
  requestAnimationFrame(gameLoop);
}

// Initialize and start the game
function init() {
  setupInputHandlers();
  requestAnimationFrame(gameLoop);
}

// Start everything when the page loads
window.onload = init;
