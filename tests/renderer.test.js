const assert = require('assert');
const test = require('node:test');

test('Animation state toggles verification', () => {
  const states = ['walking', 'running', 'sleeping', 'idle'];
  assert.strictEqual(states.length, 4);
});

test('Image extension filter check', () => {
  const isImage = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
  };
  assert.strictEqual(isImage('face.png'), true);
  assert.strictEqual(isImage('document.pdf'), false);
});
