/* ============================================================
   AI ФУТБОЛ — игровой движок
   Поле в метрах: 105 x 68 (реальные размеры ФИФА).
   Команда 0 (игрок) атакует вправо, команда 1 (компьютер) — влево.
   ============================================================ */

const FIELD_W = 105, FIELD_H = 68;
const GOAL_W = 7.32, GOAL_H = 2.44;
const GOAL_Y1 = FIELD_H / 2 - GOAL_W / 2, GOAL_Y2 = FIELD_H / 2 + GOAL_W / 2;

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function dist(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return Math.hypot(dx, dy); }
function gauss() { return (Math.random() + Math.random() + Math.random()) / 1.5 - 1; }

/* ---------- Игрок ---------- */
class Player {
  constructor(team, info, baseX, baseY, idx) {
    this.team = team;           // 0|1
    this.info = info;           // {n, name, pos, c, boost}
    this.idx = idx;
    this.baseX = baseX; this.baseY = baseY; // доля поля 0..1 (от своих ворот)
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.face = team === 0 ? 0 : Math.PI; // направление взгляда
    this.stamina = 100;
    this.kickCooldown = 0;
    this.offside = false;
  }
}

/* ---------- Матч ---------- */
class Match {
  /**
   * teamA — команда игрока (слева), teamB — компьютер (справа)
   * settings: {matchLen (мин реального времени), difficulty, offside, sound}
   * hooks: {onHud, onMessage, onGoal, onEnd, onTip}
   */
  constructor(teamA, teamB, settings, hooks) {
    this.teams = [teamA, teamB];
    this.settings = settings;
    this.hooks = hooks;
    this.score = [0, 0];
    this.stats = { possession: [0.01, 0.01], shots: [0, 0], onTarget: [0, 0] };
    this.gameTime = 0;               // игровые секунды (0..90*60)
    this.timeScale = (90 * 60) / (settings.matchLen * 60); // игровых сек за реальную сек
    this.half = 1;
    this.state = 'KICKOFF';          // KICKOFF | PLAY | STOPPED | GOAL | HALFTIME | FULLTIME
    this.stateTimer = 0;
    this.restart = null;             // {type, x, y, team}
    this.message = '';
    this.paused = false;

    const d = settings.difficulty;   // 0 легко, 1 нормально, 2 сложно
    this.aiSkill = [1.0, [0.78, 1.0, 1.18][d]];

    this.players = [[], []];
    for (let t = 0; t < 2; t++) {
      const team = this.teams[t];
      const form = FORMATIONS[team.formation] || FORMATIONS['433'];
      team.players.forEach((info, i) => {
        const [fx, fy] = form[i];
        this.players[t].push(new Player(t, info, fx, fy, i));
      });
    }
    this.ball = { x: FIELD_W / 2, y: FIELD_H / 2, z: 0, vx: 0, vy: 0, vz: 0, owner: null };
    this.control = null;             // игрок под управлением человека
    this.controlLock = 0;
    this.lastPass = null;            // {passer, time} — для офсайда
    this.aiTimer = 0;
    this.contestTimer = 0;
    this.setupKickoff(0);
  }

  dir(t) { return t === 0 ? 1 : -1; }
  goalX(t) { return t === 0 ? FIELD_W : 0; } // ворота, которые атакует команда t
  ownGoalX(t) { return t === 0 ? 0 : FIELD_W; }

