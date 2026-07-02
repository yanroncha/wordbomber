// Target-word logic: word selection, mask (mushikui) generation, and
// candidate-set judging so any dictionary-consistent letter counts as correct.
window.WB = window.WB || {};

WB.WordGame = (function () {
  var answer = '';
  var len = 0;
  var masked = [];     // boolean per position (still hidden from the player?)
  var known = [];      // char or null per position (what the HUD shows)
  var progress = 0;    // letters confirmed this attempt
  var confirmed = [];  // chars bombed so far this attempt
  var candidates = []; // dictionary words consistent with known[] + confirmed[]

  function wordLenForLevel(level) {
    return Math.min(7, 3 + Math.floor((level - 1) / 2));
  }

  function maskCountForLevel(level, wordLen) {
    return Math.min(wordLen - 2, Math.floor((level - 1) / 2));
  }

  function rebuildCandidates() {
    var pool = WB.WORDS[len];
    candidates = pool.filter(function (w) {
      for (var i = 0; i < len; i++) {
        if (i < progress) {
          if (w[i] !== confirmed[i]) return false;
        } else if (known[i] !== null && w[i] !== known[i]) {
          return false;
        }
      }
      return true;
    });
  }

  function newWord(level) {
    len = wordLenForLevel(level);
    var pool = WB.WORDS[len];
    answer = pool[Math.floor(Math.random() * pool.length)];

    var idx = [];
    for (var i = 0; i < len; i++) idx.push(i);
    for (var j = idx.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = idx[j]; idx[j] = idx[k]; idx[k] = t;
    }
    var mc = maskCountForLevel(level, len);
    masked = [];
    known = [];
    for (i = 0; i < len; i++) { masked.push(false); known.push(answer[i]); }
    for (i = 0; i < mc; i++) { masked[idx[i]] = true; known[idx[i]] = null; }

    progress = 0;
    confirmed = [];
    rebuildCandidates();
  }

  // Returns {correct, complete, wasMasked, word}
  function bomb(letter) {
    var ok = candidates.some(function (w) { return w[progress] === letter; });
    if (!ok) return { correct: false, complete: false, wasMasked: false, word: null };

    var wasMasked = masked[progress] && known[progress] === null;
    confirmed.push(letter);
    known[progress] = letter; // reveal (stays revealed even after a miss reset)
    progress++;
    rebuildCandidates();

    if (progress === len) {
      return { correct: true, complete: true, wasMasked: wasMasked, word: confirmed.join('') };
    }
    return { correct: true, complete: false, wasMasked: wasMasked, word: null };
  }

  // After a miss: restart the current word, keeping any revealed letters.
  function resetProgress() {
    progress = 0;
    confirmed = [];
    rebuildCandidates();
  }

  // Letters the spawner must keep supplying: every candidate's next letter.
  function neededLetters() {
    var set = {};
    for (var i = 0; i < candidates.length; i++) set[candidates[i][progress]] = true;
    return Object.keys(set);
  }

  function getDisplay() {
    var out = [];
    for (var i = 0; i < len; i++) {
      out.push({
        char: known[i] === null ? '_' : known[i],
        done: i < progress,
        current: i === progress,
        hidden: known[i] === null
      });
    }
    return out;
  }

  return {
    newWord: newWord,
    bomb: bomb,
    resetProgress: resetProgress,
    neededLetters: neededLetters,
    getDisplay: getDisplay,
    getLength: function () { return len; },
    getProgress: function () { return progress; }
  };
})();
