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
  const input = { up: false, down: false, left: false, right: false, sprint: false, pass: false, shoot: false, through: false, switch: false, ax: 0, ay: 0 };

  /* ---------- сенсорное управление ---------- */
  const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || location.search.includes('touch');
  if (IS_TOUCH) {
    document.body.classList.add('touch');
    setupTouchControls();
  }
  function setupTouchControls() {
    const zone = $('joy-zone'), base = $('joy-base'), knob = $('joy-knob');
    const R = 55; // радиус хода джойстика, px
    let joyId = null, ox = 0, oy = 0;

    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (joyId !== null) return;
      const t = e.changedTouches[0];
      joyId = t.identifier; ox = t.clientX; oy = t.clientY;
      base.style.left = ox + 'px'; base.style.top = oy + 'px';
      base.classList.remove('hidden');
      knob.style.transform = 'translate(0px, 0px)';
    }, { passive: false });

    zone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier !== joyId) continue;
        let dx = t.clientX - ox, dy = t.clientY - oy;
        const len = Math.hypot(dx, dy);
        if (len > R) { dx = dx / len * R; dy = dy / len * R; }
        knob.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
        if (len < 12) { input.ax = 0; input.ay = 0; } // мёртвая зона
        else { const n = Math.max(len, R); input.ax = dx / Math.min(n, R) ; input.ay = dy / Math.min(n, R); }
      }
    }, { passive: false });

    const joyEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== joyId) continue;
        joyId = null; input.ax = 0; input.ay = 0;
        base.classList.add('hidden');
      }
    };
    zone.addEventListener('touchend', joyEnd);
    zone.addEventListener('touchcancel', joyEnd);

    // кнопки действий
    document.querySelectorAll('.tbtn').forEach((btn) => {
      const act = btn.dataset.act;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btn.classList.add('held');
        if (act === 'sprint') input.sprint = true;
        else input[act] = true;
      }, { passive: false });
      const end = (e) => {
        e.preventDefault();
        btn.classList.remove('held');
        if (act === 'sprint') input.sprint = false;
      };
      btn.addEventListener('touchend', end, { passive: false });
      btn.addEventListener('touchcancel', end, { passive: false });
    });

    $('touch-pause').addEventListener('touchstart', (e) => { e.preventDefault(); togglePause(); }, { passive: false });
    $('touch-pause').addEventListener('click', (e) => { e.preventDefault(); togglePause(); });
  }
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
