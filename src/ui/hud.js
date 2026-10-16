// ============================================================
// HUD — sonar radar, compass, meters, toasts, objectives, notes.
// All DOM writes are cached so we never thrash layout at 60fps.
// ============================================================
import { clamp, compass, dist2, fmtNum, fmtTime, lerp, TAU } from '../core/util.js';

const $ = (id) => document.getElementById(id);

export class HUD {
  constructor(game, i18n) {
    this.game = game;
    this.i18n = i18n;
    this.el = {
      hud: $('hud'), clock: $('hudClock'), phase: $('hudPhase'),
      nightWrap: $('hudNightWrap'), nightBar: $('hudNightBar'), night: $('hudNight'),
      objective: $('hudObjective'), toasts: $('hudToastWrap'),
      radar: $('radar'), nerve: $('hudNerve'), stamina: $('hudStamina'), echo: $('hudEcho'),
      items: $('hudItems'), micBox: $('micBox'), micLabel: $('micLabel'), micState: $('micState'),
      micNeedle: $('micNeedle'), micLevel: $('micLevel'), micHint: $('micHint'),
      silence: $('hudSilence'), silenceT: $('hudSilenceT'), score: $('hudScore'), gens: $('hudGens'),
      pingCd: $('hudPingCd'), reticle: $('reticle'), noiseRing: $('noiseRing'),
      interact: $('hudInteract'), danger: $('hudDanger'), hint: $('hudHint'),
      compass: $('hudCompass'), touch: $('touch'),
      objList: $('objList'), noteList: $('noteList'), notes: $('notes'),
      staminaMeter: $('hudStamina')?.parentElement,
    };
    this.blips = [];
    this.waveRings = [];
    this.sweep = 0;
    this.last = {};
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.setupRadar();
    this.setupCompass();
    this.range = 132;
    this.dangerT = 0;
    this.hintT = 0;
    this.interactBar = null;
  }

  setupRadar() {
    const c = this.el.radar;
    const size = 240;
    c.width = size * this.dpr; c.height = size * this.dpr;
    this.rctx = c.getContext('2d');
    this.rctx.scale(this.dpr, this.dpr);
    this.rsize = size;
  }
  setupCompass() {
    const host = this.el.compass;
    if (!host) return;
    host.innerHTML = '';
    const c = document.createElement('canvas');
    c.width = 620 * this.dpr; c.height = 34 * this.dpr;
    c.style.width = '620px'; c.style.height = '34px';
    c.style.maxWidth = '60vw';
    host.appendChild(c);
    host.style.display = 'block';
    this.cctx = c.getContext('2d');
    this.cctx.scale(this.dpr, this.dpr);
    this.csize = { w: 620, h: 34 };
  }

  show(on) { this.el.hud.classList.toggle('hidden', !on); }
  setTouch(on) { if (this.el.touch) this.el.touch.classList.toggle('hidden', !on); }

  // ------------------------------------------------------------------ events
  addReturns(returns, wave) {
    for (const r of returns) {
      if (r.kind === 'tree' && this.blips.length > 210) continue;
      this.blips.push({
        x: r.x, z: r.z, kind: r.kind,
        life: r.kind === 'tree' ? 4.2 : 8.5, max: r.kind === 'tree' ? 4.2 : 8.5,
        s: clamp(r.gain, 0.1, 1.4),
      });
    }
    if (this.blips.length > 420) this.blips.splice(0, this.blips.length - 420);
    this.waveRings.push({ r: 0, max: wave.maxR, speed: wave.speed, life: 1, loud: wave.loud, kind: wave.kind });
    if (this.waveRings.length > 5) this.waveRings.shift();
  }

  toast(text, kind = '', dur = 3) {
    const d = document.createElement('div');
    d.className = 'toast ' + kind;
    d.textContent = text;
    this.el.toasts.appendChild(d);
    setTimeout(() => d.remove(), dur * 1000);
    while (this.el.toasts.children.length > 4) this.el.toasts.firstChild.remove();
  }

  hint(text, dur = 5) {
    this.el.hint.textContent = text;
    this.el.hint.classList.add('on');
    this.hintT = dur;
  }

  noisePulse(loud) {
    const r = this.el.noiseRing;
    r.classList.remove('go', 'loud');
    void r.offsetWidth;
    r.classList.add('go');
    if (loud) r.classList.add('loud');
  }

