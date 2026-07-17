// Touch UI: drag-relative ship steering plus on-screen bomb / pause / mute
// controls. Appears on the first touch (or on coarse-pointer devices from the
// start) and hides again as soon as a keyboard key is pressed, so PC and
// smartphone switch dynamically with no explicit setting.
window.WB = window.WB || {};

WB.Touch = (function () {
  var W = 480, H = 640;
  var active = false;
  var canvas = null;
  var MOVE_GAIN = 1.45; // finger delta -> ship delta

  // on-canvas controls (canvas coordinates)
  var BOMB = { x: 422, y: 578, r: 44 };
  var PAUSE = { x: W - 26, y: 104, r: 20 };
  var MUTE = { x: W - 26, y: 150, r: 20 };
  // pause-screen tap buttons
  var RESUME_RECT = { x: W / 2 - 100, y: 385, w: 200, h: 50 };
  var RESTART_RECT = { x: W / 2 - 100, y: 455, w: 200, h: 50 };

  var touches = {}; // id -> {kind: move|bomb|tapbomb|ui, x, y}
  var bombHeld = false;
  var bombHold = 0;

  function toCanvas(t) {
    var r = canvas.getBoundingClientRect();
    var sw = r.width > 0 ? W / r.width : 1;   // guard: hidden/zero-size layout
    var sh = r.height > 0 ? H / r.height : 1;
    return {
      x: (t.clientX - r.left) * sw,
      y: (t.clientY - r.top) * sh
    };
  }

  function inCircle(p, c) {
    var dx = p.x - c.x, dy = p.y - c.y;
    return dx * dx + dy * dy <= c.r * c.r;
  }

  function inRect(p, rc) {
    return p.x >= rc.x && p.x <= rc.x + rc.w && p.y >= rc.y && p.y <= rc.y + rc.h;
  }

  function gameState() {
    return WB.Game.getState ? WB.Game.getState() : 'title';
  }

  function hasMoveTouch() {
    for (var id in touches) if (touches[id].kind === 'move') return true;
    return false;
  }

  function onStart(e) {
    e.preventDefault();
    active = true;
    WB.Audio.start(); // a touch is also a valid autoplay-unlock gesture
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      var p = toCanvas(t);
      var st = gameState();
      var kind = 'move';
      if (st === 'paused') {
        if (inRect(p, RESTART_RECT)) WB.Input.press('restart');
        else WB.Input.press('pause'); // tap anywhere else = resume
        kind = 'ui';
      } else if (inCircle(p, PAUSE)) {
        WB.Input.press('pause');
        kind = 'ui';
      } else if (inCircle(p, MUTE)) {
        WB.Input.press('mute');
        kind = 'ui';
      } else if (inCircle(p, BOMB)) {
        WB.Input.press('bomb');
        bombHeld = true;
        bombHold = 0;
        kind = 'bomb';
      } else if (hasMoveTouch()) {
        WB.Input.press('bomb'); // second finger anywhere = bomb
        kind = 'tapbomb';
      } else {
        WB.Input.press('start'); // starts / retries on title & gameover
      }
      touches[t.identifier] = { kind: kind, x: p.x, y: p.y };
    }
  }

  function onMove(e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      var tr = touches[t.identifier];
      if (!tr) continue;
      var p = toCanvas(t);
      if (tr.kind === 'move' && gameState() === 'playing') {
        WB.Player.moveBy((p.x - tr.x) * MOVE_GAIN, (p.y - tr.y) * MOVE_GAIN);
      }
      tr.x = p.x;
      tr.y = p.y;
    }
  }

  function onEnd(e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      var tr = touches[t.identifier];
      if (tr && tr.kind === 'bomb') bombHeld = false;
      delete touches[t.identifier];
    }
  }

  function init() {
    canvas = document.getElementById('game');
    // coarse pointer (phone/tablet) -> show the touch UI from the start
    if (window.matchMedia && matchMedia('(pointer: coarse)').matches) active = true;
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onEnd, { passive: false });
    canvas.addEventListener('touchcancel', onEnd, { passive: false });
    // keyboard use hides the touch UI again (dynamic PC/mobile switching)
    window.addEventListener('keydown', function () { active = false; });
  }

  function update(dt) {
    if (bombHeld) {
      bombHold += dt;
      if (bombHold >= 0.3) { // hold the button for autofire
        bombHold = 0;
        WB.Input.press('bomb');
      }
    }
  }

  // ---- rendering ------------------------------------------------------

  function drawRoundButton(ctx, rc, label) {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.fillRect(rc.x, rc.y, rc.w, rc.h);
    ctx.strokeRect(rc.x, rc.y, rc.w, rc.h);
    ctx.lineWidth = 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, rc.x + rc.w / 2, rc.y + rc.h / 2 + 1);
  }

  function draw(ctx) {
    if (!active) return;
    var st = gameState();

    if (st === 'paused') {
      drawRoundButton(ctx, RESUME_RECT, 'タップで再開');
      drawRoundButton(ctx, RESTART_RECT, 'リスタート');
      return;
    }

    // bomb button
    ctx.fillStyle = 'rgba(255,90,90,0.25)';
    ctx.strokeStyle = 'rgba(255,120,120,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(BOMB.x, BOMB.y, BOMB.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.font = '34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', BOMB.x, BOMB.y + 2);

    // pause icon (two bars)
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(PAUSE.x, PAUSE.y, PAUSE.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(PAUSE.x - 7, PAUSE.y - 8, 5, 16);
    ctx.fillRect(PAUSE.x + 2, PAUSE.y - 8, 5, 16);

    // mute icon
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(MUTE.x, MUTE.y, MUTE.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '18px sans-serif';
    ctx.fillText(WB.Audio.isEnabled() ? '🔊' : '🔇', MUTE.x, MUTE.y + 1);
  }

  return {
    init: init,
    update: update,
    draw: draw,
    isActive: function () { return active; }
  };
})();
