const { ipcRenderer } = require('electron');
const physics = require('./physics');

const petEl = document.getElementById('pet');
const faceEl = document.getElementById('face');
const bodyEl = document.getElementById('body');
const cursorCompanion = document.getElementById('cursor-companion');
const speechEl = document.getElementById('speech-bubble');

// Read unique petId from URL parameters (supports multiple pets)
const urlParams = new URLSearchParams(window.location.search);
const petId = urlParams.get('petId') || 'pet-1';

let currentPos = { x: window.innerWidth - 200, y: window.innerHeight - 200 }; // Start bottom right
let currentVelocity = { x: 0, y: 0 };
let targetPos = { x: window.innerWidth - 200, y: window.innerHeight - 200 };
let currentConfig = { scale: 1.0, speed: 1.0, mouseChaseEnabled: true, imagePath: 'assets/default-face.png', bodyStyle: 'golden' };
let currentState = 'idle'; // 'idle', 'walking', 'running', 'sleeping'
let stateTimer = 0;
let lastActiveTime = Date.now();

// Separation/Dodge variables
let otherPetPositions = {};
let frameCount = 0;

// Initial positions
petEl.style.left = `${currentPos.x}px`;
petEl.style.top = `${currentPos.y}px`;

// Request settings for this specific pet ID
ipcRenderer.send('get-config', petId);
ipcRenderer.on('config-loaded', (event, config) => {
  // Only accept config if it matches this pet's ID
  if (config.id && config.id !== petId) return;
  currentConfig = config;
  updateConfigStyles();
});

// Receive details about other pets' coordinates
ipcRenderer.on('other-pets-update', (event, otherPets) => {
  otherPetPositions = otherPets;
});

function updateConfigStyles() {
  faceEl.style.backgroundImage = `url('file://${currentConfig.imagePath.replace(/\\/g, '/')}')`;
  petEl.style.transform = `scale(${currentConfig.scale})`;
  
  // Set the body style class
  bodyEl.className = `pet-body body-style-${currentConfig.bodyStyle || 'golden'}`;
}

// Chinese speech texts selection
const SPEECH_TEXTS = [
  "爸爸！",
  "主人！",
  "爸爸，抱抱我",
  "主人，摸摸头",
  "汪汪！主人",
  "爸爸最好了！",
  "主人，好饿呀",
  "爸爸在看我吗？",
  "主人，带我散步吧"
];

let speechTimeout = null;

function showSpeechBubble() {
  const randomText = SPEECH_TEXTS[Math.floor(Math.random() * SPEECH_TEXTS.length)];
  speechEl.innerText = randomText;
  
  // Trigger bouncy pop open
  speechEl.classList.add('show');
  
  // Hide bubble after 2000ms
  setTimeout(() => {
    speechEl.classList.remove('show');
  }, 2000);
  
  // Schedule next bubble at a random time between 3 and 6 seconds (3000ms - 6000ms)
  const nextDelay = 3000 + Math.random() * 3000;
  speechTimeout = setTimeout(showSpeechBubble, nextDelay);
}

// Start speech loop on load
setTimeout(showSpeechBubble, 3000 + Math.random() * 3000);

function pickNewWanderTarget() {
  // Wander anywhere across the entire monitor screen!
  targetPos = {
    x: 100 + Math.random() * (window.innerWidth - 300),
    y: 100 + Math.random() * (window.innerHeight - 300)
  };
  currentState = 'walking';
  petEl.className = 'pet-container walking';
  stateTimer = 150 + Math.random() * 250; // Random walk duration
}

// Receive global mouse updates from Main process 30 times a second
ipcRenderer.on('cursor-update', (event, cursor) => {
  // Move the poop-emoji companion so it sits slightly offset next to the actual pointer
  cursorCompanion.style.left = `${cursor.x}px`;
  cursorCompanion.style.top = `${cursor.y}px`;

  // --- ROBUST HIT TESTING (Fixes Right-Click Menu) ---
  // The pet's bounding box is exactly inside [currentPos, currentPos + 150]
  // Since we poll the cursor natively from the main process, this check is 100% reliable
  const petSize = 150 * currentConfig.scale;
  const isOverPet = cursor.x >= currentPos.x && cursor.x <= currentPos.x + petSize &&
                    cursor.y >= currentPos.y && cursor.y <= currentPos.y + petSize;

  // Notify main process to enable/disable mouse click-through for this specific window
  ipcRenderer.send('toggle-mouse-ignore', !isOverPet);

  if (isOverPet) {
    lastActiveTime = Date.now();
  }

  // --- Chasing Logic ---
  if (!currentConfig.mouseChaseEnabled) {
    if (currentState === 'running') {
      currentState = 'idle';
      petEl.className = 'pet-container';
    }
    return;
  }

  // Calculate distance from pet's center to the global cursor
  const petCenterX = currentPos.x + 75;
  const petCenterY = currentPos.y + 75;

  const dx = cursor.x - petCenterX;
  const dy = cursor.y - petCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // If mouse is near (closer than 600px but not already touching) -> Chase it!
  if (distance > 30 && distance < 600) {
    // Target position is offset so the pet's center aligns with the cursor
    targetPos = { x: cursor.x - 75, y: cursor.y - 75 };
    currentState = 'running';
    petEl.className = 'pet-container running';
    lastActiveTime = Date.now();
  } else {
    // Stop chasing if mouse is too far or already caught
    if (currentState === 'running') {
      currentState = 'idle';
      petEl.className = 'pet-container';
      currentVelocity = { x: 0, y: 0 };
    }
  }
});

