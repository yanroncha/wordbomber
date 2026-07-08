// Enemy fire: slow shells lobbed by ground turrets toward the player.
window.WB = window.WB || {};

WB.EnemyFire = (function () {
  var W = 480, H = 640;
  var bullets = []; // {x, y, vx, vy}
  var R = 5;

  var MAX = 5; // global cap so many turrets can't create a bullet storm

  function reset() {
    bullets = [];
  }

  function atCapacity() {
    return bullets.length >= MAX;
  }

  // Wipe every shell currently in flight (used on word completion).
  function clear() {
    bullets = [];
  }

  function bulletSpeed(level) {
    return Math.min(150, 80 + level * 5);
  }

  // Fire from (sx, sy) aimed at the player's current position.
  function spawn(sx, sy, tx, ty, level) {
    var dx = tx - sx, dy = ty - sy;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var sp = bulletSpeed(level);
    bullets.push({ x: sx, y: sy, vx: (dx / d) * sp, vy: (dy / d) * sp });
  }

  // onHit(x, y) is called when a bullet reaches the (vulnerable) player.
  function update(dt, playerPos, playerRadius, invulnerable, onHit) {
    for (var i = 0; i < bullets.length; i++) {
      var b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (!invulnerable) {
        var dx = b.x - playerPos.x, dy = b.y - playerPos.y;
        var rr = R + playerRadius;
        if (dx * dx + dy * dy <= rr * rr) {
          b.dead = true;
          onHit(b.x, b.y);
        }
      }
    }
    bullets = bullets.filter(function (b) {
      return !b.dead && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20;
    });
  }

  function draw(ctx) {
    for (var i = 0; i < bullets.length; i++) {
      var b = bullets[i];
      ctx.fillStyle = '#ff8a3d';
      ctx.beginPath();
      ctx.arc(b.x, b.y, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,230,120,0.9)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, R * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return { reset: reset, spawn: spawn, update: update, draw: draw, atCapacity: atCapacity, clear: clear };
})();
