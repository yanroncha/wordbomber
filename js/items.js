// Help items: metal plates with an icon that fall a bit faster than the
// terrain scroll. Touching one with the ship triggers its effect (handled in
// game.js). Up to MAX on screen at once, spawned on a staggered timer.
window.WB = window.WB || {};

WB.Items = (function () {
  var W = 480, H = 640;
  var MAX = 3;
  var SIZE = 13;         // half-size of the plate (ship is a touch larger)
  var FALL_BONUS = 55;   // px/s added on top of the scroll speed

  // effect ids and their icon glyph drawer
  var TYPES = ['invincible', 'slow', 'wipe', 'letter'];

  var items = [];        // {x, y, type, wobble}
  var timer = 0;

  function reset() {
    items = [];
    timer = 3 + Math.random() * 3; // first item after a few seconds
  }

  function spawnInterval() {
    return 8 + Math.random() * 7; // staggered 8-15s
  }

  function spawn() {
    items.push({
      x: 40 + Math.random() * (W - 80),
      y: -SIZE - 6,
      type: TYPES[Math.floor(Math.random() * TYPES.length)],
      wobble: Math.random() * Math.PI * 2
    });
  }

  // onPickup(type) called when the ship touches an item.
  function update(dt, scrollSpeed, playerPos, playerRadius, onPickup) {
    timer -= dt;
    if (timer <= 0) {
      if (items.length < MAX) spawn();
      timer = spawnInterval();
    }

    var speed = scrollSpeed + FALL_BONUS;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      it.y += speed * dt;
      it.wobble += dt * 3;
      var dx = it.x - playerPos.x, dy = it.y - playerPos.y;
      var rr = SIZE + playerRadius;
      if (dx * dx + dy * dy <= rr * rr) {
        it.dead = true;
        onPickup(it.type);
      }
    }
    items = items.filter(function (it) { return !it.dead && it.y < H + SIZE + 10; });
  }

  // ---- icon drawers (centered at 0,0, roughly SIZE across) ------------

  function iconInvincible(ctx) {
    // thick upward arrow
    ctx.fillStyle = '#7cf27c';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(7, 0);
    ctx.lineTo(3, 0);
    ctx.lineTo(3, 7);
    ctx.lineTo(-3, 7);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fill();
  }

  function iconSlow(ctx) {
    // arrow curving down to the lower-right
    ctx.strokeStyle = '#9fe8ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.quadraticCurveTo(-6, 5, 5, 6);
    ctx.stroke();
    ctx.fillStyle = '#9fe8ff';
    ctx.beginPath(); // arrowhead
    ctx.moveTo(7, 6);
    ctx.lineTo(0, 4);
    ctx.lineTo(3, 9);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 1;
  }

  function iconWipe(ctx) {
    // lightning bolt
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(2, -8);
    ctx.lineTo(-5, 1);
    ctx.lineTo(-1, 1);
    ctx.lineTo(-3, 8);
    ctx.lineTo(5, -2);
    ctx.lineTo(1, -2);
    ctx.closePath();
    ctx.fill();
  }

  function iconLetter(ctx, time) {
    // lit lamp: glowing bulb over a base
    var glow = 0.6 + Math.sin(time * 6) * 0.4;
    ctx.fillStyle = 'rgba(255,240,150,' + (0.35 * glow).toFixed(3) + ')';
    ctx.beginPath();
    ctx.arc(0, -1, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe98a';
    ctx.beginPath();
    ctx.arc(0, -1, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a6a2a';
    ctx.fillRect(-3, 4, 6, 4);
  }

  function drawPlate(ctx, it, time) {
    var s = SIZE;
    ctx.save();
    ctx.translate(it.x, it.y + Math.sin(it.wobble) * 1.5);

    // drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-s + 2, -s + 3, s * 2, s * 2);

    // brushed metal plate with bevel
    var grad = ctx.createLinearGradient(-s, -s, s, s);
    grad.addColorStop(0, '#cfd6dd');
    grad.addColorStop(0.5, '#9aa3ad');
    grad.addColorStop(1, '#6c757e');
    ctx.fillStyle = grad;
    ctx.fillRect(-s, -s, s * 2, s * 2);
    ctx.strokeStyle = '#eef2f6';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-s + 1, -s + 1, s * 2 - 2, s * 2 - 2);
    ctx.strokeStyle = '#4a5158';
    ctx.strokeRect(-s, -s, s * 2, s * 2);
    ctx.lineWidth = 1;
    // corner rivets
    ctx.fillStyle = '#5a636b';
    var r = s - 3;
    [[-r, -r], [r, -r], [-r, r], [r, r]].forEach(function (p) {
      ctx.beginPath(); ctx.arc(p[0], p[1], 1.3, 0, Math.PI * 2); ctx.fill();
    });

    switch (it.type) {
      case 'invincible': iconInvincible(ctx); break;
      case 'slow': iconSlow(ctx); break;
      case 'wipe': iconWipe(ctx); break;
      case 'letter': iconLetter(ctx, time); break;
    }
    ctx.restore();
  }

  function draw(ctx, time) {
    for (var i = 0; i < items.length; i++) drawPlate(ctx, items[i], time);
  }

  return { reset: reset, update: update, draw: draw, clear: function () { items = []; } };
})();
