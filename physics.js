function calculateVelocity(currentPos, targetPos, currentVelocity, speedMultiplier = 1.0) {
  const dx = targetPos.x - currentPos.x;
  const dy = targetPos.y - currentPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 5) {
    return { x: 0, y: 0 };
  }

  const accel = 0.4 * speedMultiplier;
  const maxSpeed = 3.0 * speedMultiplier;

  // Target velocity vector pointing to target at maxSpeed
  const targetVelX = (dx / distance) * maxSpeed;
  const targetVelY = (dy / distance) * maxSpeed;

  // Smoothly interpolate current velocity to target velocity (inertia/momentum)
  const nextVelX = currentVelocity.x + (targetVelX - currentVelocity.x) * accel;
  const nextVelY = currentVelocity.y + (targetVelY - currentVelocity.y) * accel;

  return { x: nextVelX, y: nextVelY };
}

function clampPosition(pos, screenBounds, size) {
  let x = pos.x;
  let y = pos.y;

  if (x < 0) x = 0;
  if (x > screenBounds.width - size) x = screenBounds.width - size;
  if (y < 0) y = 0;
  if (y > screenBounds.height - size) y = screenBounds.height - size;

  return { x, y };
}

module.exports = {
  calculateVelocity,
  clampPosition
};
