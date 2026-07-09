/* AI ФУТБОЛ — звук (Web Audio API, всё синтезируется, без файлов) */

window.GameAudio = (function () {
  let ctx = null;
  let enabled = true;
  let crowdGain = null;
  let crowdSrc = null;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function noiseBuffer(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      // коричневый шум — похож на гул трибун
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }

  function startCrowd() {
    if (!enabled || !ensureCtx() || crowdSrc) return;
    crowdSrc = ctx.createBufferSource();
    crowdSrc.buffer = noiseBuffer(4);
    crowdSrc.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 0.4;
    crowdGain = ctx.createGain();
    crowdGain.gain.value = 0.05;
    crowdSrc.connect(filter).connect(crowdGain).connect(ctx.destination);
    crowdSrc.start();
  }

  function stopCrowd() {
    if (crowdSrc) { try { crowdSrc.stop(); } catch (e) {} crowdSrc = null; crowdGain = null; }
  }

  function swellCrowd(peak, seconds) {
    if (!crowdGain || !ctx) return;
    const t = ctx.currentTime;
    crowdGain.gain.cancelScheduledValues(t);
    crowdGain.gain.setValueAtTime(crowdGain.gain.value, t);
    crowdGain.gain.linearRampToValueAtTime(peak, t + 0.15);
    crowdGain.gain.exponentialRampToValueAtTime(0.05, t + seconds);
  }

  function beep(freq, dur, type, vol, when) {
    const t = (when || ctx.currentTime);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function thump(vol) {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    const len = Math.floor(ctx.sampleRate * 0.07);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 350;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t);
  }

  return {
    setEnabled(v) { enabled = v; if (!v) stopCrowd(); },
    isEnabled() { return enabled; },
    matchStart() { if (!enabled || !ensureCtx()) return; startCrowd(); },
    matchEnd() { stopCrowd(); },
    whistle(n) {
      if (!enabled || !ensureCtx()) return;
      const count = n || 1;
      for (let i = 0; i < count; i++) {
        beep(2350, count === 1 ? 0.5 : 0.22, 'square', 0.09, ctx.currentTime + i * 0.3);
        beep(2900, count === 1 ? 0.5 : 0.22, 'square', 0.05, ctx.currentTime + i * 0.3);
      }
    },
    kick() { if (!enabled || !ensureCtx()) return; thump(0.35); },
    shot() { if (!enabled || !ensureCtx()) return; thump(0.65); swellCrowd(0.14, 1.2); },
    goal() {
      if (!enabled || !ensureCtx()) return;
      swellCrowd(0.45, 4.5);
      beep(2350, 0.9, 'square', 0.09);
    },
    save() { if (!enabled || !ensureCtx()) return; swellCrowd(0.2, 1.5); },
    click() { if (!enabled || !ensureCtx()) return; beep(900, 0.06, 'sine', 0.1); }
  };
})();
