const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreEl = document.getElementById('scoreBoard');
const finalScoreEl = document.getElementById('finalScore');
const finalBestEl = document.getElementById('finalBest');

const friendImage = new Image();
const girlImage = new Image();
friendImage.src = 'images/friend.jpg';
girlImage.src = 'images/girl.jpg';

let W = 520, H = 900;
let running = false, frame = 0, score = 0;
let best = Number(localStorage.getItem('kantaKamandaluBest') || 0);
let obstacles = [];
const ground = 72;
const gap = 195;
const speed = 3.1;

const player = { x: 90, y: 300, size: 66, vy: 0, gravity: .46, flap: -8.1, angle: 0 };

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = Math.max(320, Math.floor(rect.width));
  H = Math.max(480, Math.floor(rect.height));
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function reset() {
  score = 0; frame = 0; obstacles = [];
  player.x = Math.min(105, W * .22);
  player.y = H * .45;
  player.vy = 0; player.angle = 0;
  scoreEl.textContent = '0';
}

function start() {
  reset();
  running = true;
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  requestAnimationFrame(loop);
}

function gameOver() {
  if (!running) return;
  running = false;
  if (score > best) {
    best = score;
    localStorage.setItem('kantaKamandaluBest', best);
  }
  finalScoreEl.textContent = score;
  finalBestEl.textContent = best;
  gameOverScreen.classList.remove('hidden');
}

function flap() {
  if (running) player.vy = player.flap;
}

startButton.addEventListener('click', start);
restartButton.addEventListener('click', start);
window.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); }
});
canvas.addEventListener('pointerdown', e => { e.preventDefault(); flap(); });

function makeObstacle() {
  const minTop = 80;
  const maxTop = Math.max(minTop + 10, H - ground - gap - 90);
  const top = minTop + Math.random() * (maxTop - minTop);
  obstacles.push({ x: W + 10, top, bottom: top + gap, width: 112, passed: false });
}

function update() {
  frame++;
  player.vy += player.gravity;
  player.y += player.vy;
  player.angle = Math.max(-25, Math.min(90, player.vy * 4));

  if (player.y < 0) { player.y = 0; player.vy = 0; }
  if (player.y + player.size > H - ground) { gameOver(); return; }

  if (frame % 105 === 0) makeObstacle();
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= speed;
    if (!o.passed && o.x + o.width < player.x) {
      o.passed = true; score++; scoreEl.textContent = score;
    }
    if (o.x + o.width < -20) obstacles.splice(i, 1);
  }

  const pad = 8;
  const px = player.x + pad, py = player.y + pad;
  const pw = player.size - pad * 2, ph = player.size - pad * 2;
  for (const o of obstacles) {
    if (rectHit(px, py, pw, ph, o.x, 0, o.width, o.top) ||
        rectHit(px, py, pw, ph, o.x, o.bottom, o.width, H - ground - o.bottom)) {
      gameOver(); return;
    }
  }
}

function rectHit(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function drawCloud(x, y, s) {
  ctx.fillStyle = 'rgba(255,255,255,.78)';
  ctx.beginPath();
  ctx.arc(x, y, 24*s, 0, Math.PI*2);
  ctx.arc(x+28*s, y-10*s, 31*s, 0, Math.PI*2);
  ctx.arc(x+60*s, y, 23*s, 0, Math.PI*2);
  ctx.fill();
}

function background() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#49bdf5'); g.addColorStop(1, '#d9f6ff');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  drawCloud(W*.18, H*.14, 1);
  drawCloud(W*.72, H*.24, .75);
  drawCloud(W*.42, H*.38, .55);
  ctx.fillStyle = '#72c94a'; ctx.fillRect(0, H-ground, W, ground);
  ctx.fillStyle = '#4f9733'; ctx.fillRect(0, H-ground, W, 8);
}

function drawGirlColumn(o, y, h) {
  if (h <= 0) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(o.x, y, o.width, h); ctx.clip();
  const imageH = Math.max(115, o.width * 1.55);
  let yy = y;
  while (yy < y + h) {
    ctx.drawImage(girlImage, o.x, yy, o.width, imageH);
    yy += imageH;
  }
  ctx.restore();
}

function drawObstacles() {
  for (const o of obstacles) {
    drawGirlColumn(o, 0, o.top);
    drawGirlColumn(o, o.bottom, H-ground-o.bottom);
  }
}

function drawPlayer() {
  ctx.save();
  const cx = player.x + player.size/2, cy = player.y + player.size/2;
  ctx.translate(cx, cy);
  ctx.rotate(player.angle * Math.PI/180);
  ctx.beginPath(); ctx.arc(0, 0, player.size/2, 0, Math.PI*2); ctx.clip();
  ctx.drawImage(friendImage, -player.size/2, -player.size/2, player.size, player.size);
  ctx.restore();
}

function draw() {
  background();
  drawObstacles();
  drawPlayer();
}

function loop() {
  if (!running) { draw(); return; }
  update();
  draw();
  if (running) requestAnimationFrame(loop);
}

friendImage.onload = draw;
girlImage.onload = draw;
draw();
