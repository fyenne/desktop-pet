const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const configManager = require('./config-manager');

const configPath = path.join(app.getPath('userData'), 'config.json');
let config = configManager.loadConfig(configPath);
let mainWindows = {}; // Store all open BrowserWindows keyed by petId
let petPositions = {}; // Store global coordinates { x, y } of active pets
let cursorPollInterval = null;

function createWindow(pet) {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  const win = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load index.html passing the unique petId as a query parameter
  win.loadURL(`file://${__dirname}/index.html?petId=${pet.id}`);

  // Clear HTTP and image cache to ensure swapped photos reload instantly
  win.webContents.session.clearCache();

  // Initial click through
  win.setIgnoreMouseEvents(true, { forward: true });

  win.on('closed', () => {
    delete mainWindows[pet.id];
    delete petPositions[pet.id]; // Clean up position registration
    if (Object.keys(mainWindows).length === 0) {
      if (cursorPollInterval) clearInterval(cursorPollInterval);
    }
  });

  mainWindows[pet.id] = win;
}

// Receive coordinates from a pet, update master record, and reply with other pets' coordinates
ipcMain.on('pet-position-update', (event, { id, x, y }) => {
  petPositions[id] = { x, y };

  const otherPets = {};
  Object.keys(petPositions).forEach(pId => {
    if (pId !== id) {
      otherPets[pId] = petPositions[pId];
    }
  });

  event.reply('other-pets-update', otherPets);
});

// Handle click-through toggles from renderer (specific to each window)
ipcMain.on('toggle-mouse-ignore', (event, ignore) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (ignore) {
      win.setIgnoreMouseEvents(true, { forward: true });
    } else {
      win.setIgnoreMouseEvents(false);
    }
  }
});

// Load configuration for a specific pet
ipcMain.on('get-config', (event, petId) => {
  const pet = config.pets.find(p => p.id === petId) || { id: petId, ...configManager.DEFAULT_PET };
  event.reply('config-loaded', { ...pet, mouseChaseEnabled: config.mouseChaseEnabled });
});

// Update configuration for a specific pet
ipcMain.on('save-config', (event, update) => {
  const petId = update.id;
  const index = config.pets.findIndex(p => p.id === petId);
  if (index !== -1) {
    config.pets[index] = { ...config.pets[index], ...update };
    configManager.saveConfig(configPath, config);
    
    const win = mainWindows[petId];
    if (win) {
      win.webContents.send('config-loaded', { ...config.pets[index], mouseChaseEnabled: config.mouseChaseEnabled });
    }
  }
});

// Handle native file picker dialog for a specific pet
ipcMain.on('select-image', async (event, petId) => {
  const win = mainWindows[petId];
  if (!win) return;

  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'gif', 'webp'] }]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    const targetDir = path.join(app.getPath('userData'), 'assets');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    // Save image with a unique filename keyed to the pet's ID
    const destPath = path.join(targetDir, `face-${petId}` + path.extname(selectedPath));
    fs.copyFileSync(selectedPath, destPath);

    const index = config.pets.findIndex(p => p.id === petId);
    if (index !== -1) {
      config.pets[index].imagePath = destPath;
      configManager.saveConfig(configPath, config);
      win.webContents.send('config-loaded', { ...config.pets[index], mouseChaseEnabled: config.mouseChaseEnabled });
    }
  }
});

const { Menu } = require('electron');

