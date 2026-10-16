// Hidden sound test: open the game with ?sfx to audition every scare without having to die.
// Spatial sounds are placed relative to where you're facing. Best with headphones.
export function mountSfxPanel(audio) {
  const el = document.createElement('div');
  el.id = 'sfxPanel';
  el.style.cssText = [
    'position:fixed', 'left:10px', 'top:10px', 'z-index:200', 'display:flex', 'flex-direction:column', 'gap:3px',
    'padding:10px', 'background:rgba(0,0,0,.82)', 'border:1px solid rgba(167,180,182,.18)', 'border-radius:2px',
    'font:11px "JetBrains Mono",monospace', 'color:#d6cdc0', 'max-height:calc(100vh - 20px)', 'overflow:auto',
  ].join(';');
  const head = document.createElement('div');
  head.innerHTML = '<b style="letter-spacing:.2em">ЗВУК · SFX</b><div style="opacity:.5;margin:2px 0 6px">в наушниках · headphones</div>';
  el.appendChild(head);

  const at = (fwd, lat = 0, up = 0) => {
    const L = audio.listener;
    const rx = -L.fz, rz = L.fx;
    return [L.x + L.fx * fwd + rx * lat, L.y + up, L.z + L.fz * fwd + rz * lat];
  };
  let tension = 0;
  const amb = (kind) => {
    audio.startAmbience();
    audio.setAmbience(0.9, tension);
    audio.ambientEvent(1, kind);
  };
  const items = [
    ['скример — смерть', () => audio.jumpscare(1)],
    ['скример — мягкий режим', () => audio.jumpscare(0.45)],
    ['визг — началась охота', () => audio.screech(...at(16, 6, 2), 1)],
    ['рык — оно услышало', () => audio.growl(...at(10, -4, 2), 0.8)],
    ['тишина + вдох, затем появление', () => { audio.preScare(0.9, 'inhale'); setTimeout(() => audio.sting(1), 900); }],
    ['давление, затем появление', () => { audio.preScare(1.0, 'pressure'); setTimeout(() => audio.sting(1), 1000); }],
    ['шёпот за спиной', () => { audio.preScare(1.4, 'silence'); setTimeout(() => audio.whisper(...at(-0.55, 0.3, 0)), 1400); }],
    ['треск ветки сзади', () => audio.branchSnap(...at(-6, 2, 1.2), 1, true)],
    ['бегун', () => audio.runnerPass(...at(11, -9.5, 0.4), ...at(11, 9.5, 0.4), 1.05)],
    ['принюхивается рядом', () => audio.sniff(...at(2.5, 1.5, 2.1), 0.6)],
    ['сердце', () => audio.heartbeat(0.8)],
    ['вдали: стук', () => amb('knocks')],
    ['вдали: крик', () => amb('scream')],
    ['вдали: шаги', () => amb('steps')],
    ['вдали: металл', () => amb('groan')],
    ['напряжение: 0', (b) => {
      tension = tension >= 1 ? 0 : tension + 0.5;
      audio.startAmbience();
      audio.setAmbience(0.9, tension);
      b.textContent = `напряжение: ${tension}`;
    }],
  ];
  for (const [label, fn] of items) {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'text-align:left;background:transparent;color:inherit;border:1px solid rgba(167,180,182,.2);padding:5px 8px;font:inherit;cursor:pointer;border-radius:2px';
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      audio.init();
      const go = () => fn(b);
      if (audio.ctx && audio.ctx.state !== 'running') audio.ctx.resume().then(go);
      else go();
    });
    el.appendChild(b);
  }
  document.body.appendChild(el);
}
