// Player ship: 4-way movement clamped on screen, with a bombing reticle ahead.
// Freighter-style saucer hull (a nod to a certain famous ship): twin forward
// mandibles, offset cockpit, radar dish. Banks visually when strafing.
// Takes damage from enemy fire; brief invulnerability + blink after a hit.
window.WB = window.WB || {};

WB.Player = (function () {
  var W = 480, H = 640;
  var SPEED = 260;
  var RETICLE_DIST = 130;
  var RADIUS = 13;
  var INVULN = 1.6; // seconds of invulnerability after being hit
  var x, y, invuln, powerInvuln, tilt;
  var touchTilt = 0, touchTiltTimer = 0; // banking driven by drag input

  // Vertical range: mid-screen down to near the bottom, so the ship and
  // its reticle both stay on screen.
  var MIN_Y = H * 0.35;
  var MAX_Y = H - 50;

  function reset() {
    x = W / 2;
    y = H - 90;
    invuln = 0;
    powerInvuln = 0;
    tilt = 0;
    touchTilt = 0;
    touchTiltTimer = 0;
  }

  function clampPos() {
    if (x < 24) x = 24;
    if (x > W - 24) x = W - 24;
    if (y < MIN_Y) y = MIN_Y;
    if (y > MAX_Y) y = MAX_Y;
  }

  // Relative move from the touch UI (drag steering). dx/dy in canvas px.
  function moveBy(dx, dy) {
    x += dx;
    y += dy;
    clampPos();
    touchTilt = Math.max(-0.5, Math.min(0.5, dx * 0.09));
    touchTiltTimer = 0.15;
  }

  function hit() {
    invuln = INVULN;
  }

  // Blink (and stay untouchable) for the duration of a level-up warp.
  function startWarp(duration) {
    invuln = Math.max(invuln, duration);
  }

  // Long-duration invincibility from the help item (seconds).
  function grantInvincible(duration) {
    powerInvuln = duration;
  }

  function isInvulnerable() {
    return invuln > 0 || powerInvuln > 0;
  }

  function update(dt) {
    if (invuln > 0) invuln -= dt;
    if (powerInvuln > 0) powerInvuln -= dt;
    var dx = 0, dy = 0;
    if (WB.Input.isDown('left')) dx -= 1;
    if (WB.Input.isDown('right')) dx += 1;
    if (WB.Input.isDown('up')) dy -= 1;
    if (WB.Input.isDown('down')) dy += 1;

    // bank into horizontal motion, level off when not strafing;
    // recent drag input takes over the bank target
    var targetTilt;
    if (touchTiltTimer > 0) {
      touchTiltTimer -= dt;
      targetTilt = touchTilt;
    } else {
      targetTilt = dx * 0.5;
    }
    tilt += (targetTilt - tilt) * Math.min(1, dt * 8);

    if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
    x += dx * SPEED * dt;
    y += dy * SPEED * dt;
    clampPos();
  }

  function reticlePos() {
    return { x: x, y: y - RETICLE_DIST };
  }

  function drawHull(ctx, time) {
    // engine glow strip (rear)
    var g = 0.55 + Math.sin(time * 26) * 0.25;
    ctx.fillStyle = 'rgba(120,190,255,' + g.toFixed(3) + ')';
    ctx.fillRect(-9, 14, 18, 4);
    ctx.fillStyle = 'rgba(190,225,255,' + (g * 0.6).toFixed(3) + ')';
    ctx.fillRect(-7, 18, 14, 2);

    ctx.strokeStyle = '#6b7480';

    // twin forward mandibles
    ctx.fillStyle = '#c9d1d9';
    ctx.beginPath();
    ctx.moveTo(-11, -8);
    ctx.lineTo(-11, -22);
    ctx.lineTo(-9, -26);
    ctx.lineTo(-4, -26);
    ctx.lineTo(-4, -8);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(11, -8);
    ctx.lineTo(11, -22);
    ctx.lineTo(9, -26);
    ctx.lineTo(4, -26);
    ctx.lineTo(4, -8);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // dark bay between the mandibles
    ctx.fillStyle = '#2a2e33';
    ctx.fillRect(-4, -25, 8, 15);

    // saucer body
    ctx.fillStyle = '#c9d1d9';
    ctx.beginPath();
    ctx.ellipse(0, 3, 15, 13, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // central maintenance trench running back from the bay
    ctx.fillStyle = '#59616b';
    ctx.fillRect(-2.5, -10, 5, 14);
    ctx.strokeStyle = 'rgba(40,45,50,0.6)';
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(0, 4);
    ctx.stroke();

    // hull panel lines
    ctx.strokeStyle = 'rgba(90,100,110,0.75)';
    ctx.beginPath();
    ctx.arc(0, 3, 10, Math.PI * 0.55, Math.PI * 0.95);
    ctx.arc(0, 3, 10, Math.PI * 1.55, Math.PI * 1.95);
    ctx.moveTo(-13, 6); ctx.lineTo(-6, 9);
    ctx.moveTo(13, 6); ctx.lineTo(6, 9);
    ctx.stroke();

    // rear vents
    ctx.fillStyle = '#59616b';
    ctx.fillRect(-8, 10, 4, 3);
    ctx.fillRect(-2, 11, 4, 3);
    ctx.fillRect(4, 10, 4, 3);

    // radar dish (left of the trench)
    ctx.fillStyle = '#aab4bd';
    ctx.beginPath();
    ctx.arc(-7, -1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6b7480';
    ctx.stroke();
    ctx.fillStyle = '#59616b';
    ctx.beginPath();
    ctx.arc(-7, -1, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // offset cockpit tube on the starboard side
    ctx.fillStyle = '#c9d1d9';
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(15, 3);
    ctx.lineTo(16, 7);
    ctx.lineTo(11, 9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6b7480';
    ctx.stroke();
    ctx.fillStyle = '#7fa8c9';
    ctx.beginPath();
    ctx.arc(13.5, 5.5, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,45,50,0.7)';
    ctx.beginPath();
    ctx.moveTo(10.5, 4.5); ctx.lineTo(16.5, 6.5);
    ctx.stroke();
  }

  function draw(ctx, time) {
    // reticle
    var r = reticlePos();
    var pulse = 10 + Math.sin(time * 8) * 2;
    ctx.strokeStyle = '#ff5a5a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r.x - pulse - 5, r.y); ctx.lineTo(r.x - pulse + 3, r.y);
    ctx.moveTo(r.x + pulse - 3, r.y); ctx.lineTo(r.x + pulse + 5, r.y);
    ctx.moveTo(r.x, r.y - pulse - 5); ctx.lineTo(r.x, r.y - pulse + 3);
    ctx.moveTo(r.x, r.y + pulse - 3); ctx.lineTo(r.x, r.y + pulse + 5);
    ctx.stroke();
    ctx.lineWidth = 1;

    // blink while invulnerable (skip drawing on alternating frames)
    if (isInvulnerable() && Math.floor(time * 20) % 2 === 0) return;

    ctx.save();
    ctx.translate(x, y);
    // banking: slight roll + horizontal squash sells the tilt top-down
    ctx.rotate(tilt * 0.35);
    ctx.scale(1 - Math.abs(tilt) * 0.4, 1);
    drawHull(ctx, time);
    ctx.restore();
  }

  return {
    reset: reset,
    update: update,
    draw: draw,
    hit: hit,
    moveBy: moveBy,
    startWarp: startWarp,
    grantInvincible: grantInvincible,
    isInvulnerable: isInvulnerable,
    reticlePos: reticlePos,
    getRadius: function () { return RADIUS; },
    getPos: function () { return { x: x, y: y }; }
  };
})();
