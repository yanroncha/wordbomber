// Scrolling terrain built from biome zones (forest / plains / desert / sea),
// each with detailed hand-drawn decor. The biome stays constant while a word
// is in progress; completing a word scrolls in the next (different) biome.
window.WB = window.WB || {};

WB.Background = (function () {
  var W = 480, H = 640;
  var BIOMES = ['forest', 'plains', 'desert', 'sea'];
  var BASE = {
    forest: '#14351a',
    plains: '#4a7033',
    desert: '#d4b36a',
    sea: '#1d4e6e'
  };
  var zones = []; // topmost first: {top, h, biome, decors[]}
  var currentBiome = BIOMES[0];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function pickBiome(exclude) {
    var pool = BIOMES.filter(function (b) { return b !== exclude; });
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function makeRockPoints(r) {
    var pts = [];
    var n = 5 + Math.floor(Math.random() * 3);
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      var rr = r * rand(0.7, 1.2);
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    return pts;
  }

  function makeZone(top, h, biome) {
    var z = { top: top, h: h, biome: biome, decors: [] };
    var area = W * h;
    var n, i;

    if (biome === 'forest') {
      n = Math.floor(area / 5200);
      for (i = 0; i < n; i++) {
        z.decors.push({ type: 'tree', x: rand(8, W - 8), ry: rand(8, h - 8), r: rand(7, 15) });
      }
      n = Math.floor(area / 26000);
      for (i = 0; i < n; i++) {
        z.decors.push({ type: 'bush', x: rand(6, W - 6), ry: rand(6, h - 6), r: rand(4, 7) });
      }
    } else if (biome === 'plains') {
      n = Math.floor(area / 8500);
      for (i = 0; i < n; i++) {
        z.decors.push({ type: 'grass', x: rand(4, W - 4), ry: rand(4, h - 4), s: rand(4, 8) });
      }
      n = Math.floor(area / 34000);
      for (i = 0; i < n; i++) {
        z.decors.push({ type: 'bush', x: rand(6, W - 6), ry: rand(6, h - 6), r: rand(4, 8) });
      }
      if (Math.random() < 0.65 && h > 180) {
        n = 1 + Math.floor(Math.random() * 2);
        for (i = 0; i < n; i++) {
          var fw = rand(90, 160), fh = rand(70, 120);
          z.decors.push({
            type: 'field', x: rand(20, W - 20 - fw),
            ry: rand(20, Math.max(21, h - 20 - fh)), w: fw, fh: fh
          });
        }
      }
      n = Math.floor(area / 60000);
      for (i = 0; i < n; i++) {
        z.decors.push({ type: 'tree', x: rand(10, W - 10), ry: rand(10, h - 10), r: rand(8, 12) });
      }
    } else if (biome === 'desert') {
      for (var ry = rand(20, 50); ry < h - 15; ry += rand(45, 80)) {
        z.decors.push({ type: 'dune', ry: ry, phase: rand(0, 6.28), amp: rand(4, 9) });
      }
      n = Math.floor(area / 27000);
      for (i = 0; i < n; i++) {
        z.decors.push({ type: 'cactus', x: rand(12, W - 12), ry: rand(14, h - 14), s: rand(0.8, 1.4) });
      }
      n = Math.floor(area / 24000);
      for (i = 0; i < n; i++) {
        z.decors.push({ type: 'rock', x: rand(10, W - 10), ry: rand(10, h - 10), pts: makeRockPoints(rand(5, 10)) });
      }
    } else { // sea
      for (var wy = rand(15, 40); wy < h - 10; wy += rand(30, 46)) {
        z.decors.push({ type: 'wave', ry: wy, phase: rand(0, 10) });
      }
      if (Math.random() < 0.35) {
        z.decors.push({ type: 'island', x: rand(50, W - 50), ry: rand(50, Math.max(51, h - 50)), r: rand(18, 34) });
      }
    }

    // painter's order: things lower on screen draw last (on top)
    z.decors.sort(function (a, b) { return (a.ry || 0) - (b.ry || 0); });
    return z;
  }

  function reset() {
    zones = [];
    currentBiome = BIOMES[Math.floor(Math.random() * BIOMES.length)];
    var y = -900;
    while (y < H + 100) {
      var h = rand(380, 720);
      zones.push(makeZone(y, h, currentBiome));
      y += h;
    }
  }

  // Called when a word is completed: the next biome scrolls in from the top.
  function changeBiome() {
    currentBiome = pickBiome(currentBiome);
    var z = zones[0];
    if (z && z.top < -40) {
      // shrink the topmost (old-biome) zone from its top edge so the new
      // biome starts just above the screen instead of much later
      var shift = -40 - z.top;
      z.top = -40;
      z.h -= shift;
      for (var i = 0; i < z.decors.length; i++) z.decors[i].ry -= shift;
      z.decors = z.decors.filter(function (d) { return (d.ry || 0) >= 0; });
    }
  }

  function update(dt, speed) {
    var dy = speed * dt;
    for (var i = 0; i < zones.length; i++) zones[i].top += dy;
    zones = zones.filter(function (z) { return z.top < H + 10; });
    while (zones.length === 0 || zones[0].top > -80) {
      var h = rand(380, 720);
      var newTop = zones.length ? zones[0].top - h : -80 - h;
      zones.unshift(makeZone(newTop, h, currentBiome));
    }
  }

  // ---- decor painters -------------------------------------------------

  function circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTree(ctx, x, y, r) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    circle(ctx, x + 3, y + 3, r);
    ctx.fillStyle = '#0d3d18';
    circle(ctx, x, y, r);
    ctx.fillStyle = '#1b632c';
    circle(ctx, x - r * 0.18, y - r * 0.22, r * 0.72);
    ctx.fillStyle = '#2e8a3e';
    circle(ctx, x - r * 0.32, y - r * 0.38, r * 0.4);
  }

  function drawBush(ctx, x, y, r) {
    ctx.fillStyle = '#245c25';
    circle(ctx, x, y, r);
    circle(ctx, x - r * 0.7, y + r * 0.2, r * 0.7);
    circle(ctx, x + r * 0.7, y + r * 0.2, r * 0.7);
    ctx.fillStyle = '#3b7d36';
    circle(ctx, x - r * 0.2, y - r * 0.25, r * 0.55);
  }

  function drawGrass(ctx, x, y, s) {
    ctx.strokeStyle = '#6f9c4a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x - s * 0.5, y - s);
    ctx.moveTo(x, y); ctx.lineTo(x, y - s * 1.2);
    ctx.moveTo(x, y); ctx.lineTo(x + s * 0.5, y - s);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  function drawField(ctx, x, y, w, h) {
    ctx.fillStyle = '#7a5c33';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    for (var ry = y + 6; ry < y + h - 3; ry += 8) {
      ctx.moveTo(x + 3, ry);
      ctx.lineTo(x + w - 3, ry);
    }
    ctx.stroke();
    ctx.strokeStyle = '#5c4526';
    ctx.strokeRect(x, y, w, h);
  }

  function drawDune(ctx, y, phase, amp) {
    ctx.strokeStyle = 'rgba(255,248,215,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var px = 0; px <= W; px += 14) {
      var py = y + Math.sin(px * 0.03 + phase) * amp;
      if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // shaded side of the dune
    ctx.strokeStyle = 'rgba(140,110,55,0.35)';
    ctx.beginPath();
    for (px = 0; px <= W; px += 14) {
      py = y + 3 + Math.sin(px * 0.03 + phase) * amp;
      if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  function drawCactus(ctx, x, y, s) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x + 3, y + 8 * s, 7 * s, 3 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#39702f';
    // trunk
    ctx.fillRect(x - 2 * s, y - 9 * s, 4 * s, 18 * s);
    // arms
    ctx.fillRect(x - 8 * s, y - 3 * s, 6 * s, 3 * s);
    ctx.fillRect(x - 8 * s, y - 8 * s, 3 * s, 8 * s);
    ctx.fillRect(x + 2 * s, y + 1 * s, 6 * s, 3 * s);
    ctx.fillRect(x + 5 * s, y - 5 * s, 3 * s, 9 * s);
    ctx.fillStyle = '#4f8a3e';
    ctx.fillRect(x - 0.8 * s, y - 9 * s, 1.6 * s, 18 * s);
  }

  function drawRock(ctx, x, y, pts) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var px = x + pts[i][0] + 2, py = y + pts[i][1] + 2;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8d8577';
    ctx.beginPath();
    for (i = 0; i < pts.length; i++) {
      px = x + pts[i][0]; py = y + pts[i][1];
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.stroke();
  }

  function drawWave(ctx, y, phase, time) {
    ctx.strokeStyle = 'rgba(190,230,255,0.4)';
    ctx.lineWidth = 2;
    var off = ((time * 22 + phase * 40) % 120);
    ctx.beginPath();
    for (var px = -120 + off; px < W + 40; px += 120) {
      ctx.moveTo(px, y);
      ctx.quadraticCurveTo(px + 20, y - 6, px + 40, y);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  function drawIsland(ctx, x, y, r) {
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = '#d9c07a';
    circle(ctx, x, y, r);
    ctx.fillStyle = '#3f7a34';
    circle(ctx, x, y, r * 0.55);
    drawTree(ctx, x - r * 0.15, y - r * 0.1, r * 0.3);
  }

  // ---------------------------------------------------------------------

  function drawZone(ctx, z, time) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, z.top - 1, W, z.h + 2);
    ctx.clip();
    ctx.fillStyle = BASE[z.biome];
    ctx.fillRect(0, z.top - 1, W, z.h + 2);

    for (var i = 0; i < z.decors.length; i++) {
      var d = z.decors[i];
      var y = z.top + d.ry;
      if (y < -40 || y > H + 40) continue;
      switch (d.type) {
        case 'tree': drawTree(ctx, d.x, y, d.r); break;
        case 'bush': drawBush(ctx, d.x, y, d.r); break;
        case 'grass': drawGrass(ctx, d.x, y, d.s); break;
        case 'field': drawField(ctx, d.x, y, d.w, d.fh); break;
        case 'dune': drawDune(ctx, y, d.phase, d.amp); break;
        case 'cactus': drawCactus(ctx, d.x, y, d.s); break;
        case 'rock': drawRock(ctx, d.x, y, d.pts); break;
        case 'wave': drawWave(ctx, y, d.phase, time); break;
        case 'island': drawIsland(ctx, d.x, y, d.r); break;
      }
    }
    ctx.restore();
  }

  function draw(ctx, time) {
    time = time || 0;
    var i;
    for (i = 0; i < zones.length; i++) drawZone(ctx, zones[i], time);

    // soft blend at each biome boundary
    for (i = 1; i < zones.length; i++) {
      var by = zones[i].top;
      if (by < -20 || by > H + 20) continue;
      var grad = ctx.createLinearGradient(0, by - 14, 0, by + 14);
      grad.addColorStop(0, BASE[zones[i - 1].biome]);
      grad.addColorStop(1, BASE[zones[i].biome]);
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = grad;
      ctx.fillRect(0, by - 14, W, 28);
      ctx.globalAlpha = 1;
    }
  }

  return { reset: reset, update: update, draw: draw, changeBiome: changeBiome };
})();