  pingPulse() {
    const r = this.el.reticle;
    r.classList.remove('ping');
    void r.offsetWidth;
    r.classList.add('ping');
    setTimeout(() => r.classList.remove('ping'), 260);
  }

  setNerve(n, max = 3) {
    const pips = this.el.nerve.children;
    for (let i = 0; i < pips.length; i++) {
      const off = i >= n;
      if (pips[i].classList.contains('off') !== off) {
        pips[i].classList.toggle('off', off);
        if (!off && n < max) { pips[i].classList.remove('hit'); void pips[i].offsetWidth; pips[i].classList.add('hit'); }
      }
    }
  }
  bumpScore() {
    this.el.score.classList.remove('bump'); void this.el.score.offsetWidth; this.el.score.classList.add('bump');
  }

  renderObjectives() {
    const g = this.game, t = (k) => this.i18n.t(k);
    const list = [];
    list.push({ done: false, hot: true, txt: `${t('obj_survive')} — ${fmtTime(Math.max(0, g.nightT))}` });
    list.push({
      done: g.stats.gens >= g.world.gens.length, hot: g.stats.gens > 0,
      txt: `${t('obj_gens')}: ${g.stats.gens}/${g.world.gens.length}`,
    });
    const need = g.world.gens.length - g.stats.gens;
    list.push({
      done: need <= 0, hot: true,
      txt: `${t('obj_fuses')}: ${g.local ? g.local.fuses : 0} ${t('fuses_left')} (${need} ${t('obj_gens').toLowerCase()})`,
    });
    list.push({ done: g.notesFound.length >= g.world.corpses.length, txt: `${t('obj_notes')}: ${g.notesFound.length}/${g.world.corpses.length}` });
    // notes add their own objectives
    for (const n of g.notesFound) {
      const note = n.note;
      list.push({ done: false, txt: (this.i18n.lang === 'en' ? note.objEn : note.obj), sub: true });
    }
    this.el.objList.innerHTML = list.map((o) =>
      `<li class="${o.done ? 'done' : ''} ${o.hot && !o.done ? 'hot' : ''}"><span class="st">${o.done ? '■' : o.sub ? '»' : '□'}</span><span>${o.txt}</span></li>`).join('');
  }
  objKey(n) { return 'note' + n.id; }

  renderNotes() {
    const en = this.i18n.lang === 'en';
    if (!this.game.notesFound.length) {
      this.el.noteList.innerHTML = `<div class="hs-empty">${en ? 'Nothing yet. The forest keeps its dead.' : 'Пока ничего. Лес хранит своих мертвецов.'}</div>`;
      return;
    }
    this.el.noteList.innerHTML = this.game.notesFound.slice().reverse().map(({ note }) => `
      <div class="note">
        <div class="who">${en ? note.whoEn : note.who}</div>
        <div class="txt">«${en ? note.textEn : note.text}»</div>
        <div class="hint">▸ ${en ? note.hintEn : note.hint}</div>
      </div>`).join('');
  }

  setNotesVisible(v) {
    this.el.notes.classList.toggle('hidden', !v);
    if (v) { this.renderObjectives(); this.renderNotes(); }
  }

