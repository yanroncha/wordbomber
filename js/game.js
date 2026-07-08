// Game state machine and scoring rules.
window.WB = window.WB || {};

WB.Game = (function () {
  var W = 480, H = 640;
  var WORDS_PER_LEVEL = 3;
  var START_LIVES = 5;
  var HISCORE_KEY = 'wordbomber.hiscore';

  var state = 'title'; // title | playing | paused | gameover
  var score = 0, hiscore = 0, lives = START_LIVES, level = 1;
  var wordsCompleted = 0;
  var combo = 0; // consecutive words completed without a miss
  var stateTimer = 0;

  function loadHiscore() {
    try { hiscore = parseInt(localStorage.getItem(HISCORE_KEY), 10) || 0; }
    catch (e) { hiscore = 0; }
  }

  function saveHiscore() {
    try { localStorage.setItem(HISCORE_KEY, String(hiscore)); } catch (e) {}
  }

  function comboMult() {
    return Math.min(3, 1 + 0.5 * combo);
  }

  function scrollSpeed() {
    return Math.min(150, 55 + level * 8);
  }

  function fireCooldown() {
    // "Slow" turret fire; a little quicker at higher levels.
    return Math.max(2.6, 4.6 - level * 0.15) + Math.random() * 3;
  }

  function endGame() {
    state = 'gameover';
    stateTimer = 0;
    if (score > hiscore) { hiscore = score; saveHiscore(); }
  }

  function startGame() {
    state = 'playing';
    score = 0; lives = START_LIVES; level = 1;
    wordsCompleted = 0; combo = 0;
    WB.Background.reset();
    WB.Player.reset();
    WB.Bombs.reset();
    WB.EnemyFire.reset();
    WB.WordGame.newWord(level);
    WB.Spawner.reset();
    WB.Hud.reset();
  }

  function onLetterBombed(letter) {
    var res = WB.WordGame.bomb(letter);
    if (!res.correct) {
      lives--;
      combo = 0;
      WB.WordGame.resetProgress();
      WB.Hud.flash('MISS!', '#ff5a5a');
      if (lives <= 0) endGame();
      return;
    }

    var pts = 100 * level * (res.wasMasked ? 2 : 1);
    score += pts;
    WB.Hud.flash('+' + pts, res.wasMasked ? '#ffd166' : '#9fe8ff');

    if (res.complete) {
      var bonus = Math.floor(500 * res.word.length * level * comboMult());
      score += bonus;
      combo++;
      wordsCompleted++;
      // Completion celebration: translation banner + a few bursts.
      WB.Hud.wordComplete(res.word, WB.translate(res.word));
      WB.EnemyFire.clear(); // clear every shell in flight on completion
      WB.Background.changeBiome(); // next terrain scrolls in with the next word
      WB.Bombs.explodeAt(W / 2, 250);
      WB.Bombs.explodeAt(W / 2 - 90, 250);
      WB.Bombs.explodeAt(W / 2 + 90, 250);
      WB.Hud.flash('+' + bonus, '#7cf27c');
      var newLevel = 1 + Math.floor(wordsCompleted / WORDS_PER_LEVEL);
      if (newLevel > level) {
        level = newLevel;
        WB.Hud.flash('LEVEL ' + level + '!', '#ff9de2');
      }
      WB.WordGame.newWord(level);
    }
  }

  function onImpact(x, y, blastR) {
    var turrets = WB.Spawner.getTurrets();
    for (var i = 0; i < turrets.length; i++) {
      var t = turrets[i];
      if (!t.hitBy(x, y, blastR)) continue;
      t.alive = false;
      WB.Audio.sfxDestroy(); // turret destroyed
      if (t.letter) {
        onLetterBombed(t.letter);
        if (state !== 'playing') return;
      } else {
        score += 50 * level;
        WB.Hud.flash('+' + (50 * level), '#c0c8d0');
      }
    }
  }

  function onPlayerHit(hx, hy) {
    if (WB.Player.isInvulnerable()) return;
    lives--;
    WB.Audio.sfxHit(); // shell hit the ship
    WB.Player.hit();
    WB.Bombs.explodeAt(hx, hy);
    var p = WB.Player.getPos();
    WB.Bombs.explodeAt(p.x, p.y);
    WB.Hud.flash('-1 SHIP', '#ff5a5a');
    if (lives <= 0) endGame();
  }

  function fireTurrets(dt) {
    var turrets = WB.Spawner.getTurrets();
    var pp = WB.Player.getPos();
    for (var i = 0; i < turrets.length; i++) {
      var t = turrets[i];
      if (!t.alive || t.y < 88 || t.y > H - 20) continue;
      t.fireTimer -= dt;
      if (t.fireTimer <= 0) {
        if (!WB.EnemyFire.atCapacity()) WB.EnemyFire.spawn(t.x, t.y, pp.x, pp.y, level);
        t.fireTimer = fireCooldown();
      }
    }
  }

  function update(dt) {
    stateTimer += dt;
    WB.Audio.update(dt); // looping BGM (silent until first key gesture)
    if (state === 'title') {
      WB.Background.update(dt, 40);
      if (WB.Input.wasPressed('bomb') || WB.Input.wasPressed('start')) startGame();
      return;
    }
    if (state === 'paused') {
      if (WB.Input.wasPressed('pause')) state = 'playing';
      else if (WB.Input.wasPressed('restart')) startGame();
      return;
    }
    if (state === 'gameover') {
      WB.Hud.update(dt);
      WB.Bombs.update(dt, function () {});
      if (stateTimer > 0.8 && (WB.Input.wasPressed('bomb') || WB.Input.wasPressed('start'))) {
        startGame();
      }
      return;
    }

    // playing
    if (WB.Input.wasPressed('pause')) { state = 'paused'; stateTimer = 0; return; }
    WB.Background.update(dt, scrollSpeed());
    WB.Player.update(dt);
    if (WB.Input.wasPressed('bomb')) WB.Bombs.tryDrop();
    WB.Spawner.update(dt, level, scrollSpeed());
    fireTurrets(dt);
    WB.Bombs.update(dt, onImpact);
    WB.EnemyFire.update(dt, WB.Player.getPos(), WB.Player.getRadius(),
      WB.Player.isInvulnerable(), onPlayerHit);
    WB.Hud.update(dt);
  }

  function drawCenterText(ctx, lines) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      ctx.font = ln.font;
      ctx.fillStyle = ln.color;
      ctx.fillText(ln.text, W / 2, ln.y);
    }
  }

  function draw(ctx, time) {
    // Pause screen: hide the field entirely to prevent studying the letters.
    if (state === 'paused') {
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(0, 0, W, H);
      drawCenterText(ctx, [
        { text: 'PAUSED', font: 'bold 46px Consolas, monospace', color: '#9fe8ff', y: 240 },
        { text: 'カンニング防止のため画面を隠しています', font: '15px sans-serif', color: '#c0c8d0', y: 300 },
        { text: 'SCORE ' + score + '   LV ' + level, font: '18px Consolas, monospace', color: '#ffd166', y: 344 },
        { text: 'P / ESC : 再開', font: 'bold 18px sans-serif', color: '#fff', y: 410 },
        { text: 'R : リスタート', font: 'bold 18px sans-serif', color: '#fff', y: 442 }
      ]);
      return;
    }

    WB.Background.draw(ctx, time);

    if (state === 'title') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      drawCenterText(ctx, [
        { text: 'WORD BOMBER', font: 'bold 46px Consolas, monospace', color: '#ffd166', y: 150 },
        { text: '- 英単語爆撃作戦 -', font: '18px sans-serif', color: '#9fe8ff', y: 192 },
        { text: 'お題の英単語の順番どおりに', font: '16px sans-serif', color: '#e8ecf0', y: 258 },
        { text: '文字砲台を爆撃せよ!', font: '16px sans-serif', color: '#e8ecf0', y: 282 },
        { text: '順番を間違えるとミス。虫食い(?)は推理しよう', font: '14px sans-serif', color: '#c0c8d0', y: 314 },
        { text: '砲台の反撃に当たると機体を1機失う(初期5機)', font: '14px sans-serif', color: '#ffb3b3', y: 340 },
        { text: '移動: ←→↑↓ / WASD    爆撃: SPACE / Z', font: '15px sans-serif', color: '#9fe8ff', y: 398 },
        { text: 'ポーズ: P / ESC', font: '15px sans-serif', color: '#9fe8ff', y: 424 },
        { text: (Math.floor(time * 2) % 2 === 0) ? 'PRESS SPACE' : '', font: 'bold 24px Consolas, monospace', color: '#fff', y: 486 },
        { text: 'HI-SCORE ' + hiscore, font: '16px Consolas, monospace', color: '#ffd166', y: 548 }
      ]);
      return;
    }

    WB.Spawner.draw(ctx);
    WB.EnemyFire.draw(ctx);
    WB.Bombs.draw(ctx);
    WB.Player.draw(ctx, time);
    WB.Hud.draw(ctx, {
      score: score, hiscore: hiscore, lives: lives, level: level,
      combo: combo, comboMult: comboMult
    });

    if (state === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, W, H);
      drawCenterText(ctx, [
        { text: 'GAME OVER', font: 'bold 44px Consolas, monospace', color: '#ff5a5a', y: 240 },
        { text: 'SCORE ' + score, font: 'bold 24px Consolas, monospace', color: '#9fe8ff', y: 320 },
        { text: 'HI-SCORE ' + hiscore, font: '18px Consolas, monospace', color: '#ffd166', y: 358 },
        { text: 'PRESS SPACE TO RETRY', font: 'bold 18px Consolas, monospace', color: '#fff', y: 440 }
      ]);
    }
  }

  return { update: update, draw: draw, loadHiscore: loadHiscore };
})();
