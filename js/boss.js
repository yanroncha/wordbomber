// Boss battle: a Death-Star-like circular fortress that descends from the top,
// sways, and fires from six lettered surface turrets. Bombing its turrets uses
// the normal word logic; a bombed turret blinks and respawns with a new letter
// a few seconds later. Five completed words defeat the boss.
window.WB = window.WB || {};

WB.Boss = (function () {
  var W = 480, H = 640;
  var R = 150;                 // fortress radius
  var TARGET_CY = 190;         // resting centre once it has descended
  var RING = 84;               // turret distance from centre
  var TURRET_R = 20;
  var WORDS_TO_WIN = 5;
  var RESPAWN_DELAY = 2.6;     // seconds a bombed turret blinks before returning
  var MAX_TURRET_Y = 455;      // must stay above the low-ship reticle (~460)
  var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  var phase = 'done';          // incoming | active | dying | done
  var cx, cy, t0, wordsDone, dieTimer;
  var turrets = [];            // {lx, ly, x, y, r, letter, alive, blinkT, fireTimer}

  function reset() {
    phase = 'done';
    turrets = [];
  }

  function makeTurret(i) {
    var a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return {
      lx: Math.cos(a) * RING,
      ly: Math.sin(a) * RING * 0.86, // slightly flattened ring
      x: 0, y: 0, r: TURRET_R,
      letter: null, alive: true, blinkT: 0,
      fireTimer: 2 + Math.random() * 4
    };
  }

  function start() {
    phase = 'incoming';
    cx = W / 2;
    cy = -R - 20;
    t0 = 0;
    wordsDone = 0;
    dieTimer = 0;
    turrets = [];
    for (var i = 0; i < 6; i++) turrets.push(makeTurret(i));
    // seed letters (single-letter guard: the target word may momentarily be
    // in a completed state when the boss is triggered)
    var need = WB.WordGame.neededLetters().filter(function (c) { return c && c.length === 1; });
    for (i = 0; i < turrets.length; i++) {
      turrets[i].letter = (i === 0 && need.length)
        ? need[0]
        : ALPHABET[Math.floor(Math.random() * 26)];
    }
  }

  // Guarantee at least one live, non-blinking turret shows a needed letter.
  function ensureNeeded() {
    var need = WB.WordGame.neededLetters();
    if (!need.length) return;
    for (var i = 0; i < turrets.length; i++) {
      var t = turrets[i];
      if (t.alive && t.blinkT <= 0 && need.indexOf(t.letter) >= 0) return;
    }
    // none present: convert a live decoy (prefer one not blinking)
    var cand = turrets.filter(function (t) { return t.alive && t.blinkT <= 0; });
    if (!cand.length) cand = turrets.filter(function (t) { return t.alive; });
    if (cand.length) {
      cand[Math.floor(Math.random() * cand.length)].letter =
        need[Math.floor(Math.random() * need.length)];
    }
  }

  function respawnLetter() {
    var need = WB.WordGame.neededLetters();
    // ~40% of respawns supply a needed letter, keeping the fight solvable
    if (need.length && Math.random() < 0.4) {
      return need[Math.floor(Math.random() * need.length)];
    }
    return ALPHABET[Math.floor(Math.random() * 26)];
  }

  // Called by game.js when a bomb destroys a boss turret.
  function onTurretBombed(t) {
    t.alive = false;
    t.blinkT = RESPAWN_DELAY;
  }

  // Called by game.js on each completed word during the boss fight.
  // Returns true when this word wins the battle.
  function notifyWordComplete() {
    wordsDone++;
    if (wordsDone >= WORDS_TO_WIN) {
      phase = 'dying';
      dieTimer = 0;
      return true;
    }
    return false;
  }

  function positionTurrets() {
    for (var i = 0; i < turrets.length; i++) {
      var t = turrets[i];
      t.x = cx + t.lx;
      t.y = cy + t.ly;
    }
  }

  function update(dt, playerPos, time) {
    t0 = (t0 || 0) + dt;

    if (phase === 'incoming') {
      cy += (TARGET_CY - cy) * Math.min(1, dt * 1.4);
      if (Math.abs(cy - TARGET_CY) < 2) { cy = TARGET_CY; phase = 'active'; }
      positionTurrets();
      return;
    }

    if (phase === 'dying') {
      dieTimer += dt;
      // random explosions across the hull
      if (Math.random() < 0.5) {
        WB.Bombs.explodeAt(cx + (Math.random() - 0.5) * R * 1.4,
                           cy + (Math.random() - 0.5) * R * 1.4);
      }
      if (dieTimer > 1.8) phase = 'done';
      return;
    }

    if (phase !== 'active') return;

    // gentle sway, clamped so the lowest turret stays above the reticle line
    var swayX = Math.sin(t0 * 0.6) * 26;
    var swayY = Math.sin(t0 * 0.9 + 1) * 12;
    cx = W / 2 + swayX;
    cy = TARGET_CY + swayY;
    var lowest = cy + RING * 0.86 + TURRET_R;
    if (lowest > MAX_TURRET_Y) cy -= (lowest - MAX_TURRET_Y);
    positionTurrets();

    // blink / respawn bombed turrets
    for (var i = 0; i < turrets.length; i++) {
      var t = turrets[i];
      if (t.blinkT > 0) {
        t.blinkT -= dt;
        if (t.blinkT <= 0) { t.alive = true; t.letter = respawnLetter(); }
      }
    }
    ensureNeeded();

    // fire from live turrets toward the player (respect the global shell cap)
    for (i = 0; i < turrets.length; i++) {
      t = turrets[i];
      if (!t.alive || t.blinkT > 0) continue;
      t.fireTimer -= dt;
      if (t.fireTimer <= 0) {
        if (!WB.EnemyFire.atCapacity()) WB.EnemyFire.spawn(t.x, t.y, playerPos.x, playerPos.y, 8);
        t.fireTimer = 3 + Math.random() * 3;
      }
    }
  }

  // ---- rendering ------------------------------------------------------

  function drawTurret(ctx, t, time) {
    // blinking (bombed, awaiting respawn): flicker an empty scorched socket
    if (t.blinkT > 0) {
      if (Math.floor(time * 12) % 2 === 0) return;
      ctx.fillStyle = '#33261f';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.fillStyle = '#3a3f45';
    ctx.fillRect(t.x - t.r - 2, t.y - t.r - 2, (t.r + 2) * 2, (t.r + 2) * 2);
    ctx.fillStyle = t.letter ? '#7d3030' : '#555c66';
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r - 3, -2.4, -0.6);
    ctx.stroke();
    if (t.letter) {
      ctx.fillStyle = '#ffe9a8';
      ctx.font = 'bold 22px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.letter, t.x, t.y + 1);
    }
  }

  function draw(ctx, time) {
    if (phase === 'done') return;

    var dying = phase === 'dying';
    if (dying && Math.floor(time * 14) % 2 === 0) {
      // whole fortress flashes white as it dies
    }

    // hull
    var grad = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.2, cx, cy, R);
    grad.addColorStop(0, '#9098a0');
    grad.addColorStop(1, '#3a3f45');
    ctx.fillStyle = dying && Math.floor(time * 14) % 2 === 0 ? '#ffffff' : grad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#20242a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.lineWidth = 1;

    // equatorial trench
    ctx.strokeStyle = 'rgba(20,24,30,0.8)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - R + 6, cy - 8);
    ctx.lineTo(cx + R - 6, cy - 8);
    ctx.stroke();
    ctx.lineWidth = 1;

    // superlaser dish (upper-left concavity)
    var dx = cx - R * 0.42, dy = cy - R * 0.42;
    ctx.fillStyle = '#2b2f34';
    ctx.beginPath();
    ctx.arc(dx, dy, R * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#565c63';
    ctx.stroke();
    ctx.fillStyle = '#1c1f23';
    ctx.beginPath();
    ctx.arc(dx, dy, R * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // faint panel lines
    ctx.strokeStyle = 'rgba(30,34,40,0.5)';
    for (var a = 0; a < 6; a++) {
      var ang = a * Math.PI / 3 + 0.3;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * R * 0.35, cy + Math.sin(ang) * R * 0.35);
      ctx.lineTo(cx + Math.cos(ang) * (R - 4), cy + Math.sin(ang) * (R - 4));
      ctx.stroke();
    }

    // surface turrets
    for (var i = 0; i < turrets.length; i++) drawTurret(ctx, turrets[i], time);
  }

  return {
    reset: reset,
    start: start,
    update: update,
    draw: draw,
    onTurretBombed: onTurretBombed,
    notifyWordComplete: notifyWordComplete,
    getTurrets: function () { return turrets; },
    getProgress: function () { return { done: wordsDone, total: WORDS_TO_WIN }; },
    getCenter: function () { return { x: cx, y: cy, r: R }; },
    phase: function () { return phase; }
  };
})();