  // ------------------------------------------------------------------ frame
  update(dt, player, mic, opts = {}) {
    const g = this.game, e = this.el, t = this.i18n;
    const L = this.last;

    // clock & phase
    const clockMin = 6 * 60 + 12 + (g.phase === 'day' ? g.phaseT : g.phase === 'dusk' ? 62 + g.phaseT : 0);
    let clockLabel;
    if (g.phase === 'day') clockLabel = t.t('phase_morning');
    else if (g.phase === 'dusk') clockLabel = t.t('phase_dusk');
    else if (g.phase === 'dawn') clockLabel = t.t('phase_dawn');
    else clockLabel = t.t('phase_night');
    const totalMin = g.phase === 'night' || g.phase === 'dawn' ? 21 * 60 - (g.nightT / g.nightLen) * (21 - 6.2) * 60 : clockMin;
    const hh = Math.floor(totalMin / 60) % 24, mm = Math.floor(totalMin % 60);
    const cs = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    if (L.clock !== cs) { e.clock.textContent = cs; L.clock = cs; }
    if (L.cl !== clockLabel) { e.phase.textContent = clockLabel; L.cl = clockLabel; }
    const nightOn = g.phase === 'night' || g.phase === 'dawn' || g.phase === 'dead';
    e.nightWrap.classList.toggle('on', nightOn);
    if (nightOn) {
      const k = clamp(g.nightT / g.nightLen, 0, 1);
      e.nightBar.style.transform = `scaleX(${k})`;
      const nt = fmtTime(g.nightT);
      if (L.nt !== nt) { e.night.textContent = nt; L.nt = nt; }
      e.night.classList.toggle('low', g.nightT < 90);
    }

    // objective line
    const objTxt = `${t.t('generators')} ${g.stats.gens}/${g.world.gens.length} · ${t.t('obj_fuses').split(' ')[0]} ${player.fuses}`;
    if (L.obj !== objTxt) { e.objective.innerHTML = `<span class="obj-key">${objTxt}</span>`; L.obj = objTxt; }

    // nerve / stamina / echo
    this.setNerve(player.nerve, player.maxNerve);
    e.stamina.style.transform = `scaleX(${clamp(player.stamina, 0, 1)})`;
    e.stamina.parentElement.classList.toggle('low', player.stamina < 0.25);
    const echoK = 1 - clamp(player.pingCd / 0.95, 0, 1);
    e.echo.style.transform = `scaleX(${echoK})`;
    e.pingCd.firstElementChild.style.transform = `scaleX(${echoK})`;

    const items = [player.items.earplugs > 0 ? `👂${player.items.earplugs}` : '', player.adrenaline > 0 ? `✚${player.adrenaline.toFixed(0)}s` : ''].filter(Boolean).join(' ');
    if (L.items !== items) { e.items.textContent = items; L.items = items; }

    // mic meter
    if (mic && mic.state === 'on') {
      const n = clamp(mic.norm, 0, 1.25);
      e.micLevel.style.width = (n / 1.25 * 100).toFixed(1) + '%';
      e.micLevel.className = 'mic-level' + (mic.smooth > mic.screamTh ? ' scream' : mic.smooth > mic.voiceTh ? ' hot' : '');
      e.micState.textContent = mic.screaming ? '!!!' : 'ON';
      e.micState.className = 'mic-state';
      e.micLabel.textContent = t.t('mic_live');
      e.micHint.textContent = t.t('mic_hint');
      const vpos = clamp(mic.voiceTh / (mic.screamTh * 1.15), 0, 1) * 100;
      const spos = clamp(1 / 1.15, 0, 1) * 100;
      if (L.vpos !== vpos.toFixed(0)) { e.micNeedle.style.left = vpos.toFixed(0) + '%'; L.vpos = vpos.toFixed(0); }
    } else {
      const pseudo = clamp(player.noiseNow, 0, 1.6) / 1.6;
      e.micLevel.style.width = (pseudo * 100).toFixed(1) + '%';
      e.micLevel.className = 'mic-level';
      e.micState.textContent = 'OFF';
      e.micState.className = 'mic-state off';
      e.micLabel.textContent = t.t('mic_keys');
      e.micHint.textContent = t.t('mic_hint_keys');
    }

    // silence streak
    const st = player.silenceT;
    const stTxt = fmtTime(st);
    if (L.st !== stTxt) { e.silenceT.textContent = stTxt; L.st = stTxt; }
    e.silence.classList.toggle('broken', st < 1.5);

    // score / gens
    const sc = Math.round(g.score);
    if (L.sc !== sc) { e.score.textContent = fmtNum(sc); L.sc = sc; }
    const gs = `${g.stats.gens}/${g.world.gens.length}`;
    if (L.gs !== gs) { e.gens.textContent = gs; L.gs = gs; }

    // interact prompt
    const it = g.interact;
    if (it && player.alive && g.phase !== 'day' ? true : it) {
      let label = '';
      if (it.kind === 'corpse') label = t.t('interact_corpse');
      else if (it.kind === 'gen') label = player.fuses > 0 ? t.t('interact_gen') : t.t('interact_gen_nofuse');
      else if (it.kind === 'stash') label = t.t('interact_stash');
      const canUse = !(it.kind === 'gen' && player.fuses <= 0);
      const txt = `<kbd>${opts.touch ? t.t('t_use') : 'E'}</kbd>${label}${canUse ? '' : ''}`;
      if (L.it !== txt) { e.interact.innerHTML = txt + '<i class="bar"></i>'; L.it = txt; this.interactBar = e.interact.querySelector('.bar'); }
      e.interact.classList.add('on');
      if (this.interactBar) {
        const h = player.holding;
        const p = h && h.kind === it.kind && h.id === it.id ? clamp(h.t / h.need, 0, 1) : 0;
        this.interactBar.style.width = (p * 100).toFixed(0) + '%';
      }
    } else {
      e.interact.classList.remove('on');
      L.it = null;
    }

    // danger readout
    let danger = '', dcls = '';
    let closest = 1e9, closestM = null;
    for (const m of g.monsters) {
      if (!m.alive || m.state === 'spawn' || m.state === 'flee') continue;
      const d = dist2(player.x, player.z, m.x, m.z);
      if (d < closest) { closest = d; closestM = m; }
    }
    if (closestM) {
      if (closestM.type === 'weeper' && closestM.wailT > 0.2) { danger = t.t('danger_wail'); dcls = 'on'; }
      else if (closestM.type === 'tall' && closest < 60) { danger = t.t('danger_tall'); dcls = 'on'; }
      else if (closest < 14) { danger = t.t('danger_near'); dcls = 'on'; }
      else if (closestM.state === 'hunt' && closest < 60) { danger = t.t('danger_hunt'); dcls = 'on'; }
    }
    if (L.danger !== danger) { e.danger.textContent = danger; e.danger.className = 'danger ' + dcls; L.danger = danger; }
    e.reticle.classList.toggle('danger', !!danger);

    // hint auto-hide
    if (this.hintT > 0) { this.hintT -= dt; if (this.hintT <= 0) e.hint.classList.remove('on'); }

    this.drawRadar(dt, player, g);
    this.drawCompass(player, g);
  }

