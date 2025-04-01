// Pizza Bomb Delivery Game - Basic Structure
// Main game canvas setup
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
document.getElementById('game-container').appendChild(canvas);


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
  direction: 'down', // 'up', 'down', 'left', 'right'
  isMoving: false
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
    const width = 50 + Math.random() * 80;
    const height = 50 + Math.random() * 80;
    const x = Math.random() * (canvas.width - width);
    const y = Math.random() * (canvas.height - height);

    const tooCloseToPlayer = Math.abs(x - player.x) < 80 && Math.abs(y - player.y) < 80;
    const tooCloseToDelivery = Math.abs(x - 700) < 80 && Math.abs(y - 500) < 80;

    if (!tooCloseToPlayer && !tooCloseToDelivery) {
      obstacles.push({ x, y, width, height });
    }

    attempts++;
  }

  return obstacles;
}

function generateRandomDeliveryPoint() {
  const width = 50;
  const height = 50;
  let x, y;

  do {
    x = Math.random() * (canvas.width - width);
    y = Math.random() * (canvas.height - height);
  } while (
    Math.abs(x - player.x) < 100 && Math.abs(y - player.y) < 100
  );

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
      // Simple collision response - push player back
      if (player.direction === 'up') player.y += player.speed;
      if (player.direction === 'down') player.y -= player.speed;
      if (player.direction === 'left') player.x += player.speed;
      if (player.direction === 'right') player.x -= player.speed;
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
  ctx.fillText('PIZZA BOMB DELIVERY', canvas.width/2, 200);
  ctx.font = '24px Arial';
  ctx.fillText('Press SPACE to start', canvas.width/2, 300);
  ctx.fillText('High Score: ' + gameState.highScore, canvas.width/2, 350);
}

function renderGame() {
  const currentLevel = levels[gameState.currentLevel];
  
  // Draw obstacles
  ctx.fillStyle = '#555';
  for (const obstacle of currentLevel.obstacles) {
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
  
  // Draw player
  ctx.fillStyle = player.hasPizza ? '#f00' : '#00f';
  ctx.fillRect(player.x, player.y, player.width, player.height);
  
  // Draw HUD (Heads-Up Display)
  renderHUD();
}

function renderHUD() {
  // Timer
  ctx.fillStyle = gameState.bombTimer < 10 ? '#f00' : '#fff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Time: ${Math.ceil(gameState.bombTimer)}`, 20, 30);
  
  // Score
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'right';
  ctx.fillText(`Score: ${gameState.score}`, canvas.width - 20, 30);
  
  // Timer bar
  const barWidth = 200;
  const barHeight = 20;
  const barX = (canvas.width - barWidth) / 2;
  const barY = 20;
  
  // Background
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // Fill based on remaining time
  const fillWidth = (gameState.bombTimer / 60) * barWidth;
  ctx.fillStyle = gameState.bombTimer < 10 ? '#f00' : '#0f0';
  ctx.fillRect(barX, barY, fillWidth, barHeight);
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

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  
  if (gameState.status === 'playing') {
    updatePlayer();
    updateTimer();
  }
  
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
