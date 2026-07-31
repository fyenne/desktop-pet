const assert = require('assert');
const test = require('node:test');
const fs = require('fs');
const path = require('path');
const configManager = require('../config-manager.js');

test('Config Manager Load & Save', () => {
  const tempConfigPath = path.join(__dirname, 'temp-config.json');
  if (fs.existsSync(tempConfigPath)) fs.unlinkSync(tempConfigPath);

  // Test default fallback
  const config = configManager.loadConfig(tempConfigPath);
  assert.ok(config.pets, "Pets array should exist");
  assert.strictEqual(config.pets[0].scale, 1.0);
  assert.strictEqual(config.pets[0].speed, 1.0);
  assert.strictEqual(config.mouseChaseEnabled, true);

  // Test saving new values
  config.pets[0].scale = 1.5;
  configManager.saveConfig(tempConfigPath, config);

  const reloaded = configManager.loadConfig(tempConfigPath);
  assert.strictEqual(reloaded.pets[0].scale, 1.5);

  if (fs.existsSync(tempConfigPath)) fs.unlinkSync(tempConfigPath);
});
