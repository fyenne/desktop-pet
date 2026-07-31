const assert = require('assert');
const test = require('node:test');
const fs = require('fs');
const path = require('path');

test('CSS structure validation', () => {
  const cssContent = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');
  assert.ok(cssContent.includes('.pet-container'), 'Should contain .pet-container styling');
  assert.ok(cssContent.includes('.pet-face'), 'Should contain .pet-face cutout styling');
  assert.ok(cssContent.includes('.pet-body'), 'Should contain .pet-body quadruped styling');
});
