// Teammates' names. Like everything else, a friend is only "visible" when an echo finds them: their
// name surfaces over the afterimage for a moment. While you peek (Tab / tap the top) every name shows,
// with the distance, so a scattered team can regroup.
import * as THREE from 'three';
import { t } from '../core/i18n.js';

const _v = new THREE.Vector3();

export class Mates {
  constructor(el) {
    this.el = el;
    this.items = new Map(); // id -> { div, key }
  }

  clear() {
    for (const it of this.items.values()) it.div.remove();
    this.items.clear();
  }

  update(game, camera, peek) {
    const seen = new Set();
    const W = innerWidth, H = innerHeight;
    for (const r of game.remotes.values()) {
      seen.add(r.id);
      let it = this.items.get(r.id);
      if (!it) {
        const div = document.createElement('div');
        div.className = 'mate';
        div.style.setProperty('--c', r.color);
        this.el.appendChild(div);
        it = { div, key: '', op: -1, tx: '' };
        this.items.set(r.id, it);
      }
      const spect = game.spectate && game.spectate.target === r;
      const since = game.time - r.revealT;
      let op = peek ? 0.95 : since < 2.4 ? 0.95 : since < 3.4 ? 0.95 * (3.4 - since) : 0;
      if (spect) op = 0;
      _v.set(r.x, r.y + (r.alive ? r.eyeCur + 0.45 : 0.6), r.z);
      _v.project(camera);
      if (_v.z > 1 || _v.z < -1 || Math.abs(_v.x) > 1.2 || Math.abs(_v.y) > 1.2) op = 0;
      const d = Math.hypot(r.x - camera.position.x, r.z - camera.position.z);
      const key = `${r.name}|${r.alive ? 1 : 0}|${peek ? Math.round(d) : -1}`;
      if (it.key !== key) {
        it.key = key;
        it.div.innerHTML = `${escapeHtml(r.alive ? r.name : `† ${r.name}`)}${peek ? `<small>${Math.round(d)} ${t('meters')}</small>` : ''}`;
        it.div.classList.toggle('dead', !r.alive);
      }
      // talking: the living by how loud they are out there; the dead only to the dead (you hear them, so you see it)
      const talk = op > 0 && (r.alive ? r.loud > 0.12 : !game.player.alive && game.audio.voiceLevel(r.id) > 0.3);
      it.div.classList.toggle('talk', talk);
      if (op > 0) {
        const tx = `translate(${((_v.x + 1) * 0.5 * W).toFixed(0)}px, ${((1 - _v.y) * 0.5 * H).toFixed(0)}px) translate(-50%, -100%)`;
        if (it.tx !== tx) {
          it.tx = tx;
          it.div.style.transform = tx;
        }
      }
      const o = op.toFixed(2);
      if (it.op !== o) {
        it.op = o;
        it.div.style.opacity = o;
      }
    }
    for (const [id, it] of this.items) {
      if (!seen.has(id)) {
        it.div.remove();
        this.items.delete(id);
      }
    }
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
