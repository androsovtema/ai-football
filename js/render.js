/* AI ФУТБОЛ — отрисовка (Canvas, камера следит за мячом, вид как в ТВ-трансляции) */

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camX = FIELD.W / 2; this.camY = FIELD.H / 2;
    this.zoom = 1.9;             // во сколько раз ближе, чем всё поле
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.canvas.width = w * dpr; this.canvas.height = h * dpr;
    this.dpr = dpr; this.w = w; this.h = h;
  }

  /* метры → пиксели с учётом камеры */
  setupCam(match, dt) {
    const b = match.ball;
    // камера чуть впереди мяча
    const tx = clamp2(b.x + b.vx * 0.3, 0, FIELD.W);
    const ty = clamp2(b.y + b.vy * 0.3, 0, FIELD.H);
    const k = 1 - Math.exp(-3.2 * dt);
    this.camX += (tx - this.camX) * k;
    this.camY += (ty - this.camY) * k;
    // масштаб: видимая ширина поля
    const visW = FIELD.W / this.zoom;
    this.scale = this.w / visW;
    const visH = this.h / this.scale;
    this.camX = clamp2(this.camX, visW / 2 - 4, FIELD.W - visW / 2 + 4);
    this.camY = clamp2(this.camY, Math.min(visH / 2, FIELD.H / 2), Math.max(FIELD.H - visH / 2, FIELD.H / 2));
  }

  px(x) { return (x - this.camX) * this.scale + this.w / 2; }
  py(y) { return (y - this.camY) * this.scale + this.h / 2; }

  draw(match, dt) {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.setupCam(match, dt);
    this.drawPitch(c);
    this.drawGoals(c);
    // тень мяча
    const b = match.ball;
    // игроки, отсортированные по y (простая глубина)
    const all = match.players[0].concat(match.players[1]).slice().sort((a, b2) => a.y - b2.y);
    for (const p of all) this.drawPlayer(c, p, match);
    this.drawBall(c, b);
  }

  drawPitch(c) {
    const s = this.scale;
    // фон за полем
    c.fillStyle = '#1e5c30';
    c.fillRect(0, 0, this.w, this.h);
    // газон полосами
    const stripeW = FIELD.W / 14;
    for (let i = 0; i < 14; i++) {
      c.fillStyle = i % 2 ? '#2d7a3f' : '#328a47';
      const x0 = this.px(i * stripeW), x1 = this.px((i + 1) * stripeW);
      c.fillRect(x0, this.py(0), x1 - x0, (FIELD.H) * s);
    }
    // разметка
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = Math.max(1.5, 0.12 * s);
    const L = (x) => this.px(x), T = (y) => this.py(y);
    // границы
    c.strokeRect(L(0), T(0), FIELD.W * s, FIELD.H * s);
    // центральная линия и круг
    c.beginPath(); c.moveTo(L(FIELD.W / 2), T(0)); c.lineTo(L(FIELD.W / 2), T(FIELD.H)); c.stroke();
    c.beginPath(); c.arc(L(FIELD.W / 2), T(FIELD.H / 2), 9.15 * s, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(L(FIELD.W / 2), T(FIELD.H / 2), 0.3 * s, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.fill();
    // штрафные и вратарские
    for (const side of [0, 1]) {
      const x0 = side === 0 ? 0 : FIELD.W;
      const dir = side === 0 ? 1 : -1;
      // штрафная 16.5 x 40.3
      c.strokeRect(Math.min(L(x0), L(x0 + dir * 16.5)), T(FIELD.H / 2 - 20.15), Math.abs(16.5 * s * dir), 40.3 * s);
      // вратарская 5.5 x 18.3
      c.strokeRect(Math.min(L(x0), L(x0 + dir * 5.5)), T(FIELD.H / 2 - 9.16), Math.abs(5.5 * s), 18.32 * s);
      // точка пенальти
      c.beginPath(); c.arc(L(x0 + dir * 11), T(FIELD.H / 2), 0.28 * s, 0, Math.PI * 2); c.fill();
      // дуга штрафной
      c.beginPath();
      const a0 = side === 0 ? -0.94 : Math.PI - 0.94;
      c.arc(L(x0 + dir * 11), T(FIELD.H / 2), 9.15 * s, a0, a0 + 1.88);
      c.stroke();
    }
  }

  drawGoals(c) {
    const s = this.scale;
    for (const side of [0, 1]) {
      const x0 = side === 0 ? 0 : FIELD.W;
      const dir = side === 0 ? -1 : 1;
      const gx = this.px(x0), gx2 = this.px(x0 + dir * 2.2);
      const y1 = this.py(FIELD.GOAL_Y1), y2 = this.py(FIELD.GOAL_Y2);
      // сетка
      c.fillStyle = 'rgba(240,240,240,0.25)';
      c.fillRect(Math.min(gx, gx2), y1, Math.abs(gx2 - gx), y2 - y1);
      c.strokeStyle = 'rgba(255,255,255,0.5)';
      c.lineWidth = 1;
      const n = 6;
      for (let i = 0; i <= n; i++) {
        const yy = y1 + (y2 - y1) * i / n;
        c.beginPath(); c.moveTo(gx, yy); c.lineTo(gx2, yy); c.stroke();
        const xx = gx + (gx2 - gx) * i / n;
        c.beginPath(); c.moveTo(xx, y1); c.lineTo(xx, y2); c.stroke();
      }
      // штанги
      c.strokeStyle = '#ffffff';
      c.lineWidth = Math.max(2, 0.14 * s);
      c.beginPath(); c.moveTo(gx, y1); c.lineTo(gx2, y1); c.moveTo(gx, y2); c.lineTo(gx2, y2);
      c.moveTo(gx, y1); c.lineTo(gx, y2); c.stroke();
    }
  }

  drawPlayer(c, p, match) {
    const s = this.scale;
    const x = this.px(p.x), y = this.py(p.y);
    const r = 0.62 * s;
    const team = match.teams[p.team];
    const kit = p.kitUse || team.kit;
    const isGK = p.info.pos === 'GK';
    const fill = isGK ? kit.gk : kit.p;
    const trim = isGK ? '#ffffff' : kit.s;

    // подсветка управляемого
    if (p === match.control) {
      c.beginPath(); c.arc(x, y, r + 0.28 * s, 0, Math.PI * 2);
      c.strokeStyle = '#ffee58'; c.lineWidth = Math.max(2, 0.14 * s); c.stroke();
      // стрелка сверху
      c.fillStyle = '#ffee58';
      c.beginPath();
      c.moveTo(x, y - r - 0.9 * s);
      c.lineTo(x - 0.32 * s, y - r - 1.35 * s);
      c.lineTo(x + 0.32 * s, y - r - 1.35 * s);
      c.closePath(); c.fill();
    }
    // тень
    c.beginPath(); c.ellipse(x + 0.12 * s, y + 0.18 * s, r, r * 0.85, 0, 0, Math.PI * 2);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill();
    // футболка
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = fill; c.fill();
    if (kit.striped && !isGK) {
      c.save(); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.clip();
      c.fillStyle = trim;
      const sw = r * 0.36;
      for (let i = -2; i <= 2; i += 2) c.fillRect(x + i * sw - sw / 2, y - r, sw, r * 2);
      c.restore();
    }
    c.lineWidth = Math.max(1.5, 0.1 * s);
    c.strokeStyle = trim; c.stroke();
    // номер
    c.fillStyle = luma(fill) > 0.55 ? '#111' : '#fff';
    c.font = '700 ' + (0.62 * s) + 'px system-ui, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(p.info.n, x, y + 0.03 * s);
    // имя
    const nm = (p.info.c ? '© ' : '') + p.info.name;
    c.font = '600 ' + (0.44 * s) + 'px system-ui, sans-serif';
    c.fillStyle = 'rgba(255,255,255,0.92)';
    c.strokeStyle = 'rgba(0,0,0,0.55)';
    c.lineWidth = Math.max(2, 0.14 * s);
    c.strokeText(nm, x, y + r + 0.55 * s);
    c.fillText(nm, x, y + r + 0.55 * s);
    // мяч у игрока — точка-индикатор
    if (match.ball.owner === p) {
      c.beginPath(); c.arc(x, y - r - 0.35 * s, 0.16 * s, 0, Math.PI * 2);
      c.fillStyle = '#fff'; c.fill();
    }
  }

  drawBall(c, b) {
    const s = this.scale;
    const x = this.px(b.x), y = this.py(b.y);
    // тень
    c.beginPath(); c.ellipse(x + 0.1 * s, y + 0.12 * s, 0.3 * s, 0.22 * s, 0, 0, Math.PI * 2);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fill();
    // мяч (выше — если в воздухе)
    const lift = b.z * 0.55 * s;
    const r = 0.3 * s * (1 + b.z * 0.06);
    c.beginPath(); c.arc(x, y - lift, r, 0, Math.PI * 2);
    c.fillStyle = '#ffffff'; c.fill();
    c.lineWidth = 1; c.strokeStyle = '#333'; c.stroke();
    // пятиугольник-намёк
    c.beginPath(); c.arc(x - r * 0.25, y - lift - r * 0.15, r * 0.3, 0, Math.PI * 2);
    c.fillStyle = '#333'; c.fill();
  }
}

function clamp2(v, a, b) { return v < a ? a : v > b ? b : v; }
function luma(hex) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!m) return 0;
  return (parseInt(m[1], 16) * 0.299 + parseInt(m[2], 16) * 0.587 + parseInt(m[3], 16) * 0.114) / 255;
}

window.Renderer = Renderer;
