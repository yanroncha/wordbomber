// Scrolling ground: procedurally placed forests, rivers and base plates.
window.WB = window.WB || {};

WB.Background = (function () {
  var W = 480, H = 640;
  var decors = [];   // {x, y, type, size}
  var rivers = [];   // {y, h, x, w}  horizontal water bands
  var nextDecorY;    // world-relative spawn cursor (in screen coords, above top)
  var nextRiverY;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function spawnDecorRow(y) {
    var n = 2 + Math.floor(Math.random() * 4);
    for (var i = 0; i < n; i++) {
      decors.push({
        x: rand(10, W - 10),
        y: y + rand(-20, 20),
        type: Math.random() < 0.7 ? 'tree' : 'plate',
        size: rand(8, 18)
      });
    }
  }

  function spawnRiver(y) {
    rivers.push({ y: y, h: rand(26, 44), x: rand(-40, 40), w: W + 80 });
  }

  function reset() {
    decors = [];
    rivers = [];
    for (var y = H; y > -80; y -= 60) spawnDecorRow(y);
    spawnRiver(rand(-200, 100));
    nextDecorY = -80;
    nextRiverY = -rand(300, 700);
  }

  function update(dt, speed) {
    var dy = speed * dt;
    var i;
    for (i = 0; i < decors.length; i++) decors[i].y += dy;
    for (i = 0; i < rivers.length; i++) rivers[i].y += dy;
    decors = decors.filter(function (d) { return d.y < H + 40; });
    rivers = rivers.filter(function (r) { return r.y < H + 80; });

    nextDecorY += dy;
    while (nextDecorY > -20) {
      spawnDecorRow(nextDecorY - 60);
      nextDecorY -= 60;
    }
    nextRiverY += dy;
    if (nextRiverY > -60) {
      spawnRiver(nextRiverY - 60);
      nextRiverY = -rand(500, 1100);
    }
  }

  function draw(ctx) {
    ctx.fillStyle = '#123016';
    ctx.fillRect(0, 0, W, H);

    var i, r, d;
    for (i = 0; i < rivers.length; i++) {
      r = rivers[i];
      ctx.fillStyle = '#1b4965';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(120,200,255,0.25)';
      ctx.fillRect(r.x, r.y + 4, r.w, 3);
      ctx.fillRect(r.x, r.y + r.h - 8, r.w, 3);
    }

    for (i = 0; i < decors.length; i++) {
      d = decors[i];
      if (d.type === 'tree') {
        ctx.fillStyle = '#0c4a1e';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a6b2f';
        ctx.beginPath();
        ctx.arc(d.x - d.size * 0.25, d.y - d.size * 0.25, d.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#3a4a42';
        ctx.fillRect(d.x - d.size, d.y - d.size, d.size * 2, d.size * 2);
        ctx.strokeStyle = '#5a6a5f';
        ctx.strokeRect(d.x - d.size, d.y - d.size, d.size * 2, d.size * 2);
      }
    }
  }

  return { reset: reset, update: update, draw: draw };
})();
