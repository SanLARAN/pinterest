// ============================================================
// MIC — the echolocation input. Your voice IS the sonar:
//   quiet tongue click / hum  -> echo pulse
//   scream                    -> everything hears you
// Raw dynamics only: AGC, noise suppression and echo cancellation are OFF,
// and the mic is never routed to the speakers.
// ============================================================
import { clamp, damp, lerp } from '../core/util.js';

export const MIC_STATE = { OFF: 'off', ASK: 'ask', ON: 'on', DENIED: 'denied', ERROR: 'error' };

export class MicInput {
  constructor() {
    this.state = MIC_STATE.OFF;
    this.level = 0;
    this.smooth = 0;
    this.peak = 0;
    this.floor = 0.012;
    this.voiceTh = 0.055;
    this.screamTh = 0.26;
    this.norm = 0;
    this.onset = false;
    this.onsetStrength = 0;
    this.screaming = false;
    this.screamLevel = 0;
    this.voicedT = 0;
    this.refractory = 0;
    this.screamHold = 0;
    this.autoCalibrated = false;
    this.calib = null;
    this.errMsg = '';
    this.hasMic = false;
  }

  async enable(audioCtx) {
    if (this.state === MIC_STATE.ON) return true;
    this.state = MIC_STATE.ASK;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no-getusermedia');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
        video: false,
      });
      this.stream = stream;
      this.ctx = audioCtx;
      this.src = audioCtx.createMediaStreamSource(stream);
      this.analyser = audioCtx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0;
      this.buf = new Uint8Array(this.analyser.fftSize);
      this.src.connect(this.analyser);            // dead end: never reaches the speakers
      this.state = MIC_STATE.ON;
      this.hasMic = true;
      this.calibrateFloor(1.6);
      return true;
    } catch (e) {
      this.state = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? MIC_STATE.DENIED : MIC_STATE.ERROR;
      this.errMsg = (e && e.name) || 'error';
      console.warn('[mic]', e);
      return false;
    }
  }

  disable() {
    if (this.stream) for (const t of this.stream.getTracks()) t.stop();
    if (this.src) try { this.src.disconnect(); } catch (e) {}
    this.stream = null; this.src = null; this.analyser = null;
    this.state = MIC_STATE.OFF;
    this.level = 0; this.smooth = 0; this.norm = 0;
  }

  /** Guided 3-step calibration. step: 0 silence, 1 voice, 2 scream. */
  startCalibration(step = 0) {
    this.calib = { step, t: 0, dur: step === 0 ? 2.2 : 2.6, min: 1e9, max: 0, done: false };
  }
  get calibrating() { return !!this.calib && !this.calib.done; }

  update(dt) {
    this.onset = false;
    this.onsetStrength = 0;
    if (this.state !== MIC_STATE.ON || !this.analyser) {
      this.level = damp(this.level, 0, 12, dt);
      this.norm = 0;
      this.screaming = false;
      return;
    }
    this.analyser.getByteTimeDomainData(this.buf);
    let sum = 0, peak = 0;
    const b = this.buf;
    for (let i = 0; i < b.length; i += 2) {
      const v = (b[i] - 128) / 128;
      sum += v * v;
      const a = v < 0 ? -v : v;
      if (a > peak) peak = a;
    }
    const rms = Math.sqrt(sum / (b.length / 2));
    this.level = rms;
    this.peak = Math.max(this.peak * 0.92, peak);
    this.smooth = damp(this.smooth, rms, 26, dt);

    // adaptive noise floor (only while quiet)
    if (rms < this.floor * 2.2) this.floor = lerp(this.floor, Math.max(rms, 0.0015), clamp(dt * 1.6, 0, 0.08));
    this.floor = clamp(this.floor, 0.0012, 0.08);
    if (!this.autoCalibrated && this.floorT === undefined) this.floorT = 0;
    if (!this.autoCalibrated) {
      this.floorT += dt;
      if (this.floorT > 2.4) {
        this.autoCalibrated = true;
        this.voiceTh = Math.max(this.floor * 3.4, 0.038);
        this.screamTh = Math.max(this.floor * 9.5, 0.19);
      }
    }

    this.norm = clamp(this.smooth / (this.screamTh * 1.15), 0, 1.25);

    // calibration capture
    if (this.calib) {
      const c = this.calib;
      c.t += dt;
      if (c.step === 0) c.min = Math.min(c.min, rms);
      else c.max = Math.max(c.max, c.step === 1 ? rms : peak);
      if (c.t >= c.dur) {
        c.done = true;
        if (c.step === 0) { this.floor = clamp(c.min === 1e9 ? 0.01 : c.min * 1.25, 0.0015, 0.06); this.floorT = 99; this.autoCalibrated = false; }
        else if (c.step === 1) { this.voiceTh = clamp(Math.max(c.max * 0.55, this.floor * 2.6), this.floor * 1.8, 0.22); }
        else if (c.step === 2) { this.screamTh = clamp(Math.max(c.max * 0.62, this.voiceTh * 2.6), this.voiceTh * 2.2, 0.7); }
        this.autoCalibrated = true;
        const done = this.calib;
        this.calib = null;
        if (this.onCalibStep) this.onCalibStep(done.step, done);
      }
    }

    // ---- onset / voiced detection ----
    this.refractory = Math.max(0, this.refractory - dt);
    const voiced = this.smooth > this.voiceTh;
    if (voiced) {
      this.voicedT += dt;
      // a sharp transient (tongue click) fires immediately
      const transient = this.smooth - this.prev > 0.018;
      if (this.refractory <= 0 && (transient || this.voicedT > 0.42)) {
        this.onset = true;
        this.onsetStrength = clamp((this.smooth - this.voiceTh) / Math.max(this.screamTh - this.voiceTh, 1e-4), 0.12, 1);
        this.refractory = 0.44;
        this.voicedT = 0;
      }
    } else {
      this.voicedT = Math.max(0, this.voicedT - dt * 2.4);
    }
    this.prev = damp(this.prev ?? 0, this.smooth, voiced ? 4 : 20, dt);

    // ---- scream detection (debounced) ----
    if (this.smooth > this.screamTh || this.peak > this.screamTh * 1.18) {
      this.screamHold += dt;
      if (this.screamHold > 0.07 && !this.screaming) {
        this.screaming = true;
        this.screamLevel = clamp(this.smooth / this.screamTh, 0.8, 2);
      }
    } else {
      this.screamHold = Math.max(0, this.screamHold - dt * 2);
      if (this.screamHold <= 0) this.screaming = false;
    }
    if (this.screaming && this.onScream) { /* consumed by main via flags */ }
  }

  /** consume the one-shot scream flag */
  takeScream() {
    if (!this.screaming || this._screamConsumed) return 0;
    this._screamConsumed = true;
    return this.screamLevel;
  }
  resetScreamLatch() { if (!this.screaming) this._screamConsumed = false; }
}
