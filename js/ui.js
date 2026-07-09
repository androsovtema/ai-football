/* AI ФУТБОЛ — интерфейс: экраны, выбор команд, HUD, советы */

window.UI = (function () {
  const $ = (id) => document.getElementById(id);

  const RATING_LABELS = [
    ['atk', 'Атака'], ['def', 'Оборона'], ['pas', 'Пас'],
    ['pace', 'Скорость'], ['team', 'Сыгранность'], ['exp', 'Опыт']
  ];
  const POS_RU = { GK: 'ВРТ', DF: 'ЗАЩ', MF: 'ПЗ', FW: 'НАП' };

  const TIPS = [
    'Совет: пас (Пробел) идёт тому партнёру, в чью сторону вы двигаетесь.',
    'Совет: пас вразрез (C) — мяч летит на ход нападающему, как в настоящем футболе.',
    'Правило: если мяч ушёл за боковую линию — назначается аут (вбрасывание).',
    'Правило: угловой подают, когда мяч ушёл за лицевую линию от защищающейся команды.',
    'Правило: офсайд — нападающий не должен быть ближе к воротам, чем предпоследний защитник, в момент паса.',
    'Совет: не бегите всё время с ускорением (Shift) — выносливость кончается, игрок замедляется.',
    'Совет: бейте по воротам (X) с 15–20 метров — с дальней дистанции вратарь почти всегда спасёт.',
    'Совет: в обороне зажмите E, чтобы переключиться на ближайшего к мячу игрока.',
    'Факт: вы всегда управляете игроком с жёлтой стрелкой — как в FIFA.',
    'Факт: № на футболке — настоящий номер игрока в сборной на ЧМ-2026.',
    'Факт: вратарь (ВРТ) играет в форме другого цвета — так положено по правилам.',
    'Совет: короткие точные пасы удержат владение — так играет Испания.'
  ];

  let tipTimer = null;

  function show(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $('screen-' + name).classList.add('active');
  }

  /* ---------- рейтинги ---------- */
  function ratingsHTML(team) {
    let h = '<div class="ratings-grid">';
    for (const [key, label] of RATING_LABELS) {
      const v = team.ratings[key];
      h += `<div class="rating-row"><span class="lbl">${label}</span>
            <span class="rating-bar"><i style="width:${v}%"></i></span>
            <span class="val">${v}</span></div>`;
    }
    return h + '</div>';
  }

  function kitHTML(team) {
    return `<span class="kit-preview">
      <span class="kit-swatch" style="background:${team.kit.p}"></span>
      <span class="kit-swatch" style="background:${team.kit.s}"></span>
      <span class="kit-swatch" style="background:${team.kit.gk}" title="вратарь"></span>
    </span>`;
  }

  /* ---------- экран «Команды» ---------- */
  function renderTeamsList() {
    const box = $('teams-list');
    box.innerHTML = '';
    const sorted = TEAMS.slice().sort((a, b) => overallRating(b) - overallRating(a));
    for (const team of sorted) {
      const card = document.createElement('div');
      card.className = 'team-card';
      let roster = `<table class="roster-table"><tr><th>№</th><th>Игрок</th><th>Позиция</th></tr>`;
      for (const p of team.players) {
        roster += `<tr><td class="roster-num">${p.n}</td>
          <td>${p.name}${p.c ? ' <span title="капитан">©</span>' : ''}</td>
          <td><span class="pos-badge pos-${p.pos}">${POS_RU[p.pos]}</span></td></tr>`;
      }
      roster += '</table>';
      card.innerHTML = `
        <div class="team-card-head">
          <span class="team-flag">${team.flag}</span>
          <span class="team-name">${team.name}</span>
          ${kitHTML(team)}
          <span class="team-ovr">${overallRating(team)}</span>
        </div>
        <div class="team-card-body">
          <p class="team-desc">${team.desc}</p>
          <ul class="team-strengths">${team.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
          ${ratingsHTML(team)}
          ${roster}
        </div>`;
      card.querySelector('.team-card-head').addEventListener('click', () => {
        GameAudio.click();
        card.classList.toggle('open');
      });
      box.appendChild(card);
    }
  }

  /* ---------- выбор команд ---------- */
  const sel = { step: 0, user: null, cpu: null };

  function renderSelect() {
    const grid = $('select-grid');
    grid.innerHTML = '';
    $('select-title').textContent = sel.step === 0
      ? 'Шаг 1 из 2 — выберите СВОЮ команду'
      : 'Шаг 2 из 2 — выберите СОПЕРНИКА';
    $('btn-select-go').classList.toggle('hidden', !(sel.user && sel.cpu));
    const sorted = TEAMS.slice().sort((a, b) => overallRating(b) - overallRating(a));
    for (const team of sorted) {
      const card = document.createElement('div');
      card.className = 'select-card';
      if (sel.step === 1 && team === sel.user) card.classList.add('disabled');
      if ((sel.step === 0 && team === sel.user) || (sel.step === 1 && team === sel.cpu)) card.classList.add('chosen');
      card.innerHTML = `<span class="team-flag">${team.flag}</span>
        <div class="nm">${team.name}</div>
        <div class="ov">Рейтинг ${overallRating(team)}</div>`;
      card.addEventListener('mouseenter', () => {
        $('select-detail').innerHTML = `<b>${team.flag} ${team.name}</b> — ${team.desc}<br>` +
          `<span style="color:#9fd3ac">Сильные стороны: ${team.strengths.join(' · ')}</span>`;
      });
      card.addEventListener('click', () => {
        GameAudio.click();
        if (sel.step === 0) { sel.user = team; sel.step = 1; if (sel.cpu === team) sel.cpu = null; }
        else { sel.cpu = team; }
        renderSelect();
      });
      grid.appendChild(card);
    }
    if (sel.user && sel.cpu) {
      $('select-detail').innerHTML =
        `Вы: <b>${sel.user.flag} ${sel.user.name}</b> &nbsp;против&nbsp; <b>${sel.cpu.flag} ${sel.cpu.name}</b> (компьютер). Жмите «Начать матч»!`;
    }
  }

  function resetSelect() { sel.step = 0; sel.user = null; sel.cpu = null; renderSelect(); }

  /* ---------- HUD матча ---------- */
  function setupMatchHud(teamA, teamB) {
    $('sb-n0').textContent = teamA.id;
    $('sb-n1').textContent = teamB.id;
    $('sb-k0').style.background = teamA.kit.p;
    $('sb-k1').style.background = teamB.kit.p;
    $('sb-score').textContent = '0 : 0';
    $('sb-clock').textContent = '00:00';
    $('sb-half').textContent = '1-й тайм';
    startTips();
  }

  function updateHud(h, match) {
    $('sb-score').textContent = h.score[0] + ' : ' + h.score[1];
    $('sb-clock').textContent = h.clock;
    $('sb-half').textContent = h.half === 1 ? '1-й тайм' : '2-й тайм';
    const chip = $('possession-chip');
    if (h.owner) {
      const t = match.teams[h.owner.team];
      const who = h.owner.team === 0 ? 'у вас' : 'у соперника';
      chip.innerHTML = `⚽ Мяч ${who}: <b>№${h.owner.info.n} ${h.owner.info.name}</b> (${t.flag} ${t.name})`;
      chip.style.borderColor = h.owner.team === 0 ? '#3f9c55' : '#7c3a3a';
    } else {
      chip.innerHTML = '⚽ Мяч свободен — успейте первым!';
      chip.style.borderColor = '#2c4258';
    }
  }

  function showMessage(msg) {
    const el = $('match-message');
    if (!msg) { el.classList.add('hidden'); return; }
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function startTips() {
    stopTips();
    let i = Math.floor(Math.random() * TIPS.length);
    $('tip-bar').textContent = TIPS[i];
    tipTimer = setInterval(() => {
      i = (i + 1) % TIPS.length;
      $('tip-bar').textContent = TIPS[i];
    }, 9000);
  }
  function stopTips() { if (tipTimer) clearInterval(tipTimer); tipTimer = null; }

  /* ---------- результат ---------- */
  function showResult(r) {
    show('result');
    const [a, b] = r.teams;
    const you = r.score[0], him = r.score[1];
    $('result-title').innerHTML = you > him ? '🏆 Победа!' : you < him ? '😞 Поражение' : '🤝 Ничья';
    $('result-score').innerHTML =
      `${a.flag} ${a.id} &nbsp;${you} : ${him}&nbsp; ${b.id} ${b.flag}`;
    $('result-stats').innerHTML = `
      <div class="stat-line"><span>${r.possession[0]}%</span><span class="mid">Владение мячом</span><span>${r.possession[1]}%</span></div>
      <div class="stat-line"><span>${r.shots[0]}</span><span class="mid">Удары</span><span>${r.shots[1]}</span></div>
      <div class="stat-line"><span>${r.onTarget[0]}</span><span class="mid">Удары в створ</span><span>${r.onTarget[1]}</span></div>`;
  }

  return {
    show, renderTeamsList, renderSelect, resetSelect, sel,
    setupMatchHud, updateHud, showMessage, showResult, stopTips
  };
})();
