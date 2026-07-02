// Player ship: 4-way movement clamped on screen, with a bombing reticle ahead.
window.WB = window.WB || {};

WB.Player = (function () {
  var W = 480, H = 640;
  var SPEED = 260;
  var RETICLE_DIST = 130;
  var x, y;

  // Vertical range: mid-screen down to near the bottom, so the ship and
  // its reticle both stay on screen.
  var MIN_Y = H * 0.35;
  var MAX_Y = H - 50;

  function reset() {
    x = W / 2;
    y = H - 90;
  }

  function update(dt) {
    var dx = 0, dy = 0;
    if (WB.Input.isDown('left')) dx -= 1;
    if (WB.Input.isDown('right')) dx += 1;
    if (WB.Input.isDown('up')) dy -= 1;
    if (WB.Input.isDown('down')) dy += 1;
    if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
    x += dx * SPEED * dt;
    y += dy * SPEED * dt;
    if (x < 24) x = 24;
    if (x > W - 24) x = W - 24;
    if (y < MIN_Y) y = MIN_Y;
    if (y > MAX_Y) y = MAX_Y;
  }

  function reticlePos() {
    return { x: x, y: y - RETICLE_DIST };
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

    // ship body
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#d8dee6';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(7, 2);
    ctx.lineTo(16, 12);
    ctx.lineTo(6, 10);
    ctx.lineTo(0, 16);
    ctx.lineTo(-6, 10);
    ctx.lineTo(-16, 12);
    ctx.lineTo(-7, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4a90d9';
    ctx.beginPath();
    ctx.arc(0, -4, 4.5, 0, Math.PI * 2);
    ctx.fill();
    // engine flame
    ctx.fillStyle = 'rgba(255,180,60,' + (0.6 + Math.sin(time * 30) * 0.3) + ')';
    ctx.beginPath();
    ctx.moveTo(-3, 16);
    ctx.lineTo(0, 24 + Math.sin(time * 25) * 3);
    ctx.lineTo(3, 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  return {
    reset: reset,
    update: update,
    draw: draw,
    reticlePos: reticlePos,
    getPos: function () { return { x: x, y: y }; }
  };
})();