ipcMain.on('show-context-menu', (event, petId) => {
  const pet = config.pets.find(p => p.id === petId);
  if (!pet) return;

  const template = [
    {
      label: 'Change Face...',
      click: () => {
        ipcMain.emit('select-image', event, petId);
      }
    },
    {
      label: 'Toggle Mouse Chase',
      type: 'checkbox',
      checked: config.mouseChaseEnabled,
      click: () => {
        config.mouseChaseEnabled = !config.mouseChaseEnabled;
        configManager.saveConfig(configPath, config);
        
        // Broadcast mouse chase toggle to all running pets
        Object.values(mainWindows).forEach(win => {
          const pId = Object.keys(mainWindows).find(k => mainWindows[k] === win);
          const pConfig = config.pets.find(p => p.id === pId);
          if (win && pConfig) {
            win.webContents.send('config-loaded', { ...pConfig, mouseChaseEnabled: config.mouseChaseEnabled });
          }
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Scale',
      submenu: [
        { label: 'Tiny (0.7x)', type: 'radio', checked: pet.scale === 0.7, click: () => setScale(petId, 0.7) },
        { label: 'Normal (1.0x)', type: 'radio', checked: pet.scale === 1.0, click: () => setScale(petId, 1.0) },
        { label: 'Large (1.4x)', type: 'radio', checked: pet.scale === 1.4, click: () => setScale(petId, 1.4) }
      ]
    },
    {
      label: 'Speed',
      submenu: [
        { label: 'Slow', type: 'radio', checked: pet.speed === 0.5, click: () => setSpeed(petId, 0.5) },
        { label: 'Normal', type: 'radio', checked: pet.speed === 1.0, click: () => setSpeed(petId, 1.0) },
        { label: 'Fast', type: 'radio', checked: pet.speed === 1.8, click: () => setSpeed(petId, 1.8) }
      ]
    },
    {
      label: 'Body Style',
      submenu: [
        { label: 'Golden (Original)', type: 'radio', checked: pet.bodyStyle === 'golden', click: () => setBodyStyle(petId, 'golden') },
        { label: 'Short Corgi', type: 'radio', checked: pet.bodyStyle === 'corgi', click: () => setBodyStyle(petId, 'corgi') },
        { label: 'Sleek Greyhound', type: 'radio', checked: pet.bodyStyle === 'greyhound', click: () => setBodyStyle(petId, 'greyhound') },
        { label: 'Spotty Dalmatian', type: 'radio', checked: pet.bodyStyle === 'dalmatian', click: () => setBodyStyle(petId, 'dalmatian') }
      ]
    },
    { type: 'separator' },
    {
      label: '➕ Spawn New Pet',
      click: () => {
        spawnNewPet();
      }
    },
    {
      label: '❌ Remove This Pet',
      enabled: config.pets.length > 1, // Require at least one pet remains
      click: () => {
        removePet(petId);
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  menu.popup(BrowserWindow.fromWebContents(event.sender));
});

function setScale(petId, val) {
  const index = config.pets.findIndex(p => p.id === petId);
  if (index !== -1) {
    config.pets[index].scale = val;
    configManager.saveConfig(configPath, config);
    const win = mainWindows[petId];
    if (win) {
      win.webContents.send('config-loaded', { ...config.pets[index], mouseChaseEnabled: config.mouseChaseEnabled });
    }
  }
}

function setSpeed(petId, val) {
  const index = config.pets.findIndex(p => p.id === petId);
  if (index !== -1) {
    config.pets[index].speed = val;
    configManager.saveConfig(configPath, config);
    const win = mainWindows[petId];
    if (win) {
      win.webContents.send('config-loaded', { ...config.pets[index], mouseChaseEnabled: config.mouseChaseEnabled });
    }
  }
}

function setBodyStyle(petId, val) {
  const index = config.pets.findIndex(p => p.id === petId);
  if (index !== -1) {
    config.pets[index].bodyStyle = val;
    configManager.saveConfig(configPath, config);
    const win = mainWindows[petId];
    if (win) {
      win.webContents.send('config-loaded', { ...config.pets[index], mouseChaseEnabled: config.mouseChaseEnabled });
    }
  }
}

// Spawns a new independent pet with a randomized initial body style
function spawnNewPet() {
  const newId = `pet-${Date.now()}`;
  const styles = ['golden', 'corgi', 'greyhound', 'dalmatian'];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];

  const newPet = {
    id: newId,
    ...configManager.DEFAULT_PET,
    bodyStyle: randomStyle
  };

  config.pets.push(newPet);
  configManager.saveConfig(configPath, config);

  createWindow(newPet);
}

// Removes a pet and shuts down its corresponding window
function removePet(petId) {
  const win = mainWindows[petId];
  if (win) {
    win.close();
    delete mainWindows[petId];
  }

  config.pets = config.pets.filter(p => p.id !== petId);
  configManager.saveConfig(configPath, config);
}

// Broadcasts global cursor coordinates to all open pet windows
function startCursorPolling() {
  if (cursorPollInterval) clearInterval(cursorPollInterval);
  cursorPollInterval = setInterval(() => {
    const cursor = screen.getCursorScreenPoint();
    Object.values(mainWindows).forEach(win => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('cursor-update', cursor);
      }
    });
  }, 33); // ~30Hz
}

app.whenReady().then(() => {
  // Spawn all saved pets on startup
  config.pets.forEach(pet => {
    createWindow(pet);
  });
  startCursorPolling();

  app.on('activate', () => {
    if (Object.keys(mainWindows).length === 0) {
      config.pets.forEach(pet => {
        createWindow(pet);
      });
      startCursorPolling();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
