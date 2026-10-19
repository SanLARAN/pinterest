// Microphone input: loudness metering, adaptive noise floor, onset detection,
// in-game voice echo, and raw PCM for complete phrases learned by the Shade.
import { settings } from '../core/storage.js';
import { clamp, lerp } from '../core/rng.js';
import { CFG } from '../core/config.js';

const WORKLET_SRC = `
class HushRecorder extends AudioWorkletProcessor {
  constructor() { super(); this.buf = new Float32Array(2048); this.n = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      for (let i = 0; i < ch.length; i++) {
        this.buf[this.n++] = ch[i];
        if (this.n === 2048) { this.port.postMessage(this.buf.slice(0)); this.n = 0; }
      }
    }
    return true;
  }
}
registerProcessor('hush-recorder', HushRecorder);
`;

export class Mic {
  constructor() {
    this.state = 'off'; // off | pending | on | denied | blocked | unsupported
    this.db = -100;
    this.floor = -58;
    this.trig = -40;
    this.talkDb = -28;
    this.screamDb = -13; // the scream line (the meter reads 1 here)
    this.loud = 0; // 0..1 (0 = below trigger)
    this.meter = 0; // smoothed 0..1.2 for UI
    this.peakLoud = 0;
    this.active = false;
    this.pending = false;
    this.windowMax = 0;
    this.onsetT = 0;
    this.sinceEmit = 0;
    this.releaseT = 0;
    this.screamHeld = 0;
    this.calib = [];
    this.calibrated = false;
    this.onPCM = null; // the current run, never the menu or the garage
    this.enabledEcho = settings.voiceEcho;
    this.lostFlag = false;
  }

  static inIframe() {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }

  async start(engine) {
    if (this.state === 'on' || this.state === 'pending') return this.state === 'on';
    this.engine = engine;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.isSecureContext) {
      this.state = 'unsupported';
      return false;
    }
    try {
      const pol = document.permissionsPolicy || document.featurePolicy;
      if (pol && pol.allowsFeature && !pol.allowsFeature('microphone')) {
        this.state = 'blocked';
        return false;
      }
    } catch { /* ignore */ }
    this.state = 'pending';
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
      });
    } catch (e) {
      this.state = Mic.inIframe() && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'blocked' : 'denied';
      return false;
    }
    const ctx = engine.ctx;
    this.stream = stream;
    this.src = ctx.createMediaStreamSource(stream);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0;
    this.buf = new Float32Array(this.analyser.fftSize);
    this.src.connect(this.analyser);
    const track = stream.getAudioTracks()[0];
    const aec = track && track.getSettings ? track.getSettings().echoCancellation : false;
    this.leak = aec ? -26 : -11; // how much of our own output we assume reaches the mic

    // --- voice echo: gated multi-tap delay into the forest reverb ---
    this.gate = ctx.createGain();
    this.gate.gain.value = 0;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 220;
    this.src.connect(this.gate);
    this.gate.connect(hp);
    this.echoOut = ctx.createGain();
    this.echoOut.gain.value = this.enabledEcho ? 1 : 0;
    this.echoOut.connect(engine.echoBus);
    const taps = [
      [0.32, 3200, -0.55, 0.36],
      [0.66, 2100, 0.6, 0.24],
      [1.08, 1300, 0.05, 0.15],
      [1.55, 900, -0.3, 0.08],
    ];
    for (const [dt, lp, pan, g] of taps) {
      const d = ctx.createDelay(2);
      d.delayTime.value = dt;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = lp;
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      const gg = ctx.createGain();
      gg.gain.value = g;
      hp.connect(d).connect(f).connect(p).connect(gg).connect(this.echoOut);
    }
    const rs = ctx.createGain();
    rs.gain.value = 0.35;
    hp.connect(rs);
    rs.connect(this.echoOut);
    const rsRev = ctx.createGain();
    rsRev.gain.value = 0.5;
    this.echoOut.connect(rsRev);
    rsRev.connect(engine.revSend);

    // --- raw worklet capture: complete Shade phrases and explicit tape recording ---
    try {
      if (ctx.audioWorklet) {
        const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: 'application/javascript' }));
        try { await ctx.audioWorklet.addModule(url); } finally { URL.revokeObjectURL(url); }
        this.rec = new AudioWorkletNode(ctx, 'hush-recorder', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
        this.rec.port.onmessage = (ev) => this._push(ev.data);
        const mute = ctx.createGain();
        mute.gain.value = 0;
        this.src.connect(this.rec);
        this.rec.connect(mute).connect(ctx.destination);
      }
    } catch {
      this.rec = null;
    }

    if (track) {
      track.onended = () => {
        this.state = 'off';
        this.lostFlag = true;
      };
    }
    this.calib = [];
    this.calibrated = false;
    this.state = 'on';
    return true;
  }

  stop() {
    if (this.onPCM) this.onPCM(null, 0);
    this.cancelTape();
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    try {
      this.src && this.src.disconnect();
      this.rec && this.rec.disconnect();
    } catch { /* */ }
    this.stream = null;
    this.state = 'off';
    this.loud = 0;
    this.meter = 0;
    this.active = false;
  }

  setEcho(on) {
    this.enabledEcho = on;
    if (this.echoOut) this.echoOut.gain.setTargetAtTime(on ? 1 : 0, this.engine.now, 0.05);
  }

  recalibrate() {
    this.calib = [];
    this.calibrated = false;
  }

  // Explicitly requested with RMB on the equipped recorder, not the automatic Shade phrases. Only RAM until the recorder is placed.
  beginTape(seconds, done) {
    if (this.state !== 'on' || !this.rec || !this.engine?.ready) return false;
    this.tapeCapture = { samples: new Float32Array(Math.floor(this.engine.ctx.sampleRate * Math.min(2, seconds))), n: 0, done };
    return true;
  }
  cancelTape() { this.tapeCapture = null; }

  _push(chunk) {
    if (this.onPCM) this.onPCM(chunk, this.engine.ctx.sampleRate);
    const cap = this.tapeCapture;
    if (cap) {
      const n = Math.min(chunk.length, cap.samples.length - cap.n);
      cap.samples.set(chunk.subarray(0, n), cap.n);
      cap.n += n;
      if (cap.n >= cap.samples.length) {
        this.tapeCapture = null;
        cap.done(cap.samples, this.engine.ctx.sampleRate);
      }
    }
  }

  // the input level right now (dBFS), with no side effects: the 15-second setup listens through this
  readDb() {
    if (this.state !== 'on' || !this.analyser) return -100;
    this.analyser.getFloatTimeDomainData(this.buf);
    let sum = 0;
    for (let i = 0; i < this.buf.length; i++) sum += this.buf[i] * this.buf[i];
    return 20 * Math.log10(Math.sqrt(sum / this.buf.length) + 1e-9);
  }

  // a fresh calibration (settings.micCal): start from its quiet, not from a guess
  applyCalibration() {
    const cal = settings.micCal;
    if (!cal || !Number.isFinite(cal.floor)) return;
    this.floor = clamp(cal.floor, -88, -38);
    this.calibrated = true;
    this.calib = [];
  }

  // per-frame update; returns events
  update(dt, outDb) {
    const ev = { pulse: 0, loud: 0, scream: false };
    if (this.state !== 'on') {
      this.loud = 0;
      this.meter = Math.max(0, this.meter - dt * 3);
      return ev;
    }
    this.analyser.getFloatTimeDomainData(this.buf);
    let sum = 0;
    for (let i = 0; i < this.buf.length; i++) sum += this.buf[i] * this.buf[i];
    const rms = Math.sqrt(sum / this.buf.length);
    const db = 20 * Math.log10(rms + 1e-9);
    this.db = db;

    if (!this.calibrated) {
      this.calib.push(db);
      if (this.calib.length >= 50) {
        const s = [...this.calib].sort((a, b) => a - b);
        this.floor = clamp(s[Math.floor(s.length * 0.5)], -85, -40);
        this.calibrated = true;
      }
      this.loud = 0;
      this.meter = 0;
      return ev;
    }

    const sens = settings.micSens;
    // the 15-second setup (ui/miccal.js), if you did it: your own voice and shout set the lines
    const cal = settings.micCal && Number.isFinite(settings.micCal.talk) ? settings.micCal : null;
    // a sound starts to count once it stands well clear of the room — far enough that a quiet word to
    // the friend next to you stays under it (calibrated: and your normal voice above it)
    let margin = lerp(27, 11, sens);
    if (cal && Number.isFinite(cal.floor)) margin = clamp(Math.min(margin, cal.talk - cal.floor - 4), 8, 30);
    let trig = clamp(this.floor + margin, -62, -24);
    const gate = outDb + this.leak;
    const selfPlaying = this.selfUntil && performance.now() < this.selfUntil;
    if (selfPlaying) trig = Math.max(trig, -22);
    trig = Math.max(trig, gate);
    // how loud is loud is pinned to the signal itself, not to the room: a headset at your lips and a laptop
    // across the desk see the same voice ~10 dB apart, but nobody talks at the level of a shout.
    //   trig → talkDb: talking (up to loudness TALK) · talkDb → screamDb: raised voice up to the scream line
    //   (SCREAM) · 6 dB past it: everything you've got (1.0)
    let talkDb, screamDb;
    if (cal) {
      const shift = (0.55 - sens) * 12; // (the slider still nudges a calibrated mic, up to ±6 dB)
      talkDb = Math.max(trig + 5, cal.talk + 5 + shift);
      screamDb = Math.max(talkDb + 7, (Number.isFinite(cal.shout) ? cal.shout - 3 : cal.talk + 17) + shift);
    } else {
      talkDb = Math.max(trig + 5, -21 - 12 * sens);
      screamDb = Math.max(talkDb + 9, -6 - 12 * sens);
    }
    this.trig = trig;
    this.talkDb = talkDb;
    this.screamDb = screamDb;

    let loud = 0;
    if (db > trig) {
      if (db <= talkDb) loud = 0.02 + ((db - trig) / (talkDb - trig)) * (CFG.TALK - 0.02);
      else if (db <= screamDb) loud = CFG.TALK + ((db - talkDb) / (screamDb - talkDb)) * (CFG.SCREAM - CFG.TALK);
      else loud = Math.min(1, CFG.SCREAM + ((db - screamDb) / 6) * (1 - CFG.SCREAM));
    }

    // noise floor follows the room: falls fast, rises slowly (and only while quiet)
    // (talking under the trigger isn't the room: near-floor sounds pull it up, louder ones barely do)
    if (db < this.floor) this.floor += (db - this.floor) * Math.min(1, dt * 3);
    else if (loud === 0) this.floor += (db - this.floor) * Math.min(1, dt * (db < this.floor + margin * 0.5 ? 0.06 : 0.012));
    this.floor = clamp(this.floor, -88, -38);

    this.loud = loud;
    const target = db > this.floor ? clamp((db - this.floor) / (screamDb - this.floor), 0, 1.15) : 0;
    this.meter = target > this.meter ? target : Math.max(target, this.meter - dt * 1.6);
    if (loud > this.peakLoud) this.peakLoud = loud;

    // scream = sustained loudness in the red zone
    if (loud >= CFG.SCREAM) this.screamHeld += dt;
    else this.screamHeld = Math.max(0, this.screamHeld - dt * 2);
    ev.scream = this.screamHeld > 0.14;
    ev.loud = loud;

    // onset / sustained pulse emission
    if (loud > 0) {
      if (!this.active) {
        this.active = true;
        this.pending = true;
        this.onsetT = 0;
        this.windowMax = loud;
      }
      this.windowMax = Math.max(this.windowMax, loud);
      this.onsetT += dt;
      this.releaseT = 0;
      if (this.pending && this.onsetT >= 0.06) {
        ev.pulse = this.windowMax;
        this.pending = false;
        this.sinceEmit = 0;
        this.windowMax = 0;
      } else if (!this.pending) {
        this.sinceEmit += dt;
        if (this.sinceEmit >= 0.45) {
          ev.pulse = Math.max(this.windowMax, loud);
          this.sinceEmit = 0;
          this.windowMax = 0;
        }
      }
      if (this.gate) this.gate.gain.setTargetAtTime(1, this.engine.now, 0.01);
    } else if (this.active) {
      this.releaseT += dt;
      if (this.releaseT > 0.14) {
        if (this.pending && this.windowMax > 0) ev.pulse = this.windowMax;
        this.active = false;
        this.pending = false;
        if (this.gate) this.gate.gain.setTargetAtTime(0, this.engine.now, 0.06);
      }
    }
    return ev;
  }
}

export const mic = new Mic();
