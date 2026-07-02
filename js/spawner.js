// Turret spawner: keeps the letters the player needs flowing in,
// mixed with decoys, so a word can never dead-end.
window.WB = window.WB || {};

WB.Spawner = (function () {
  var W = 480, H = 640;
  var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var turrets = [];
  var timer = 0;
  var sinceNeeded = 0; // spawns since we last guaranteed a needed letter

  function interval(level) {
    return Math.max(0.5, 1.25 - level * 0.06);
  }

  function pickX() {
    for (var tries = 0; tries < 8; tries++) {
      var x = 40 + Math.random() * (W - 80);
      var ok = true;
      for (var i = 0; i < turrets.length; i++) {
        var t = turrets[i];
        if (t.y < 60 && Math.abs(t.x - x) < 60) { ok = false; break; }
      }
      if (ok) return x;
    }
    return 40 + Math.random() * (W - 80);
  }

  function neededOnScreen() {
    var needed = WB.WordGame.neededLetters();
    for (var i = 0; i < turrets.length; i++) {
      var t = turrets[i];
      if (t.alive && t.letter && t.y < H * 0.75 && needed.indexOf(t.letter) >= 0) return true;
    }
    return false;
  }

  function spawnOne() {
    var letter;
    var needed = WB.WordGame.neededLetters();
    var mustSupply = sinceNeeded >= 2 || !neededOnScreen();

    if (mustSupply && needed.length > 0) {
      letter = needed[Math.floor(Math.random() * needed.length)];
      sinceNeeded = 0;
    } else if (Math.random() < 0.15) {
      letter = null; // blank bunker
      sinceNeeded++;
    } else {
      letter = ALPHABET[Math.floor(Math.random() * 26)];
      sinceNeeded++;
    }
    turrets.push(new WB.Turret(pickX(), -30, letter));
  }

  function reset() {
    turrets = [];
    timer = 0.2;
    sinceNeeded = 99; // force a needed letter immediately
  }

  function update(dt, level, scrollSpeed) {
    timer -= dt;
    if (timer <= 0) {
      spawnOne();
      timer = interval(level);
    }
    for (var i = 0; i < turrets.length; i++) turrets[i].update(dt, scrollSpeed);
    turrets = turrets.filter(function (t) { return !t.isGone(H); });
  }

  function draw(ctx) {
    for (var i = 0; i < turrets.length; i++) turrets[i].draw(ctx);
  }

  return {
    reset: reset,
    update: update,
    draw: draw,
    getTurrets: function () { return turrets; }
  };
})();
