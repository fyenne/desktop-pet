const fs = require('fs');

const DEFAULT_PET = {
  imagePath: "assets/default-face.png",
  scale: 1.0,
  speed: 1.0,
  bodyStyle: "golden"
};

const DEFAULTS = {
  mouseChaseEnabled: true,
  pets: [
    { id: "pet-1", ...DEFAULT_PET }
  ]
};

function loadConfig(configPath) {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(data);

      // Backwards Compatibility Migration:
      // If the old config is a single-pet flat object, convert it to our multi-pet pets array
      if (parsed && !parsed.pets) {
        const migratedPet = {
          id: "pet-1",
          imagePath: parsed.imagePath || DEFAULT_PET.imagePath,
          scale: parsed.scale || DEFAULT_PET.scale,
          speed: parsed.speed || DEFAULT_PET.speed,
          bodyStyle: parsed.bodyStyle || DEFAULT_PET.bodyStyle
        };
        return {
          mouseChaseEnabled: parsed.mouseChaseEnabled !== undefined ? parsed.mouseChaseEnabled : DEFAULTS.mouseChaseEnabled,
          pets: [migratedPet]
        };
      }

      return { ...DEFAULTS, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load config, using defaults", e);
  }
  return { ...DEFAULTS };
}

function saveConfig(configPath, config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error("Failed to save config", e);
  }
}

module.exports = {
  DEFAULT_PET,
  loadConfig,
  saveConfig
};
