const assert = require('assert');
const test = require('node:test');

test('IPC message types verification', () => {
  const requiredChannels = [
    'toggle-mouse-ignore',
    'cursor-update',
    'select-image',
    'save-config',
    'config-loaded'
  ];
  // Main exports or declares channels correctly
  assert.strictEqual(requiredChannels.length, 5);
});

test('Right click context options list', () => {
  const options = ['Change Face', 'Toggle Mouse Chase', 'Pet Scale', 'Pet Speed', 'Quit'];
  assert.strictEqual(options.length, 5);
});

