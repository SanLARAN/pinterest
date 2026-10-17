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
    ['утро: птицы', () => { for (let i = 0; i < 6; i++) setTimeout(() => audio.bird(), i * 450); }],
    ['стемнело', () => { audio.startAmbience(); audio.dusk(); }],
    ['генератор: запуск', () => audio.genStart(...at(4, 2, 0.6))],
    ['генератор: шнур / искра / стук', () => { audio.cordPull(...at(2, 1, 0.6)); setTimeout(() => audio.spark(...at(2, 1, 0.7)), 900); setTimeout(() => audio.clank(...at(2, 1, 0.6), 1), 1700); }],
    ['рация генератора', () => audio.beacon(...at(40, -25, 1.1))],
    ['тело нашлось (мухи)', () => { audio.discover(); const f = audio.flies(...at(2, 0.5, 0.3)); setTimeout(() => f && f.stop(), 4000); }],
    ['Наблюдатель: суставы + появление', () => { for (let i = 0; i < 5; i++) setTimeout(() => audio.crack(...at(6 - i, 3, 1.5), 0.7), i * 420); setTimeout(() => audio.watcherSting(), 2300); }],
    ['Ревун: вдох и вой', () => { audio.howlerInhale(...at(25, -12, 1.8)); setTimeout(() => audio.howlerHowl(...at(25, -12, 2.2)), 1800); }],
    ['Ревун: рявк', () => audio.howlerBark(...at(9, 3, 1.8))],
    ['дверь: открыть / закрыть', () => { audio.doorCreak(...at(2.5, 1, 1.2), 0.62, 1, 0.42); setTimeout(() => audio.doorCreak(...at(2.5, 1, 1.2), 0.42, 1.12, 0.42), 1400); setTimeout(() => audio.doorShut(...at(2.5, 1, 1.1), 0.7), 1850); }],
    ['дверь: сама открывается', () => audio.doorCreak(...at(4, -2, 1.2), 1.9, 0.78, 0.55)],
    ['дверь: выбивают', () => { audio.doorBash(...at(3, 0.5, 1.1)); setTimeout(() => audio.doorBash(...at(3, 0.5, 1.1)), 560); setTimeout(() => audio.doorBash(...at(3, 0.5, 1.1), true), 1120); }],
    ['ракетница: выстрел и горение', () => { audio.flareShot(...at(0.5, 0, 0), true); setTimeout(() => audio.flarePop(...at(30, 6, 30)), 1500); setTimeout(() => audio.flareHiss(...at(30, 6, 29), 4), 1550); }],
    ['палочка: сломать, бросить, подобрать', () => { audio.glowCrack(0, 0, 0, true); setTimeout(() => audio.throwWhoosh(), 1300); setTimeout(() => audio.glowLand(...at(8, 1, -1.4), 0.9), 1900); setTimeout(() => audio.glowPick(), 3200); }],
    ['друг: пульс (ровный / слабый / нет)', () => { audio.pulseFelt(1); setTimeout(() => audio.pulseFelt(0.3), 2800); setTimeout(() => audio.pulseFelt(0), 4800); }],
    ['друг: поднять, положить на койку', () => { audio.bodyLift(0, 0, 0, true); setTimeout(() => audio.bodyDrop(...at(1.2, 0.3, -0.8), true), 1600); }],
    ['койка: вернуть к жизни', () => { for (let i = 0; i < 6; i++) setTimeout(() => audio.cprPush(...at(1, 0.4, -0.9)), i * 550); setTimeout(() => audio.reviveGasp(...at(1, 0.4, -0.6)), 3500); }],
    ['лесхоз: сирена + ворота едут', () => { const s = audio.gateSiren(...at(18, -6, 1.2), 8.5); setTimeout(() => audio.gateMotor(...at(12, -3, 0.4), 7.5), 1600); setTimeout(() => audio.gateClunk(...at(12, 2, 0.4)), 9100); void s; }],
    ['лесхоз: сирена издалека', () => audio.gateFar(...[at(200, -80)[0], at(200, -80)[2]])],
    ['деталь: поднять (колесо / аккумулятор / карбюратор / канистра)', () => ['wheel', 'battery', 'carb', 'can'].forEach((k, i) => setTimeout(() => audio.partPick(0, 0, 0, k, true), i * 900))],
    ['деталь: упала (колесо / аккумулятор / карбюратор / канистра)', () => ['wheel', 'battery', 'carb', 'can'].forEach((k, i) => setTimeout(() => audio.partLand(...at(4, i - 1.5, -1.4), k, 0.8, k === 'wheel'), i * 900))],
    ['УАЗ: ставим детали', () => ['wheel', 'battery', 'carb', 'can'].forEach((k, i) => { for (let j = 0; j < 3; j++) setTimeout(() => audio.partWork(...at(1.5, 0.5, -0.6), k), i * 2200 + j * 600); setTimeout(() => audio.partFitted(...at(1.5, 0.5, -0.6), k), i * 2200 + 1900); })],
    ['УАЗ: стартер без аккумулятора / без бензина', () => { audio.uazCrank(...at(3, 1, 0.5), false); setTimeout(() => { const c = audio.uazCrank(...at(3, 1, 0.5), true); setTimeout(() => c && c.stop(), 2800); }, 1400); }],
    ['УАЗ: завёлся, газует, уехал', () => { const c = audio.uazCrank(...at(3, 1, 0.5), true); setTimeout(() => { if (c) c.stop(0.05); const e = audio.uazStart(...at(3, 1, 0.5)); if (!e) return; setTimeout(() => e.rev(0.6), 3200); setTimeout(() => e.rev(1), 4600); setTimeout(() => e.stop(2), 6500); }, 2100); }],
    ['УАЗ: дверь, капот, ворота на таран', () => { audio.carDoor(...at(1.5, 1, 0), true); setTimeout(() => audio.hoodSlam(...at(2.5, 0, 0)), 1100); setTimeout(() => audio.gateCrash(...at(6, 0, 0.5)), 2200); }],
    ['шоссе: машина мимо · аккорд', () => { audio.carPass(...at(60, -40, 0), 1, 22); setTimeout(() => audio.escapeChord(), 2500); }],
    ['шкафы: платяной / низкий / аптечка / шкафчик · гайки · патрон', () => { ['wardrobe', 'cupboard', 'firstaid', 'locker'].forEach((k, i) => setTimeout(() => audio.cabinetOpen(...at(1.6, i - 1.5, 0.9), k), i * 900)); setTimeout(() => audio.cabinetItem('nuts'), 3800); setTimeout(() => audio.cabinetItem('flare'), 4600); }],
    ['шкафандр: тикает и дышит', () => audio.shkafTell(...at(2, 0.5, 1))],
    ['шкафандр: схватил тебя + мясорубка + крик', () => { audio.shkafSpring(...at(0.6, 0, 1), true); const g = audio.shkafGrind(...at(0.6, 0, 0.9)); for (let i = 0; i < 3; i++) setTimeout(() => audio.humanScream(0, 0, 0, true, i / 2), 600 + i * 1700); setTimeout(() => g && g.stop(1), 5500); }],
    ['шкафандр: такт · попал · идеально · мимо', () => { for (let i = 0; i < 6; i++) setTimeout(() => audio.qteTick(), i * 740); setTimeout(() => audio.qteHit(false), 740); setTimeout(() => audio.qteHit(true), 1480); setTimeout(() => audio.qteMiss(), 2220); setTimeout(() => audio.grabHand(), 3000); }],
    ['шкафандр: рывок в такт / вразнобой', () => { audio.trapPull(...at(1.2, 0, 1), true); setTimeout(() => audio.trapPull(...at(1.2, 0, 1), false, true), 900); setTimeout(() => audio.trapPull(...at(1.2, 0, 1), false), 1700); }],
    ['шкафандр: вытащили', () => audio.trapRescue(...at(1.2, 0, 1))],
    ['шкафандр: не успели (друг / ты)', () => { audio.trapKill(...at(4, 2, 1), false); setTimeout(() => audio.trapKill(...at(0.5, 0, 1), true), 2600); }],
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