function update() {
  stateTimer--;
  const idleDuration = Date.now() - lastActiveTime;

  // Throttled coordinate submission back to Main process (~6Hz) to minimize CPU load
  frameCount++;
  if (frameCount % 10 === 0) {
    ipcRenderer.send('pet-position-update', { id: petId, x: currentPos.x, y: currentPos.y });
  }

  // Wake up if active
  if (currentState === 'sleeping' && idleDuration < 45000) {
    currentState = 'idle';
    petEl.className = 'pet-container';
  }

  // Sleep after 45s of idleness
  if (currentState !== 'running' && idleDuration > 45000) {
    currentState = 'sleeping';
    petEl.className = 'pet-container sleeping';
    currentVelocity = { x: 0, y: 0 };
  } else if (currentState !== 'running' && stateTimer <= 0) {
    if (currentState === 'walking') {
      currentState = 'idle';
      petEl.className = 'pet-container';
      currentVelocity = { x: 0, y: 0 };
      stateTimer = 150 + Math.random() * 300;
    } else {
      pickNewWanderTarget();
    }
  }

  // Calculate Craig Reynolds' Flocking Separation Dodge force
  let dodgeX = 0;
  let dodgeY = 0;
  Object.keys(otherPetPositions).forEach(otherId => {
    const other = otherPetPositions[otherId];
    const dx = currentPos.x - other.x;
    const dy = currentPos.y - other.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If another pet is closer than 130px, apply repulsion
    if (dist < 130 && dist > 0) {
      const force = (130 - dist) / 130; // Stronger force when extremely close
      
      // Add random angle jitter (±11 degrees) so they push away dynamically
      const jitterAngle = (Math.random() - 0.5) * 0.4;
      const cos = Math.cos(jitterAngle);
      const sin = Math.sin(jitterAngle);

      const repux = (dx / dist) * cos - (dy / dist) * sin;
      const repuy = (dx / dist) * sin + (dy / dist) * cos;

      dodgeX += repux * force * 1.5;
      dodgeY += repuy * force * 1.5;
    }
  });

  // Handle walking or running physics movements inside our fullscreen canvas
  if (currentState === 'walking' || currentState === 'running') {
    const speed = currentState === 'running' ? currentConfig.speed * 2.0 : currentConfig.speed;
    currentVelocity = physics.calculateVelocity(currentPos, targetPos, currentVelocity, speed);
    
    // Inject the separation forces directly into our computed velocity vectors!
    currentVelocity.x += dodgeX;
    currentVelocity.y += dodgeY;

    currentPos.x += currentVelocity.x;
    currentPos.y += currentVelocity.y;
    
    // Clamp coordinates inside actual screen borders
    currentPos = physics.clampPosition(currentPos, { width: window.innerWidth, height: window.innerHeight }, 150);

    petEl.style.left = `${currentPos.x}px`;
    petEl.style.top = `${currentPos.y}px`;

    // Handle direction mirroring (X scale direction flipping) and toggle text un-flipping classes
    if (currentVelocity.x > 0.1) {
      petEl.style.transform = `scale(${currentConfig.scale}) scaleX(1)`;
      petEl.classList.remove('flipped-direction');
    } else if (currentVelocity.x < -0.1) {
      petEl.style.transform = `scale(${currentConfig.scale}) scaleX(-1)`;
      petEl.classList.add('flipped-direction');
    }
  }

  requestAnimationFrame(update);
}

// Drag & Drop Listener for File Explorer
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    const ext = file.name.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
      ipcRenderer.send('save-config', { id: petId, imagePath: file.path });
      lastActiveTime = Date.now();
    }
  }
});

const whipEl = document.getElementById('whip');

// Left-click interaction: Whip crack and 45-degree head rotation
petEl.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return; // Only left-click

  e.preventDefault();
  e.stopPropagation();

  // Reset animations
  whipEl.classList.remove('cracking');
  faceEl.classList.remove('whipped');

  // Trigger reflow to restart animations
  void whipEl.offsetWidth;
  void faceEl.offsetWidth;

  whipEl.classList.add('cracking');

  // Rotate head when whip strikes!
  setTimeout(() => {
    faceEl.classList.add('whipped');
  }, 120);

  // Reset to normal posture
  setTimeout(() => {
    faceEl.classList.remove('whipped');
    whipEl.classList.remove('cracking');
  }, 850);
});

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  // Pass current petId on context menu right-click so Main process menu knows who opened it!
  ipcRenderer.send('show-context-menu', petId);
});

// Start loop
requestAnimationFrame(update);