  /* --- атрибуты игрока (0..100 → игровые величины) --- */
  attr(p, kind) {
    const r = this.teams[p.team].ratings;
    const b = (p.info.boost && p.info.boost[kind]) || 0;
    let base;
    switch (kind) {
      case 'pace': base = r.pace + (p.info.pos === 'FW' ? 4 : p.info.pos === 'GK' ? -8 : 0); break;
      case 'pass': base = r.pas + (p.info.pos === 'MF' ? 4 : 0); break;
      case 'shoot': base = r.atk + (p.info.pos === 'FW' ? 5 : p.info.pos === 'DF' ? -10 : 0); break;
      case 'tackle': base = r.def + (p.info.pos === 'DF' ? 6 : p.info.pos === 'FW' ? -8 : 0); break;
      case 'save': base = r.def + 5; break;
      default: base = 75;
    }
    const mult = p.team === 1 ? this.aiSkill[1] : 1;
    return clamp((base + b) * mult, 40, 105);
  }
  speedOf(p, sprint) {
    let s = 4.6 + this.attr(p, 'pace') * 0.035;   // ~6.7..8.3 м/с
    if (sprint && p.stamina > 5) s *= 1.32;
    s *= 0.7 + 0.3 * (p.stamina / 100);
    if (this.ball.owner === p) s *= 0.88;         // с мячом чуть медленнее
    return s;
  }

  /* --- расстановка --- */
  setupKickoff(kickTeam) {
    this.state = 'KICKOFF';
    this.stateTimer = 1.4;
    this.ball.x = FIELD_W / 2; this.ball.y = FIELD_H / 2;
    this.ball.z = 0; this.ball.vx = this.ball.vy = this.ball.vz = 0;
    this.ball.owner = null;
    for (let t = 0; t < 2; t++) {
      for (const p of this.players[t]) {
        let fx = p.baseX, fy = p.baseY;
        // все на своей половине
        let x = t === 0 ? fx * FIELD_W : FIELD_W - fx * FIELD_W;
        x = t === 0 ? Math.min(x, FIELD_W / 2 - 2) : Math.max(x, FIELD_W / 2 + 2);
        p.x = x; p.y = fy * FIELD_H;
        p.vx = p.vy = 0; p.offside = false;
      }
    }
    // разыгрывающий — центральный нападающий
    const kicker = this.players[kickTeam][9];
    kicker.x = FIELD_W / 2 - this.dir(kickTeam) * 0.5;
    kicker.y = FIELD_H / 2;
    this.ball.owner = kicker;
    this.pickControl(true);
    GameAudio.whistle(1);
  }

  /* --- выбор управляемого игрока --- */
  pickControl(force) {
    const mine = this.players[0].filter(p => p.info.pos !== 'GK');
    if (this.ball.owner && this.ball.owner.team === 0 && this.ball.owner.info.pos !== 'GK') {
      this.control = this.ball.owner;
      return;
    }
    if (!force && this.controlLock > 0) return;
    let best = null, bd = 1e9;
    for (const p of mine) {
      const d = dist(p.x, p.y, this.ball.x, this.ball.y);
      if (d < bd) { bd = d; best = p; }
    }
    this.control = best;
  }
  switchControl() {
    const mine = this.players[0].filter(p => p.info.pos !== 'GK' && p !== this.control);
    mine.sort((a, b) => dist(a.x, a.y, this.ball.x, this.ball.y) - dist(b.x, b.y, this.ball.x, this.ball.y));
    if (mine[0]) { this.control = mine[0]; this.controlLock = 0.5; }
  }

