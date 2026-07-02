// HUD: score, lives, level, combo, the target word (with mushikui blanks)
// and floating notice messages.
window.WB = window.WB || {};

WB.Hud = (function () {
  var W = 480;
  var messages = []; // {text, color, life, max, y}

  function reset() {
    messages = [];
  }

  function flash(text, color) {
    messages.push({ text: text, color: color || '#fff', life: 0, max: 1.4, y: 300 });
  }

  function update(dt) {
    for (var i = 0; i < messages.length; i++) {
      messages[i].life += dt;
      messages[i].y -= dt * 30;
    }
    messages = messages.filter(function (m) { return m.life < m.max; });
  }

  function draw(ctx, g) {
    // top bar
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, W, 78);

    ctx.textBaseline = 'middle';
    ctx.font = 'bold 15px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9fe8ff';
    ctx.fillText('SCORE ' + g.score, 10, 16);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd166';
    ctx.fillText('HI ' + g.hiscore, W - 10, 16);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#c0c8d0';
    ctx.fillText('LV ' + g.level, 10, 66);
    if (g.combo > 1) {
      ctx.fillStyle = '#ff9de2';
      ctx.fillText('COMBO x' + g.comboMult().toFixed(1), 70, 66);
    }
    // lives as small ships
    ctx.textAlign = 'right';
    for (var l = 0; l < g.lives; l++) {
      var lx = W - 14 - l * 20, ly = 66;
      ctx.fillStyle = '#d8dee6';
      ctx.beginPath();
      ctx.moveTo(lx, ly - 7);
      ctx.lineTo(lx + 6, ly + 6);
      ctx.lineTo(lx, ly + 2);
      ctx.lineTo(lx - 6, ly + 6);
      ctx.closePath();
      ctx.fill();
    }

    // target word boxes
    var disp = WB.WordGame.getDisplay();
    var n = disp.length;
    var bw = Math.min(34, (W - 40) / n - 6);
    var totalW = n * (bw + 6) - 6;
    var x0 = (W - totalW) / 2;
    var y0 = 28;
    ctx.font = 'bold ' + Math.floor(bw * 0.7) + 'px Consolas, monospace';
    ctx.textAlign = 'center';
    for (var i = 0; i < n; i++) {
      var d = disp[i];
      var bx = x0 + i * (bw + 6);
      if (d.done) {
        ctx.fillStyle = 'rgba(70,180,90,0.9)';
      } else if (d.current) {
        ctx.fillStyle = 'rgba(255,209,102,0.9)';
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
      }
      ctx.fillRect(bx, y0, bw, bw * 0.95);
      if (d.current) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, y0, bw, bw * 0.95);
        ctx.lineWidth = 1;
      }
      ctx.fillStyle = d.done ? '#fff' : (d.current ? '#20232a' : '#e8ecf0');
      var ch = d.char;
      if (d.hidden && !d.done) ch = '?';
      ctx.fillText(ch, bx + bw / 2, y0 + bw * 0.5);
    }

    // floating messages
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px Consolas, monospace';
    for (i = 0; i < messages.length; i++) {
      var m = messages[i];
      ctx.globalAlpha = Math.max(0, 1 - m.life / m.max);
      ctx.fillStyle = m.color;
      ctx.fillText(m.text, W / 2, m.y);
    }
    ctx.globalAlpha = 1;
  }

  return { reset: reset, flash: flash, update: update, draw: draw };
})();
