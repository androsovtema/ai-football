/* AI ФУТБОЛ — точка входа: настройки, ввод, игровой цикл */

(function () {
  const $ = (id) => document.getElementById(id);

  /* ---------- настройки ---------- */
  const DEFAULTS = { sound: true, matchLen: 6, difficulty: 1, offside: true };
  let settings = loadSettings();

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('aifootball.settings'));
      return Object.assign({}, DEFAULTS, s || {});
    } catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function saveSettings() {
    localStorage.setItem('aifootball.settings', JSON.stringify(settings));
  }
  function applySettingsToForm() {
    $('set-sound').checked = settings.sound;
    $('set-len').value = String(settings.matchLen);
    $('set-diff').value = String(settings.difficulty);
    $('set-offside').checked = settings.offside;
  }
  function readSettingsFromForm() {
    settings.sound = $('set-sound').checked;
    settings.matchLen = parseInt($('set-len').value, 10);
    settings.difficulty = parseInt($('set-diff').value, 10);
    settings.offside = $('set-offside').checked;
    GameAudio.setEnabled(settings.sound);
    saveSettings();
  }

  /* ---------- ввод ---------- */
  const input = { up: false, down: false, left: false, right: false, sprint: false, pass: false, shoot: false, through: false, switch: false };
  const KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
    ShiftLeft: 'sprint', ShiftRight: 'sprint'
  };
  document.addEventListener('keydown', (e) => {
    if (!match || paused) {
      if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
      return;
    }
    if (KEYMAP[e.code]) { input[KEYMAP[e.code]] = true; e.preventDefault(); }
    else if (e.code === 'Space') { input.pass = true; e.preventDefault(); }
    else if (e.code === 'KeyX') { input.shoot = true; e.preventDefault(); }
    else if (e.code === 'KeyC') { input.through = true; e.preventDefault(); }
    else if (e.code === 'KeyE' || e.code === 'Tab') { input.switch = true; e.preventDefault(); }
    else if (e.code === 'KeyP' || e.code === 'Escape') { togglePause(); e.preventDefault(); }
  });
  document.addEventListener('keyup', (e) => {
    if (KEYMAP[e.code]) input[KEYMAP[e.code]] = false;
  });

  /* ---------- матч ---------- */
  let match = null;
  let renderer = null;
  let paused = false;
  let rafId = null;
  let lastTime = 0;

  function startMatch() {
    const teamA = UI.sel.user, teamB = UI.sel.cpu;
    if (!teamA || !teamB) return;
    UI.show('match');
    UI.setupMatchHud(teamA, teamB);
    GameAudio.setEnabled(settings.sound);
    GameAudio.matchStart();
    // чистые копии команд (движок не должен портить исходные данные)
    match = new Match(teamA, teamB, {
      matchLen: settings.matchLen,
      difficulty: settings.difficulty,
      offside: settings.offside
    }, {
      onHud: (h) => UI.updateHud(h, match),
      onMessage: (m) => UI.showMessage(m),
      onEnd: (r) => {
        stopLoop();
        UI.stopTips();
        setTimeout(() => UI.showResult(r), 600);
      }
    });
    // разные формы, если цвета похожи
    resolveKitClash(match);
    window.__match = match; // для отладки в консоли
    paused = false;
    $('pause-overlay').classList.add('hidden');
    if (!renderer) renderer = new Renderer($('pitch'));
    renderer.resize();
    renderer.camX = FIELD.W / 2; renderer.camY = FIELD.H / 2;
    lastTime = performance.now();
    stopLoop();
    rafId = requestAnimationFrame(loop);
  }

  function resolveKitClash(m) {
    const k0 = m.teams[0].kit, k1 = m.teams[1].kit;
    if (colorDist(k0.p, k1.p) < 130) {
      // гостевая команда играет в запасной форме
      for (const p of m.players[1]) p.kitUse = m.teams[1].kit2;
      $('sb-k1').style.background = m.teams[1].kit2.p;
    }
  }
  function colorDist(a, b) {
    const pa = hex(a), pb = hex(b);
    return Math.abs(pa[0] - pb[0]) + Math.abs(pa[1] - pb[1]) + Math.abs(pa[2] - pb[2]);
  }
  function hex(h) {
    const m2 = /^#?(..)(..)(..)$/.exec(h);
    return m2 ? [parseInt(m2[1], 16), parseInt(m2[2], 16), parseInt(m2[3], 16)] : [0, 0, 0];
  }

  function loop(now) {
    rafId = requestAnimationFrame(loop);
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (!match) return;
    if (!paused) match.update(dt, input);
    renderer.draw(match, dt);
  }

  function stopLoop() { if (rafId) cancelAnimationFrame(rafId); rafId = null; }

  function togglePause() {
    if (!match || match.state === 'FULLTIME') return;
    paused = !paused;
    match.paused = paused;
    $('pause-sound').checked = settings.sound;
    $('pause-overlay').classList.toggle('hidden', !paused);
  }

  function quitMatch() {
    stopLoop();
    UI.stopTips();
    GameAudio.matchEnd();
    match = null;
    paused = false;
    $('pause-overlay').classList.add('hidden');
    UI.show('menu');
  }

  /* ---------- привязка кнопок ---------- */
  $('btn-start').addEventListener('click', () => { GameAudio.click(); UI.resetSelect(); UI.show('select'); });
  $('btn-teams').addEventListener('click', () => { GameAudio.click(); UI.renderTeamsList(); UI.show('teams'); });
  $('btn-settings').addEventListener('click', () => { GameAudio.click(); applySettingsToForm(); UI.show('settings'); });
  $('btn-settings-back').addEventListener('click', () => { readSettingsFromForm(); GameAudio.click(); UI.show('menu'); });
  $('btn-teams-back').addEventListener('click', () => { GameAudio.click(); UI.show('menu'); });
  $('btn-select-back').addEventListener('click', () => {
    GameAudio.click();
    if (UI.sel.step === 1) { UI.sel.step = 0; UI.sel.cpu = null; UI.renderSelect(); }
    else UI.show('menu');
  });
  $('btn-select-go').addEventListener('click', () => { GameAudio.click(); startMatch(); });
  $('btn-resume').addEventListener('click', () => togglePause());
  $('pause-sound').addEventListener('change', (e) => {
    settings.sound = e.target.checked; GameAudio.setEnabled(settings.sound);
    if (settings.sound) GameAudio.matchStart();
    saveSettings();
  });
  $('btn-restart-match').addEventListener('click', () => { paused = false; startMatch(); });
  $('btn-quit-match').addEventListener('click', quitMatch);
  $('btn-again').addEventListener('click', () => { GameAudio.click(); startMatch(); });
  $('btn-result-menu').addEventListener('click', () => { GameAudio.click(); match = null; UI.show('menu'); });

  GameAudio.setEnabled(settings.sound);
})();