  drawRadar(dt, player, g) {
    const c = this.rctx, S = this.rsize, R = S / 2 - 8, cx = S / 2, cy = S / 2;
    c.clearRect(0, 0, S, S);
    // dial
    const bg = c.createRadialGradient(cx, cy, 0, cx, cy, R);
    bg.addColorStop(0, 'rgba(6,26,24,0.92)');
    bg.addColorStop(0.75, 'rgba(3,14,14,0.9)');
    bg.addColorStop(1, 'rgba(1,6,7,0.95)');
    c.fillStyle = bg;
    c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();

    const yaw = player.yaw;
    const toRadar = (x, z) => {
      const dx = x - player.x, dz = z - player.z;
      // rotate so player forward (-sin yaw, -cos yaw) points up
      const rx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
      const rz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
      return { x: cx + (rx / this.range) * R, y: cy + (rz / this.range) * R, d: Math.hypot(dx, dz) };
    };

    // rings + cross
    c.strokeStyle = 'rgba(125,255,216,0.16)'; c.lineWidth = 1;
    for (let i = 1; i <= 3; i++) { c.beginPath(); c.arc(cx, cy, (R * i) / 3, 0, TAU); c.stroke(); }
    c.beginPath(); c.moveTo(cx, cy - R); c.lineTo(cx, cy + R); c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.stroke();
    c.strokeStyle = 'rgba(125,255,216,0.3)';
    c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();

    // view cone
    c.fillStyle = 'rgba(125,255,216,0.07)';
    c.beginPath(); c.moveTo(cx, cy);
    c.arc(cx, cy, R, -Math.PI / 2 - 0.65, -Math.PI / 2 + 0.65);
    c.closePath(); c.fill();

    // sweep
    this.sweep = (this.sweep + dt * 1.25) % TAU;
    c.save();
    c.translate(cx, cy); c.rotate(this.sweep);
    const grad = c.createLinearGradient(0, 0, R, 0);
    grad.addColorStop(0, 'rgba(125,255,216,0.28)');
    grad.addColorStop(1, 'rgba(125,255,216,0)');
    c.fillStyle = grad;
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, -0.32, 0); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(125,255,216,0.65)'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(R, 0); c.stroke();
    c.restore();

