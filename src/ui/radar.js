// Optional sonar radar (Settings → Radar, off by default): rotates with the player, shows echo
// blips, live pulse rings and your noise radius. Drawn in the same ash palette as the forest.

export class Radar {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.blips = [];
    this.range = 62;
    this.sweep = 0;
    this.t = 0;
    this.noiseR = 0;
    this.resize();
  }

  resize() {
    const r = this.c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const s = Math.max(60, Math.round((r.width || 170) * dpr));
    if (this.c.width !== s) {
      this.c.width = s;
      this.c.height = s;
    }
    this.dpr = dpr;
  }

  clear() {
    this.blips.length = 0;
  }

  blip(x, z, type, hunting = false) {
    if (this.blips.length > 80) this.blips.shift();
    this.blips.push({ x, z, type, t: this.t, hunting });
  }

  // noise = how far you can be heard right now (m)
  draw(dt, px, pz, yaw, pulses, noise, scream) {
    this.t += dt;
    this.sweep += dt * 2.4;
    const ctx = this.ctx;
    const W = this.c.width;
    const R = W / 2 - 3 * this.dpr;
    const sc = R / this.range;
    ctx.clearRect(0, 0, W, W);
    ctx.save();
    ctx.translate(W / 2, W / 2);

    // disc
    const bg = ctx.createRadialGradient(0, 0, R * 0.1, 0, 0, R);
    bg.addColorStop(0, 'rgba(10,12,13,0.62)');
    bg.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = 'rgba(170,186,190,0.09)';
    ctx.lineWidth = 1 * this.dpr;
    for (const m of [15, 30, 45, 60]) {
      ctx.beginPath();
      ctx.arc(0, 0, m * sc, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-R, 0); ctx.lineTo(R, 0); ctx.moveTo(0, -R); ctx.lineTo(0, R);
    ctx.stroke();

    // sweep wedge
    const a0 = this.sweep % (Math.PI * 2);
    if (ctx.createConicGradient) {
      const g = ctx.createConicGradient(a0 - Math.PI * 0.5, 0, 0);
      g.addColorStop(0, 'rgba(170,186,190,0.0)');
      g.addColorStop(0.9, 'rgba(170,186,190,0.0)');
      g.addColorStop(1, 'rgba(170,186,190,0.1)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(190,200,204,0.22)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a0 - Math.PI * 0.5) * R, Math.sin(a0 - Math.PI * 0.5) * R);
    ctx.stroke();

    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const toScreen = (x, z) => {
      const dx = x - px, dz = z - pz;
      const right = dx * cy - dz * sy;
      const fwd = -dx * sy - dz * cy;
      return [right * sc, -fwd * sc];
    };

    // live pulse rings
    for (const s of pulses) {
      if (!s.active || s.curR >= s.radius) continue;
      const [x, y] = toScreen(s.x, s.z);
      const f = 1 - s.curR / s.radius;
      ctx.strokeStyle = s.kind === 'monster' ? `rgba(255,60,50,${0.7 * f})` : s.kind === 'stone' ? `rgba(230,245,255,${0.6 * f})` : `rgba(190,204,208,${0.6 * f})`;
      ctx.lineWidth = 1.5 * this.dpr;
      ctx.beginPath();
      ctx.arc(x, y, s.curR * sc, 0, Math.PI * 2);
      ctx.stroke();
    }

    // your noise radius (who can hear you right now)
    const targetR = noise > 0 ? noise : 0;
    this.noiseR = targetR > this.noiseR ? targetR : Math.max(0, this.noiseR - dt * 40);
    if (this.noiseR > 0.5) {
      ctx.fillStyle = scream ? 'rgba(255,40,40,0.16)' : 'rgba(255,170,90,0.08)';
      ctx.strokeStyle = scream ? 'rgba(255,60,60,0.9)' : 'rgba(255,180,100,0.55)';
      ctx.lineWidth = 1.5 * this.dpr;
      ctx.setLineDash([4 * this.dpr, 3 * this.dpr]);
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(this.noiseR, this.range * 1.2) * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // blips
    for (let i = this.blips.length - 1; i >= 0; i--) {
      const b = this.blips[i];
      const age = this.t - b.t;
      const life = b.type === 'monster' ? 4 : b.type === 'shard' || b.type === 'beacon' ? 6 : 3;
      if (age > life) {
        this.blips.splice(i, 1);
        continue;
      }
      const f = 1 - age / life;
      const [x, y] = toScreen(b.x, b.z);
      const d = Math.hypot(x, y);
      const edge = d > R - 6 * this.dpr;
      const k = edge ? (R - 6 * this.dpr) / d : 1;
      const X = x * k, Y = y * k;
      const pop = age < 0.15 ? 1 + (0.15 - age) * 6 : 1;
      if (b.type === 'monster') {
        const s = 5 * this.dpr * pop;
        ctx.fillStyle = `rgba(255,${b.hunting ? 30 : 60},${b.hunting ? 30 : 50},${f})`;
        ctx.shadowColor = 'rgba(255,40,40,0.9)';
        ctx.shadowBlur = 10 * this.dpr * f;
        ctx.beginPath();
        ctx.moveTo(X, Y - s); ctx.lineTo(X + s, Y); ctx.lineTo(X, Y + s); ctx.lineTo(X - s, Y);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        if (b.hunting && !edge) {
          ctx.strokeStyle = `rgba(255,60,60,${f})`;
          ctx.beginPath();
          ctx.arc(X, Y, s + 4 * this.dpr + Math.sin(this.t * 20) * this.dpr, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (b.type === 'shard') {
        ctx.fillStyle = `rgba(255,175,60,${f})`;
        ctx.shadowColor = 'rgba(255,170,50,0.9)';
        ctx.shadowBlur = 8 * this.dpr * f;
        ctx.beginPath();
        ctx.arc(X, Y, 3 * this.dpr * pop, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (b.type === 'beacon') {
        // a generator's radio / a body: an amber square
        const s = 3.5 * this.dpr * pop;
        ctx.strokeStyle = `rgba(255,185,90,${f})`;
        ctx.lineWidth = 1.5 * this.dpr;
        ctx.strokeRect(X - s, Y - s, s * 2, s * 2);
      } else if (b.type === 'mate') {
        // a teammate: a small cyan ring
        ctx.strokeStyle = `rgba(142,240,255,${f})`;
        ctx.shadowColor = 'rgba(142,240,255,0.8)';
        ctx.shadowBlur = 8 * this.dpr * f;
        ctx.lineWidth = 1.5 * this.dpr;
        ctx.beginPath();
        ctx.arc(X, Y, 3.5 * this.dpr * pop, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (b.type === 'stone') {
        ctx.strokeStyle = `rgba(230,245,255,${f})`;
        ctx.lineWidth = 1.5 * this.dpr;
        ctx.beginPath();
        ctx.arc(X, Y, (3 + age * 6) * this.dpr, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(200,210,220,${f * 0.9})`;
        ctx.font = `${11 * this.dpr}px JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', X, Y);
      }
    }
    ctx.restore(); // clip

    // rim + player marker
    ctx.strokeStyle = 'rgba(170,186,190,0.28)';
    ctx.lineWidth = 1.5 * this.dpr;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(220,214,204,0.85)';
    const s = 5 * this.dpr;
    ctx.beginPath();
    ctx.moveTo(0, -s * 1.3); ctx.lineTo(s, s); ctx.lineTo(0, s * 0.45); ctx.lineTo(-s, s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
