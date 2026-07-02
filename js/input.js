// Keyboard input: held-key state plus one-frame "just pressed" edges.
window.WB = window.WB || {};

WB.Input = (function () {
  var down = {};
  var pressed = {};

  var ALIASES = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    Space: 'bomb', KeyZ: 'bomb',
    Enter: 'start'
  };

  function onKey(e, isDown) {
    var name = ALIASES[e.code];
    if (!name) return;
    e.preventDefault();
    if (isDown && !down[name]) pressed[name] = true;
    down[name] = isDown;
  }

  return {
    init: function () {
      window.addEventListener('keydown', function (e) { onKey(e, true); });
      window.addEventListener('keyup', function (e) { onKey(e, false); });
      window.addEventListener('blur', function () { down = {}; });
    },
    isDown: function (name) { return !!down[name]; },
    wasPressed: function (name) { return !!pressed[name]; },
    // Call once at the end of each frame to consume edge events.
    endFrame: function () { pressed = {}; }
  };
})();