    // echo wave rings
    for (let i = this.waveRings.length - 1; i >= 0; i--) {
      const w = this.waveRings[i];
      w.r += w.speed * dt; w.life -= dt * 0.42;
      if (w.r > this.range || w.life <= 0) { this.waveRings.splice(i, 1); continue; }
      const rr = (w.r / this.range) * R;
      c.strokeStyle = w.kind === 'scream' ? `rgba(255,43,69,${0.5 * w.life})` : w.kind === 'gen' ? `rgba(255,180,84,${0.6 * w.life})` : `rgba(125,255,216,${0.42 * w.life})`;
      c.lineWidth = 1.6 * w.life + 0.4;
      c.beginPath(); c.arc(cx, cy, rr, 0, TAU); c.stroke();
    }

    // the Tall One eats the radar too
    for (const m of g.monsters) {
      if (m.type !== 'tall' || !m.alive) continue;
      const p = toRadar(m.x, m.z);
      if (p.d > this.range * 1.4) continue;
      const rr = (m.def.echoDamp / this.range) * R;
      const dg = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr);
      dg.addColorStop(0, 'rgba(0,0,0,0.95)');
      dg.addColorStop(0.6, 'rgba(0,0,0,0.6)');
      dg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = dg;
      c.beginPath(); c.arc(p.x, p.y, rr, 0, TAU); c.fill();
    }

    // blips
    for (let i = this.blips.length - 1; i >= 0; i--) {
      const b = this.blips[i];
      b.life -= dt;
      if (b.life <= 0) { this.blips.splice(i, 1); continue; }
      const p = toRadar(b.x, b.z);
      if (p.d > this.range) { b.life = Math.min(b.life, 0.4); continue; }
      const ang = Math.atan2(p.y - cy, p.x - cx);
      let d = (ang - this.sweep) % TAU; if (d < 0) d += TAU;
      const sweepBoost = d < 0.55 ? (1 - d / 0.55) : 0;
      const a = clamp(b.life / b.max, 0, 1) * (0.32 + sweepBoost * 0.9) * clamp(b.s, 0.2, 1.3);
      let col = '125,255,216';
      if (b.kind === 'monster') col = '255,43,69';
      else if (b.kind === 'gen' || b.kind === 'gen_on') col = '255,180,84';
      else if (b.kind === 'corpse') col = '233,229,214';
      else if (b.kind === 'player') col = '89,230,255';
      else if (b.kind === 'stone') col = '190,210,220';
      const sz = b.kind === 'tree' ? 1.1 : b.kind === 'monster' ? 2.6 : 1.9;
      c.fillStyle = `rgba(${col},${a.toFixed(3)})`;
      c.beginPath(); c.arc(p.x, p.y, sz * (1 + sweepBoost * 0.8), 0, TAU); c.fill();
      if (sweepBoost > 0.5 && b.kind !== 'tree') {
        c.fillStyle = `rgba(${col},${(a * 0.28).toFixed(3)})`;
        c.beginPath(); c.arc(p.x, p.y, sz * 3.4, 0, TAU); c.fill();
      }
    }

    // permanent markers for what you already know
    const known = g.known;
    const mark = (x, z, col, sym, alpha = 0.85) => {
      const p = toRadar(x, z);
      if (p.d > this.range) return;
      c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 1.2; c.globalAlpha = alpha;
      c.beginPath(); c.arc(p.x, p.y, 3.4, 0, TAU); c.stroke();
      c.font = '7px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(sym, p.x, p.y - 7);
      c.globalAlpha = 1;
    };
    g.world.gens.forEach((gen, i) => { if (known.gens.has(gen.id)) mark(gen.x, gen.z, gen.fixed ? 'rgba(125,255,216,0.9)' : 'rgba(255,180,84,0.95)', String(i + 1)); });
    for (const cc of g.world.corpses) if (known.corpses.has(cc.id) && !cc.searched) mark(cc.x, cc.z, 'rgba(233,229,214,0.8)', '✝');
    if (known.circle) mark(g.world.circle.x, g.world.circle.z, 'rgba(190,210,220,0.8)', '◎');
    if (known.cabin) mark(g.world.cabin.x, g.world.cabin.z, 'rgba(255,180,84,0.7)', '⌂');
    mark(g.world.mast.x, g.world.mast.z, 'rgba(255,80,60,0.75)', '▲');

    // other players
    for (const p of g.players) {
      if (p === player) continue;
      const q = toRadar(p.x, p.z);
      if (q.d > this.range) continue;
      c.fillStyle = 'rgba(89,230,255,0.95)';
      c.beginPath(); c.arc(q.x, q.y, 3, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(89,230,255,0.5)';
      c.beginPath(); c.arc(q.x, q.y, 6 + Math.sin(g.t * 4) * 1.5, 0, TAU); c.stroke();
    }

    // lake outline
    const lk = g.world.lake;
    const lp = toRadar(lk.x, lk.z);
    if (lp.d < this.range + lk.r) {
      c.strokeStyle = 'rgba(89,180,255,0.22)'; c.lineWidth = 1;
      c.beginPath(); c.arc(lp.x, lp.y, (lk.r / this.range) * R, 0, TAU); c.stroke();
    }

    // north indicator + player arrow
    c.fillStyle = 'rgba(233,229,214,0.75)';
    c.font = '9px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const nx = cx + Math.sin(yaw) * (R - 7), ny = cy - Math.cos(yaw) * (R - 7);
    c.fillText(this.i18n.lang === 'en' ? 'N' : 'С', nx, ny);
    c.fillStyle = 'rgba(233,229,214,0.95)';
    c.beginPath(); c.moveTo(cx, cy - 5); c.lineTo(cx + 3.6, cy + 4.5); c.lineTo(cx, cy + 2.4); c.lineTo(cx - 3.6, cy + 4.5); c.closePath(); c.fill();

    // range label
    c.fillStyle = 'rgba(125,255,216,0.5)';
    c.font = '8px monospace'; c.textAlign = 'left';
    c.fillText(`${this.range}м`, 6, S - 6);
  }

  drawCompass(player, g) {
    const c = this.cctx;
    if (!c) return;
    const W = this.csize.w, H = this.csize.h;
    c.clearRect(0, 0, W, H);
    const half = 1.35;      // ±77°
    const marks = [];
    g.world.gens.forEach((gen, i) => { if (g.known.gens.has(gen.id)) marks.push({ x: gen.x, z: gen.z, col: gen.fixed ? '#7dffd8' : '#ffb454', sym: 'G' + (i + 1), big: true }); });
    for (const cc of g.world.corpses) if (g.known.corpses.has(cc.id) && !cc.searched) marks.push({ x: cc.x, z: cc.z, col: '#e9e5d6', sym: '✝' });
    if (g.known.circle) marks.push({ x: g.world.circle.x, z: g.world.circle.z, col: '#bed2dc', sym: '◎' });
    if (g.known.cabin) marks.push({ x: g.world.cabin.x, z: g.world.cabin.z, col: '#ffb454', sym: '⌂' });
    marks.push({ x: g.world.mast.x, z: g.world.mast.z, col: '#ff5a3c', sym: '▲' });
    for (const p of g.players) if (p !== player) marks.push({ x: p.x, z: p.z, col: '#59e6ff', sym: '♥' });

    c.textAlign = 'center'; c.textBaseline = 'middle';
    const cyw = Math.cos(player.yaw), syw = Math.sin(player.yaw);
    for (const m of marks) {
      const dx = m.x - player.x, dz = m.z - player.z;
      const rx = dx * cyw - dz * syw;
      const rz = dx * syw + dz * cyw;
      const bear = Math.atan2(rx, -rz);
      const d = Math.hypot(dx, dz);
      if (Math.abs(bear) > half) continue;
      const px = W / 2 + (bear / half) * (W / 2 - 12);
      const a = clamp(1 - d / 320, 0.25, 1);
      c.globalAlpha = a;
      c.fillStyle = m.col;
      c.beginPath(); c.moveTo(px, H - 6); c.lineTo(px - 5, H - 15); c.lineTo(px + 5, H - 15); c.closePath(); c.fill();
      c.font = '10px monospace';
      c.fillText(`${m.sym} ${Math.round(d)}`, px, 10);
      c.globalAlpha = 1;
    }
    // centre tick
    c.strokeStyle = 'rgba(233,229,214,0.35)';
    c.beginPath(); c.moveTo(W / 2, H - 4); c.lineTo(W / 2, H - 12); c.stroke();
  }
}
