const assert = require('assert');
const test = require('node:test');
const physics = require('../physics.js');

test('calculateVelocity test', () => {
  const currentPos = { x: 100, y: 100 };
  const targetPos = { x: 200, y: 100 };
  const currentVelocity = { x: 0, y: 0 };
  const speedMultiplier = 1.0;

  const vel = physics.calculateVelocity(currentPos, targetPos, currentVelocity, speedMultiplier);
  assert.ok(vel.x > 0, "Velocity should move towards target x");
  assert.strictEqual(vel.y, 0, "Velocity y should remain unchanged since positions align");
});

test('clampPosition test', () => {
  const screenBounds = { width: 1920, height: 1080 };
  const size = 150;

  // Out of bounds x-max
  const posOutX = { x: 2000, y: 500 };
  const clampedX = physics.clampPosition(posOutX, screenBounds, size);
  assert.strictEqual(clampedX.x, 1920 - size);

  // Out of bounds y-min
  const posOutY = { x: 500, y: -50 };
  const clampedY = physics.clampPosition(posOutY, screenBounds, size);
  assert.strictEqual(clampedY.y, 0);
});
