// Bombs (lobbed at the reticle point) and explosion particles.
window.WB = window.WB || {};

WB.Bombs = (function () {
  var FLIGHT = 0.4;   // seconds from release to impact
  var BLAST_R = 26;
  var COOLDOWN = 0.28;
  var MAX_IN_FLIGHT = 2;

  var bombs = [];      // {sx, sy, tx, ty, t}
  var particles = [];  // {x, y, vx, vy, life, max, color, size}
  var cooldown = 0;

  function reset() {
    bombs = [];
    particles = [];
    cooldown = 0;
  }

  function tryDrop() {
    if (cooldown > 0 || bombs.length >= MAX_IN_FLIGHT) return;
    var p = WB.Player.getPos();
    var r = WB.Player.reticlePos();
    bombs.push({ sx: p.x, sy: p.y - 10, tx: r.x, ty: r.y, t: 0 });
    cooldown = COOLDOWN;
  }

  function explodeAt(x, y) {
    for (var i = 0; i < 26; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 40 + Math.random() * 160;
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0, max: 0.35 + Math.random() * 0.35,
        color: Math.random() < 0.5 ? '#ffb347' : (Math.random() < 0.5 ? '#ff6b35' : '#ffe66d'),
        size: 2 + Math.random() * 4
      });
    }
  }

  // onImpact(x, y, blastRadius) is called for each bomb that lands.
  function update(dt, onImpact) {
    cooldown -= dt;
    var landed = [];
    for (var i = 0; i < bombs.length; i++) {
      var b = bombs[i];
      b.t += dt;
      if (b.t >= FLIGHT) landed.push(b);
    }
    bombs = bombs.filter(function (b) { return b.t < FLIGHT; });
    for (i = 0; i < landed.length; i++) {
      explodeAt(landed[i].tx, landed[i].ty);
      onImpact(landed[i].tx, landed[i].ty, BLAST_R);
    }

    for (i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
    }
    particles = particles.filter(function (p) { return p.life < p.max; });
  }

  function draw(ctx) {
    var i;
    for (i = 0; i < bombs.length; i++) {
      var b = bombs[i];
      var k = b.t / FLIGHT;
      var x = b.sx + (b.tx - b.sx) * k;
      var y = b.sy + (b.ty - b.sy) * k;
      var scale = 1 - k * 0.55; // shrinks as it falls toward the ground

      // ground shadow closing on the impact point
      ctx.fillStyle = 'rgba(0,0,0,' + (0.15 + k * 0.25) + ')';
      ctx.beginPath();
      ctx.ellipse(b.tx, b.ty, 10 * (1 - k) + 4, 5 * (1 - k) + 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2b2b33';
      ctx.beginPath();
      ctx.arc(x, y, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#888';
      ctx.fillRect(x - 1.5 * scale, y - 9 * scale, 3 * scale, 4 * scale);
    }

    for (i = 0; i < particles.length; i++) {
      var p = particles[i];
      var a = 1 - p.life / p.max;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  return { reset: reset, tryDrop: tryDrop, update: update, draw: draw, explodeAt: explodeAt };
})();
