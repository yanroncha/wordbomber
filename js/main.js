// Bootstrap: canvas setup and the main loop.
(function () {
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');

  WB.Input.init();
  WB.Touch.init();
  WB.Game.loadHiscore();
  WB.Background.reset();
  WB.WordGame.newWord(1); // so the HUD has a word even before the first game

  var last = 0;
  var time = 0;

  function frame(ts) {
    var dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0.1) dt = 0.1; // tab-switch guard
    time += dt;

    WB.Game.update(dt);
    WB.Game.draw(ctx, time);
    WB.Input.endFrame();

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(function (ts) {
    last = ts;
    requestAnimationFrame(frame);
  });
})();