  /* ============================================================
     ОСНОВНОЙ ЦИКЛ
     ============================================================ */
  update(dt, input) {
    if (this.paused) return;
    dt = Math.min(dt, 0.05);
    this.controlLock = Math.max(0, this.controlLock - dt);

    if (this.state === 'GOAL' || this.state === 'STOPPED' || this.state === 'KICKOFF' || this.state === 'HALFTIME') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        if (this.state === 'GOAL') { this.setupKickoff(this.goalConceded); }
        else if (this.state === 'HALFTIME') { this.half = 2; this.setupKickoff(1); }
        else if (this.state === 'STOPPED') { this.applyRestart(); }
        else { this.state = 'PLAY'; this.setMessage(''); }
      }
      if (this.state !== 'KICKOFF') { this.pushHud(); return; }
      // во время KICKOFF позволяем разыграть мяч сразу
      if (this.stateTimer > 0) { this.pushHud(); if (this.ball.owner && this.ball.owner.team === 0) this.humanControl(dt, input); this.moveBallWithOwner(); return; }
    }
    if (this.state === 'FULLTIME') return;

    // часы
    this.gameTime += dt * this.timeScale;
    if (this.half === 1 && this.gameTime >= 45 * 60) {
      this.gameTime = 45 * 60;
      this.state = 'HALFTIME'; this.stateTimer = 3;
      this.setMessage('Перерыв. Счёт ' + this.score[0] + ':' + this.score[1]);
      GameAudio.whistle(2);
      this.pushHud(); return;
    }
    if (this.half === 2 && this.gameTime >= 90 * 60) {
      this.gameTime = 90 * 60;
      this.finish(); return;
    }

    // владение — статистика
    if (this.ball.owner) this.stats.possession[this.ball.owner.team] += dt;

    // человек
    this.humanControl(dt, input);
    // ИИ
    this.aiTimer -= dt;
    const think = this.aiTimer <= 0;
    if (think) this.aiTimer = 0.15;
    this.updateAI(dt, think);
    // физика
    this.updatePlayersPhysics(dt);
    this.updateBall(dt);
    this.checkPickup();
    this.contest(dt);
    this.checkBoundsAndGoals();
    this.pickControl(false);
    this.pushHud();
  }

  /* ============================================================
     УПРАВЛЕНИЕ ЧЕЛОВЕКОМ
     ============================================================ */
  humanControl(dt, input) {
    const p = this.control;
    if (!p) return;
    let ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let iy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const has = this.ball.owner === p;
    if (ix || iy) {
      const len = Math.hypot(ix, iy); ix /= len; iy /= len;
      const sp = this.speedOf(p, input.sprint);
      p.vx = ix * sp; p.vy = iy * sp;
      p.face = Math.atan2(iy, ix);
      if (input.sprint) p.stamina = Math.max(0, p.stamina - 9 * dt);
    } else {
      p.vx *= 0.7; p.vy *= 0.7;
    }
    if (!input.sprint) p.stamina = Math.min(100, p.stamina + 4 * dt);

    if (has && p.kickCooldown <= 0) {
      if (input.pass) { input.pass = false; this.doPass(p, ix, iy, false); }
      else if (input.through) { input.through = false; this.doPass(p, ix, iy, true); }
      else if (input.shoot) { input.shoot = false; this.doShoot(p); }
    } else {
      input.pass = input.shoot = input.through = false;
    }
    if (input.switch) { input.switch = false; if (!has) this.switchControl(); }
  }

  /* ============================================================
     ПАС / УДАР
     ============================================================ */
  doPass(p, aimX, aimY, through) {
    const mates = this.players[p.team].filter(m => m !== p);
    let dirx = aimX, diry = aimY;
    if (!dirx && !diry) { dirx = Math.cos(p.face); diry = Math.sin(p.face); }
    let best = null, bs = -1e9;
    for (const m of mates) {
      let tx = m.x, ty = m.y;
      if (through) { tx += this.dir(p.team) * 10; ty = m.y; }
      const dx = tx - p.x, dy = ty - p.y;
      const d = Math.hypot(dx, dy);
      if (d < 2 || d > 55) continue;
      const ang = Math.acos(clamp((dx * dirx + dy * diry) / d, -1, 1));
      if (ang > 1.15) continue;
      let s = -ang * 14 - d * 0.25;
      if (through && m.info.pos === 'FW') s += 8;
      s += this.dir(p.team) * (m.x - p.x) * 0.18; // вперёд лучше
      if (s > bs) { bs = s; best = m; }
    }
    if (!best) return;
    // точность зависит от рейтинга паса
    const acc = this.attr(p, 'pass');
    let tx = best.x, ty = best.y;
    const d0 = dist(p.x, p.y, best.x, best.y);
    const speed = clamp(10 + d0 * 0.9 + (through ? 5 : 0), 12, 27);
    const t = d0 / speed;
    tx += best.vx * t * 0.85; ty += best.vy * t * 0.85;
    if (through) { tx += this.dir(p.team) * 9; }
    const err = (1 - acc / 115) * d0 * 0.35;
    tx += gauss() * err; ty += gauss() * err;
    const dd = Math.max(dist(p.x, p.y, tx, ty), 0.1);
    this.ball.owner = null;
    this.ball.vx = (tx - p.x) / dd * speed;
    this.ball.vy = (ty - p.y) / dd * speed;
    this.ball.vz = through ? 3.2 : 0.8;
    this.ball.z = 0.1;
    p.kickCooldown = 0.35;
    this.lastKicker = p;
    GameAudio.kick();
    // офсайд: фиксируем позиции на момент паса
    if (this.settings.offside) this.markOffside(p, best);
  }

  markOffside(passer, target) {
    const t = passer.team, opp = 1 - t;
    // линия предпоследнего защитника
    const xs = this.players[opp].map(q => q.x).sort((a, b) => t === 0 ? b - a : a - b);
    const line = xs[1];
    const inOppHalf = t === 0 ? target.x > FIELD_W / 2 : target.x < FIELD_W / 2;
    const beyondLine = t === 0 ? target.x > line + 0.2 : target.x < line - 0.2;
    const beyondBall = t === 0 ? target.x > this.ball.x : target.x < this.ball.x;
    target.offside = !!(inOppHalf && beyondLine && beyondBall);
    if (target.offside) { this.offsideCandidate = target; }
  }

  doShoot(p) {
    const gx = this.goalX(p.team);
    const d = dist(p.x, p.y, gx, FIELD_H / 2);
    const acc = this.attr(p, 'shoot');
    // цель — угол ворот
    let ty = this.ball.y < FIELD_H / 2 ? GOAL_Y1 + 1.1 : GOAL_Y2 - 1.1;
    const err = (1 - acc / 112) * (2.6 + d * 0.24);
    ty += gauss() * err;
    const speed = clamp(20 + acc * 0.13, 22, 34);
    const dd = Math.max(dist(p.x, p.y, gx, ty), 0.1);
    this.ball.owner = null;
    this.ball.vx = (gx - p.x) / dd * speed;
    this.ball.vy = (ty - p.y) / dd * speed;
    this.ball.vz = clamp(d * 0.09, 0.5, 3.4) + Math.random() * 1.2;
    this.ball.z = 0.15;
    p.kickCooldown = 0.5;
    this.lastKicker = p;
    this.stats.shots[p.team]++;
    GameAudio.shot();
    if (this.settings.offside) this.offsideCandidate = null;
  }

  /* ============================================================
     ИИ
     ============================================================ */
  updateAI(dt, think) {
    for (let t = 0; t < 2; t++) {
      const teamHasBall = this.ball.owner && this.ball.owner.team === t;
      // назначаем прессингующих: два ближайших к мячу (не GK)
      let pressers = [];
      if (!teamHasBall) {
        pressers = this.players[t].filter(p => p.info.pos !== 'GK')
          .sort((a, b) => dist(a.x, a.y, this.ball.x, this.ball.y) - dist(b.x, b.y, this.ball.x, this.ball.y))
          .slice(0, 2);
      }
      for (const p of this.players[t]) {
        if (p === this.control && this.state !== 'STOPPED') continue; // человеком управляет человек
        if (p.info.pos === 'GK') { this.aiGoalkeeper(p, dt); continue; }
        if (this.ball.owner === p) { if (think) this.aiCarrier(p); this.aiCarrierMove(p, dt); continue; }
        if (pressers.includes(p)) { this.moveTo(p, this.ball.x + this.ball.vx * 0.25, this.ball.y + this.ball.vy * 0.25, dt, true); continue; }
        // свободный мяч рядом — беги к нему
        if (!this.ball.owner && dist(p.x, p.y, this.ball.x, this.ball.y) < 14) {
          this.moveTo(p, this.ball.x, this.ball.y, dt, true); continue;
        }
        // позиционная игра
        const [hx, hy] = this.homeSpot(p, teamHasBall);
        this.moveTo(p, hx, hy, dt, false);
      }
    }
  }

  homeSpot(p, attacking) {
    const t = p.team, d = this.dir(t);
    let bx = t === 0 ? p.baseX * FIELD_W : FIELD_W - p.baseX * FIELD_W;
    let x = bx + (this.ball.x - FIELD_W / 2) * 0.42;
    let y = p.baseY * FIELD_H + (this.ball.y - FIELD_H / 2) * 0.22;
    if (attacking && (p.info.pos === 'FW' || p.info.pos === 'MF')) x += d * 7;
    if (!attacking) x -= d * 5;
    // нападающие держатся у линии офсайда
    if (this.settings.offside && attacking && p.info.pos === 'FW') {
      const opp = this.players[1 - t].map(q => q.x).sort((a, b) => t === 0 ? b - a : a - b);
      const line = opp[1];
      x = t === 0 ? Math.min(x, line - 0.5) : Math.max(x, line + 0.5);
    }
    return [clamp(x, 1.5, FIELD_W - 1.5), clamp(y, 1.5, FIELD_H - 1.5)];
  }

  aiCarrier(p) {
    const gx = this.goalX(p.team);
    const dGoal = dist(p.x, p.y, gx, FIELD_H / 2);
    const nearestOpp = this.nearestOpponent(p);
    const pressure = nearestOpp ? dist(p.x, p.y, nearestOpp.x, nearestOpp.y) : 99;
    const skill = this.aiSkill[p.team] || 1;
    // удар
    const inAngle = Math.abs(p.y - FIELD_H / 2) < 14;
    if (dGoal < 20 && inAngle && Math.random() < 0.3 * skill) { this.doShoot(p); return; }
    if (dGoal < 12 && Math.random() < 0.7 * skill) { this.doShoot(p); return; }
    // пас под давлением или для развития
    if (pressure < 3.5 || Math.random() < 0.22 * skill) {
      const dirx = this.dir(p.team), diry = 0;
      const through = p.info.pos === 'MF' && Math.random() < 0.35;
      this.doPass(p, dirx, diry, through);
    }
  }

  aiCarrierMove(p, dt) {
    // ведение: к воротам, уклоняясь от ближайшего соперника
    const gx = this.goalX(p.team);
    let tx = gx, ty = FIELD_H / 2 + (p.y - FIELD_H / 2) * 0.4;
    const opp = this.nearestOpponent(p);
    if (opp && dist(p.x, p.y, opp.x, opp.y) < 6) {
      const away = Math.atan2(p.y - opp.y, p.x - opp.x);
      ty = p.y + Math.sin(away) * 8;
      tx = p.x + this.dir(p.team) * 8;
    }
    this.moveTo(p, tx, clamp(ty, 3, FIELD_H - 3), dt, true);
  }

  aiGoalkeeper(gk, dt) {
    const t = gk.team;
    const ownX = this.ownGoalX(t);
    const d = this.dir(t);
    if (this.ball.owner === gk) {
      // выбить/отдать защитнику
      gk.holdTime = (gk.holdTime || 0) + dt;
      if (gk.holdTime > 0.8) { gk.holdTime = 0; this.doPass(gk, d, (Math.random() - 0.5), false); }
      return;
    }
    gk.holdTime = 0;
    const ballDist = dist(gk.x, gk.y, this.ball.x, this.ball.y);
    const ballComing = (this.ball.vx * d) < -3;
    const ballNearGoal = Math.abs(this.ball.x - ownX) < 18;
    // мяч летит в ворота — бросок к точке пересечения с линией
    if (!this.ball.owner && ballComing && Math.abs(this.ball.x - ownX) < 30 && Math.abs(this.ball.vx) > 6) {
      const tToLine = (ownX + d * 0.8 - this.ball.x) / this.ball.vx;
      if (tToLine > 0 && tToLine < 2.5) {
        const crossY = this.ball.y + this.ball.vy * tToLine;
        if (crossY > GOAL_Y1 - 3 && crossY < GOAL_Y2 + 3) {
          this.moveTo(gk, ownX + d * 0.8, clamp(crossY, GOAL_Y1 - 1, GOAL_Y2 + 1), dt, true);
          return;
        }
      }
    }
    if (!this.ball.owner && ballNearGoal && ballDist < 9 && (ballComing || Math.hypot(this.ball.vx, this.ball.vy) < 5)) {
      this.moveTo(gk, this.ball.x, this.ball.y, dt, true); // выход
      return;
    }
    // позиция на линии, чуть выдвинут
    const ty = clamp(this.ball.y, GOAL_Y1 + 0.5, GOAL_Y2 - 0.5);
    const tx = ownX + d * clamp(1 + (FIELD_W - Math.abs(this.ball.x - ownX)) * 0.01, 0.8, 3);
    this.moveTo(gk, tx, ty, dt, false);
  }

  nearestOpponent(p) {
    let best = null, bd = 1e9;
    for (const q of this.players[1 - p.team]) {
      const d = dist(p.x, p.y, q.x, q.y);
      if (d < bd) { bd = d; best = q; }
    }
    return best;
  }

  moveTo(p, tx, ty, dt, hurry) {
    const dx = tx - p.x, dy = ty - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.4) { p.vx *= 0.6; p.vy *= 0.6; return; }
    const sp = this.speedOf(p, hurry) * (hurry ? 1 : 0.82);
    p.vx = dx / d * sp; p.vy = dy / d * sp;
    p.face = Math.atan2(dy, dx);
  }

  /* ============================================================
     ФИЗИКА
     ============================================================ */
  updatePlayersPhysics(dt) {
    for (let t = 0; t < 2; t++) for (const p of this.players[t]) {
      p.kickCooldown = Math.max(0, p.kickCooldown - dt);
      p.x = clamp(p.x + p.vx * dt, 0.3, FIELD_W - 0.3);
      p.y = clamp(p.y + p.vy * dt, 0.3, FIELD_H - 0.3);
    }
    this.moveBallWithOwner();
  }

  moveBallWithOwner() {
    const o = this.ball.owner;
    if (!o) return;
    this.ball.x = o.x + Math.cos(o.face) * 0.75;
    this.ball.y = o.y + Math.sin(o.face) * 0.75;
    this.ball.z = 0; this.ball.vx = o.vx; this.ball.vy = o.vy; this.ball.vz = 0;
  }

  updateBall(dt) {
    const b = this.ball;
    if (b.owner) return;
    b.x += b.vx * dt; b.y += b.vy * dt;
    const damp = b.z > 0.05 ? 0.12 : 0.75; // в воздухе тормозит меньше
    const f = Math.exp(-damp * dt);
    b.vx *= f; b.vy *= f;
    b.z += b.vz * dt;
    if (b.z > 0.03) b.vz -= 9.81 * dt;
    if (b.z < 0) { b.z = 0; if (Math.abs(b.vz) > 1) { b.vz = -b.vz * 0.55; b.vx *= 0.85; b.vy *= 0.85; } else b.vz = 0; }
  }

  checkPickup() {
    const b = this.ball;
    if (b.owner || b.z > 1.6) return;
    const speed = Math.hypot(b.vx, b.vy);
    for (let t = 0; t < 2; t++) for (const p of this.players[t]) {
      if (p.kickCooldown > 0 && p === this.lastKicker) continue;
      const isGK = p.info.pos === 'GK';
      const reach = isGK ? 1.7 : 1.0;
      if (dist(p.x, p.y, b.x, b.y) > reach) continue;
      // офсайд: свисток, когда игрок вне игры касается мяча
      if (this.settings.offside && p.offside && this.offsideCandidate === p) {
        this.callOffside(p); return;
      }
      // вратарь ловит даже быстрый мяч (сейв обсчитан в checkBoundsAndGoals по линии)
      if (!isGK && speed > 16) {
        // быстрый мяч сложно принять
        if (Math.random() > this.attr(p, 'pass') / 130) continue;
      }
      if (isGK && speed > 8) {
        const save = this.attr(p, 'save');
        if (Math.random() < save / 108) {
          b.owner = p; this.afterPickup(p);
          if (this.lastKicker && this.lastKicker.team !== t) { this.stats.onTarget[this.lastKicker.team]++; GameAudio.save(); this.setMessage('Сейв! ' + this.playerLabel(p), 1.4); }
          return;
        } else {
          // отбил перед собой
          b.vx = -b.vx * 0.4 + gauss() * 4; b.vy = -b.vy * 0.4 + gauss() * 4; b.vz = 2;
          p.kickCooldown = 0.5; this.lastKicker = p;
          GameAudio.save();
          return;
        }
      }
      b.owner = p; this.afterPickup(p);
      return;
    }
  }

  afterPickup(p) {
    // сбрасываем офсайд-флаги
    for (let t = 0; t < 2; t++) for (const q of this.players[t]) q.offside = false;
    this.offsideCandidate = null;
    this.ball.vx = this.ball.vy = this.ball.vz = 0; this.ball.z = 0;
    if (p.team === 0) this.pickControl(true);
  }

  callOffside(p) {
    GameAudio.whistle(1);
    this.stop('offside', 'Офсайд! ' + this.playerLabel(p) + ' был в положении «вне игры»', {
      type: 'freekick', x: p.x, y: p.y, team: 1 - p.team
    });
  }

  /* борьба за мяч (отбор) */
  contest(dt) {
    this.contestTimer -= dt;
    if (this.contestTimer > 0) return;
    this.contestTimer = 0.3;
    const o = this.ball.owner;
    if (!o || o.info.pos === 'GK') return;
    for (const q of this.players[1 - o.team]) {
      if (q.info.pos === 'GK') continue;
      if (dist(q.x, q.y, o.x, o.y) > 1.5) continue;
      const pTackle = 0.16 + (this.attr(q, 'tackle') - this.attr(o, 'pass')) * 0.004;
      if (Math.random() < clamp(pTackle, 0.06, 0.4)) {
        // мяч отскакивает к отбирающему
        this.ball.owner = null;
        this.ball.x = q.x + (q.x - o.x) * 0.5; this.ball.y = q.y + (q.y - o.y) * 0.5;
        this.ball.vx = (q.x - o.x) * 3 + gauss() * 2;
        this.ball.vy = (q.y - o.y) * 3 + gauss() * 2;
        o.kickCooldown = 0.6;
        GameAudio.kick();
        break;
      }
    }
  }

  /* ============================================================
     ГРАНИЦЫ, ГОЛЫ, ВОССТАНОВЛЕНИЯ
     ============================================================ */
  checkBoundsAndGoals() {
    const b = this.ball;
    if (b.owner) return;
    // гол?
    if (b.x <= 0 || b.x >= FIELD_W) {
      const side = b.x <= 0 ? 0 : 1;           // чьи ворота (side=0 — левые, команда 0 защищает)
      const inGoal = b.y > GOAL_Y1 && b.y < GOAL_Y2 && b.z < GOAL_H;
      if (inGoal) { this.goal(side === 0 ? 1 : 0); return; }
      // за лицевую: угловой или от ворот
      const defTeam = side;                     // команда, защищающая эти ворота
      const attacker = this.lastKicker;
      const byAttack = attacker && attacker.team !== defTeam;
      if (byAttack && this.stats.shots[attacker.team] >= 0 && Math.abs(b.y - FIELD_H / 2) < GOAL_W) {
        // мимо ворот — статистика
      }
      if (byAttack) {
        // от ворот
        this.stop('goalkick', 'Мяч ушёл за лицевую — удар от ворот', {
          type: 'goalkick', team: defTeam
        });
      } else {
        // угловой
        const cy = b.y < FIELD_H / 2 ? 1 : FIELD_H - 1;
        const cx = side === 0 ? 1 : FIELD_W - 1;
        this.stop('corner', 'Угловой!', { type: 'corner', x: cx, y: cy, team: 1 - defTeam });
      }
      return;
    }
    // аут
    if (b.y <= 0 || b.y >= FIELD_H) {
      const throwTeam = this.lastKicker ? 1 - this.lastKicker.team : 0;
      this.stop('throwin', 'Аут — вбрасывание', {
        type: 'throwin', x: clamp(b.x, 2, FIELD_W - 2), y: b.y <= 0 ? 0.5 : FIELD_H - 0.5, team: throwTeam
      });
    }
  }

  stop(kind, msg, restart) {
    this.state = 'STOPPED';
    this.stateTimer = 1.3;
    this.restart = restart;
    this.setMessage(msg);
    this.ball.vx = this.ball.vy = this.ball.vz = 0;
    if (kind !== 'offside') GameAudio.whistle(1);
  }

  applyRestart() {
    const r = this.restart; this.restart = null;
    this.state = 'PLAY'; this.setMessage('');
    const b = this.ball;
    for (let t = 0; t < 2; t++) for (const q of this.players[t]) q.offside = false;
    this.offsideCandidate = null;
    let px, py;
    if (r.type === 'goalkick') {
      px = this.ownGoalX(r.team) + this.dir(r.team) * 6; py = FIELD_H / 2 + (Math.random() < 0.5 ? -9 : 9);
      b.x = px; b.y = py;
      const gk = this.players[r.team][0];
      gk.x = px - this.dir(r.team) * 1; gk.y = py;
      b.owner = gk;
    } else {
      px = r.x; py = r.y;
      b.x = px; b.y = py; b.z = 0;
      // ближайший игрок команды r.team к точке
      let best = null, bd = 1e9;
      for (const q of this.players[r.team]) {
        if (q.info.pos === 'GK') continue;
        const d = dist(q.x, q.y, px, py);
        if (d < bd) { bd = d; best = q; }
      }
      if (best) { best.x = px - this.dir(r.team) * 0.8; best.y = py; b.owner = best; }
    }
    if (b.owner) b.owner.kickCooldown = 0;
    this.lastKicker = b.owner;
    if (r.team === 0) this.pickControl(true);
  }

  goal(scorerTeam) {
    this.score[scorerTeam]++;
    this.stats.shots[scorerTeam] = Math.max(this.stats.shots[scorerTeam], 1);
    this.stats.onTarget[scorerTeam]++;
    const scorer = this.lastKicker && this.lastKicker.team === scorerTeam ? this.lastKicker : null;
    this.state = 'GOAL';
    this.stateTimer = 3.2;
    this.goalConceded = 1 - scorerTeam;
    const label = scorer ? this.playerLabel(scorer) + ' (' + this.teams[scorerTeam].name + ')' : this.teams[scorerTeam].name;
    this.setMessage('⚽ ГОООЛ! ' + label);
    GameAudio.goal();
    if (this.hooks.onGoal) this.hooks.onGoal(scorerTeam, scorer);
  }

  finish() {
    this.state = 'FULLTIME';
    GameAudio.whistle(3);
    GameAudio.matchEnd();
    if (this.hooks.onEnd) this.hooks.onEnd(this.result());
  }
  forfeit() { this.finish(); }

  result() {
    const pos = this.stats.possession;
    const total = pos[0] + pos[1];
    return {
      score: this.score.slice(),
      possession: [Math.round(pos[0] / total * 100), Math.round(pos[1] / total * 100)],
      shots: this.stats.shots.slice(),
      onTarget: this.stats.onTarget.slice(),
      teams: this.teams
    };
  }

  playerLabel(p) { return '№' + p.info.n + ' ' + p.info.name; }

  setMessage(m, timer) {
    this.message = m;
    if (timer) { this.msgTimer = timer; }
    if (this.hooks.onMessage) this.hooks.onMessage(m);
  }

  pushHud() {
    if (!this.hooks.onHud) return;
    const min = Math.floor(this.gameTime / 60), sec = Math.floor(this.gameTime % 60);
    this.hooks.onHud({
      clock: String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0'),
      half: this.half,
      score: this.score,
      owner: this.ball.owner,
      control: this.control,
      state: this.state
    });
  }
}

window.Match = Match;
window.FIELD = { W: FIELD_W, H: FIELD_H, GOAL_W, GOAL_Y1, GOAL_Y2 };
