// Tiny WebAudio synth: a looping two-note "piro-piro" BGM plus one-shot
// sound effects (turret destroyed, shell hitting the ship). No assets.
window.WB = window.WB || {};

WB.Audio = (function () {
  var ctx = null;
  var master = null;
  var musicGain = null;
  var enabled = true;
  var started = false;

  // BGM sequencer state
  var bgmTimer = 0;    // seconds until next note
  var bgmStep = 0;
  // A monotonous loop: high piro-piro, then low piro-piro.
  var MELODY = [
    880, 1174, 880, 1174,   // ピロピロ (high)
    440, 587, 440, 587      // ピロピロ (low)
  ];
  var NOTE_LEN = 0.16; // seconds per step

  function ensure() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { enabled = false; return false; }
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.16;
      musicGain.connect(master);
    } catch (e) { enabled = false; return false; }
    return true;
  }

  // Must be called from a user gesture (key press) to satisfy autoplay policy.
  function start() {
    if (!enabled || started) return;
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    started = true;
  }

  function blip(freq, dur, type, gain, dest) {
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    var t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(dest || master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur, gain, filterFreq) {
    if (!ctx) return;
    var n = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = filterFreq || 1200;
    var g = ctx.createGain();
    g.gain.value = gain;
    src.connect(lp); lp.connect(g); g.connect(master);
    src.start();
  }

  // ---- one-shot SFX ---------------------------------------------------

  function sfxDestroy() {
    if (!started) return;
    // short descending zap + a noise burst = turret blowing up
    blip(320, 0.14, 'square', 0.35);
    blip(160, 0.2, 'sawtooth', 0.3);
    noise(0.22, 0.35, 900);
  }

  function sfxHit() {
    if (!started) return;
    // dull thud: the ship taking a shell
    blip(140, 0.16, 'triangle', 0.4);
    noise(0.14, 0.4, 500);
  }

  function sfxFanfare() {
    if (!started || !ctx) return;
    // short rising fanfare on word completion: C-E-G-C arpeggio
    var notes = [523, 659, 784, 1046];
    var step = 0.09;
    for (var i = 0; i < notes.length; i++) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = notes[i];
      var t = ctx.currentTime + i * step;
      var dur = (i === notes.length - 1) ? 0.32 : 0.12;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }
  }

  // ---- looping BGM ----------------------------------------------------

  function update(dt) {
    if (!started || !enabled) return;
    bgmTimer -= dt;
    while (bgmTimer <= 0) {
      var f = MELODY[bgmStep % MELODY.length];
      blip(f, NOTE_LEN * 0.9, 'square', 0.5, musicGain);
      bgmStep++;
      bgmTimer += NOTE_LEN;
    }
  }

  function setEnabled(v) {
    enabled = v;
    if (master) master.gain.value = v ? 0.5 : 0;
  }

  function toggleMute() {
    setEnabled(!enabled);
    return !enabled; // true when now muted
  }

  return {
    start: start,
    update: update,
    sfxDestroy: sfxDestroy,
    sfxHit: sfxHit,
    sfxFanfare: sfxFanfare,
    setEnabled: setEnabled,
    toggleMute: toggleMute,
    isEnabled: function () { return enabled; }
  };
})();
