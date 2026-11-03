// The ballot's six candidates: who they are (RU / EN), how they would hunt, and their 3D plates — built with the
// game's own MeshBuilder and drawn by the atlas plate (src/ui/atlas3d.js), so they look like they already live in
// the forest. A model follows the atlas contract: { root, base, view, tick(S), key } (see src/ui/atlasModels.js).
import * as THREE from 'three';
import { MeshBuilder, KIND } from '../src/world/builder.js';
import { RNG, clamp, lerp, angleDiff } from '../src/core/rng.js';
import { buildSurvivor, poseSurvivor } from '../src/game/survivor.js';

export const MOBS = [
  {
    id: 'gluhar', rate: [5, 1, 4, 3],
    ru: {
      name: 'Глухарь', latin: 'Tetrao surdus', where: 'лес · ночь',
      pitch: 'Огромная птица на нижних ветках. Пока поёт — глохнет, и можно идти. Смолк — замри.',
      mech: [
        'Песня идёт коленами: щелчки, потом «точение». На «точении» он не слышит ничего — это твои три секунды.',
        'Между коленами слушает лучше всех в лесу. Шаг не вовремя — и он падает с ветки прямо на звук.',
        'Взлёт хлопает, как выстрел: на этот звук сбегается всё, что рядом.',
      ],
      quote: 'Пел — шёл. Замолчал — стой. Так я и дошёл до генератора.',
    },
    en: {
      name: 'The Capercaillie', latin: 'Tetrao surdus', where: 'forest · night',
      pitch: 'A huge bird on the low branches. While it sings it goes deaf, and you can walk. When it stops — freeze.',
      mech: [
        'The song comes in phrases: clicks, then the «whetting». During the whetting it hears nothing — those are your three seconds.',
        'Between phrases it hears better than anything in the forest. One step at the wrong time and it drops from the branch onto the sound.',
        'Its take-off claps like a gunshot: everything nearby comes running to that sound.',
      ],
      quote: 'It sang — I walked. It stopped — I stood. That is how I reached the generator.',
    },
  },
  {
    id: 'kukushka', rate: [2, 2, 1, 5],
    ru: {
      name: 'Кукушка', latin: 'Cuculus horologii', where: 'лес · сосны у троп',
      pitch: 'Часы-ходики, прибитые к сосне. Кукует — считает. Досчитает — к месту, где ты стоял, кто-то придёт.',
      mech: [
        'Сколько раз прокуковала — столько минут у тебя есть. Счёт слышно на всю округу.',
        'Остановить счёт можно только ломом: вскрыть дверцу. Громко.',
        'Приходят к тому, кто последним стоял под часами. Не стой под ними, когда она замолчит.',
      ],
      quote: 'Спросил, сколько мне осталось. Она ответила.',
    },
    en: {
      name: 'The Cuckoo', latin: 'Cuculus horologii', where: 'forest · pines by the paths',
      pitch: 'A cuckoo clock nailed to a pine. It calls — it counts. When it is done counting, something comes to the spot where you stood.',
      mech: [
        'As many calls as it makes, that many minutes you have. The count carries across the whole clearing.',
        'Only a crowbar stops the count: pry the little door open. Loudly.',
        'It comes for whoever stood under the clock last. Do not be under it when it falls silent.',
      ],
      quote: 'I asked how long I had left. It answered.',
    },
  },
  {
    id: 'gribnica', rate: [0, 0, 0, 3],
    ru: {
      name: 'Грибница', latin: 'Mycelium resonans', where: 'лес · у генераторов',
      pitch: 'Кольца бледных грибов. Внутри кольца любой звук втрое громче. За ночь кольцо растёт.',
      mech: [
        'Шаг в кольце звучит как бег, шёпот — как крик. Обходи по краю.',
        'Кольца ширятся каждую ночь смены и к четвёртой смыкаются у генераторов.',
        'Ракета выжигает кольцо до утра. Но ракета — это тоже звук.',
      ],
      quote: 'Наступил в круг — и услышал собственное сердце.',
    },
    en: {
      name: 'The Mycelium', latin: 'Mycelium resonans', where: 'forest · by the generators',
      pitch: 'Rings of pale mushrooms. Inside a ring every sound is three times louder. Each night the ring grows.',
      mech: [
        'A step in the ring sounds like running, a whisper like a scream. Go round the edge.',
        'The rings widen every night of the shift, and by the fourth they close around the generators.',
        'A flare burns a ring out until morning. But a flare is a sound too.',
      ],
      quote: 'I stepped into the circle and heard my own heart.',
    },
  },
  {
    id: 'shatun', rate: [1, 5, 4, 5],
    ru: {
      name: 'Шатун', latin: 'Ursus insomnis', where: 'лес · бурелом',
      pitch: 'Медведь, которого разбудили до весны. Не слушает — чует. Тут всё решает ветер.',
      mech: [
        'Идёт по запаху: если ветер тянет от тебя к нему, найдёт и в полной тишине.',
        'Ветер меняется каждые пару минут. Куда — покажет дым от костра и от генераторов.',
        'Ни свет, ни крик его не уводят. Только запах крови — свежей, чужой.',
      ],
      quote: 'Тишина его не берёт. Встал по ветру — живой.',
    },
    en: {
      name: 'The Rogue Bear', latin: 'Ursus insomnis', where: 'forest · windfall',
      pitch: 'A bear woken before spring. It does not listen — it smells. Here the wind decides everything.',
      mech: [
        'It follows your scent: if the wind blows from you to it, it finds you in total silence.',
        'The wind turns every couple of minutes. The smoke from the camp fire and the generators shows where.',
        'Neither light nor a scream leads it off. Only the smell of blood — fresh, and someone else\u2019s.',
      ],
      quote: 'Silence does not stop it. Stand downwind and live.',
    },
  },
  {
    id: 'poludnica', rate: [4, 3, 2, 4],
    ru: {
      name: 'Полудница', latin: 'Meridiana falcata', where: 'поля · утро',
      pitch: 'Высокая женщина в белом посреди поля. Приходит утром, когда все уверены, что днём безопасно.',
      mech: [
        'Появляется только утром и только на открытом месте. Тень деревьев — единственное укрытие.',
        'Шепчет в рацию вопрос. Ответишь вслух — отпустит. Промолчишь — серп.',
        'В эхе её не видно: только на свету и только краем глаза.',
      ],
      quote: 'Утро — не отдых. Утро — её время.',
    },
    en: {
      name: 'The Noon Witch', latin: 'Meridiana falcata', where: 'fields · morning',
      pitch: 'A tall woman in white in the middle of a field. She comes in the morning, when everyone is sure daylight is safe.',
      mech: [
        'She appears only in the morning and only in the open. The shade of the trees is the only cover.',
        'She whispers a question over the radio. Answer out loud and she lets you go. Stay silent — the sickle.',
        'The echo does not show her: only daylight does, and only from the corner of your eye.',
      ],
      quote: 'Morning is not a rest. Morning is her hour.',
    },
  },
  {
    id: 'pyaty', rate: [4, 4, 3, 5],
    ru: {
      name: 'Пятый', latin: 'Quintus ignotus', where: 'кооператив · везде',
      pitch: 'Вас четверо. Иногда в рации пятый голос, а в эхе — пятый силуэт. Голова у него смотрит назад.',
      mech: [
        'Ходит с отрядом как свой: в эхе — такой же выживший, как все.',
        'Говорит в рацию фразами, которые кто-то из вас уже говорил этой ночью.',
        'Выдаёт его только голова: она всегда повёрнута к тебе. Даже когда он уходит.',
      ],
      quote: 'Пересчитались у костра. Пятеро. Пришли вчетвером.',
    },
    en: {
      name: 'The Fifth', latin: 'Quintus ignotus', where: 'co-op · anywhere',
      pitch: 'There are four of you. Sometimes there is a fifth voice on the radio and a fifth outline in the echo. Its head faces backwards.',
      mech: [
        'It walks with the team as one of you: in the echo, a survivor like the rest.',
        'On the radio it speaks in phrases one of you already said tonight.',
        'Only the head gives it away: it always faces you. Even as it walks away.',
      ],
      quote: 'We counted ourselves at the fire. Five. Four of us had come.',
    },
  },
];

export function mobText(id, lang) {
  const m = MOBS.find((x) => x.id === id);
  return m ? m[lang] || m.ru : null;
}

// ---------------- the plates ----------------
function geometryOf(b) {
  const a = b.toArrays();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a.pos, 3));
  g.setAttribute('data', new THREE.BufferAttribute(a.dat, 4, true));
  g.computeBoundingSphere();
  return g;
}
function mesh(mat, build, tris = 1024) {
  const b = new MeshBuilder(tris);
  b.identity();
  build(b);
  const m = new THREE.Mesh(geometryOf(b), mat);
  m.frustumCulled = false;
  return m;
}
function node(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}
const ease = (k) => k * k * (3 - 2 * k);
const k01 = (a, b, v) => ease(clamp((v - a) / (b - a), 0, 1));

// Глухарь: a capercaillie on a pine's low branch, in profile; it sings in phrases (clicks, then the whetting with the
// beak open and the tail fanned) and listens in between with its head turned to you
function gluhar(mat) {
  const r = new RNG(41);
  const rnd = () => r.next();
  const root = new THREE.Group();
  root.add(mesh(mat, (b) => {
    b.place(-1.05, -0.1, -0.15);
    b.cylinder(6, 0.27, 0.17, 3.4, KIND.BARK, { capTop: true });
    b.identity();
    b.limb([-0.95, 1.32, -0.12], [1.25, 1.47, 0.05], 0.11, 0.045, KIND.BARK, 5);
    b.limb([0.55, 1.44, 0], [0.95, 1.92, 0.22], 0.035, 0.012, KIND.BARK);
    b.limb([-0.4, 1.36, -0.06], [-0.2, 1.15, 0.35], 0.03, 0.01, KIND.BARK);
    for (const [x, y, z, rz, s] of [[1.25, 1.48, 0.05, -1.35, 1], [0.95, 1.92, 0.22, -0.4, 0.7], [-1.0, 3.25, -0.15, 0, 1.4]]) {
      b.place(x, y, z, 0, 0.4, rz, s);
      b.cone(7, 0.32, 0.75, KIND.LEAF);
    }
  }, 2048));
  const bird = node(root, 0.12, 1.5, 0);
  // body, breast, feet
  bird.add(mesh(mat, (b) => {
    b.place(0, 0.36, 0, 0, 0, 0.18, 1.45, 0.92, 0.82);
    b.rock(0.3, rnd, KIND.ROCK, 0.22, 0.85);
    b.place(0.25, 0.42, 0, 0, 0, 0.3, 1, 1.1, 0.95);
    b.rock(0.17, rnd, KIND.LEAF, 0.25, 0.9);
    b.identity();
    for (const z of [-0.07, 0.07]) {
      b.limb([0.02, 0.2, z], [0.04, 0.0, z], 0.022, 0.016, KIND.BONE);
      b.limb([0.04, 0.01, z], [0.14, 0.0, z * 1.4], 0.01, 0.006, KIND.BONE);
      b.limb([0.04, 0.01, z], [-0.06, 0.0, z * 1.2], 0.01, 0.006, KIND.BONE);
    }
  }));
  const wings = [-1, 1].map((s) => {
    const w = node(bird, -0.02, 0.44, s * 0.2);
    w.add(mesh(mat, (b) => {
      b.place(-0.12, -0.05, 0, s * 0.25, 0, 0.35);
      b.taper(0.46, 0.06, 0.22, 0.03, -0.26, KIND.ROCK);
    }));
    return w;
  });
  // the tail: a fan of feathers, white-tipped, that stands up when it displays
  const tail = node(bird, -0.36, 0.38, 0);
  tail.add(mesh(mat, (b) => {
    b.identity();
    for (let i = 0; i < 13; i++) {
      const a = -1.35 + (2.7 * i) / 12;
      const L = 0.5 + 0.06 * Math.cos(a * 1.4);
      const tip = [-0.07, Math.cos(a) * L, Math.sin(a) * L];
      const side = [0, -Math.sin(a) * 0.045, Math.cos(a) * 0.045];
      const p0 = [0, 0, 0], p1 = [tip[0] + side[0], tip[1] + side[1], tip[2] + side[2]], p2 = [tip[0] - side[0], tip[1] - side[1], tip[2] - side[2]];
      b.triN(p0, p1, p2, [1, 0, 0], KIND.ROCK);
      b.triN(p0, p2, p1, [-1, 0, 0], KIND.ROCK);
      const q = [tip[0] * 0.86, tip[1] * 0.86, tip[2] * 0.86];
      b.triN(q, p1, p2, [1, 0, 0], KIND.BONE);
    }
  }));
  const neck = node(bird, 0.3, 0.5, 0);
  neck.add(mesh(mat, (b) => {
    b.identity();
    b.limb([0, 0, 0], [0.1, 0.3, 0], 0.1, 0.075, KIND.ROCK, 6);
    // the «beard»: shaggy feathers under the throat
    for (let i = 0; i < 5; i++) b.limb([0.1, 0.2 - i * 0.02, (i - 2) * 0.02], [0.14, 0.08 - i * 0.015, (i - 2) * 0.035], 0.018, 0.004, KIND.ROCK);
  }));
  const head = node(neck, 0.1, 0.32, 0);
  head.add(mesh(mat, (b) => {
    b.place(0, 0, 0, 0, 0, 0, 1.2, 1, 0.9);
    b.rock(0.1, rnd, KIND.ROCK, 0.2, 0.9);
    b.place(0.1, -0.01, 0, 0, 0, -Math.PI / 2 - 0.2);
    b.cone(5, 0.042, 0.12, KIND.BONE);
    for (const z of [-0.075, 0.075]) {
      b.place(0.035, 0.055, z, 0, 0, 0.2, 1.4, 0.5, 0.6);
      b.octa(0.035, 0.02, KIND.FLESH); // the red brow
      b.place(0.05, 0.025, z * 1.1);
      b.octa(0.014, 0.014, KIND.EYE);
    }
  }));
  const jaw = node(head, 0.09, -0.04, 0);
  jaw.add(mesh(mat, (b) => {
    b.place(0, 0, 0, 0, 0, -Math.PI / 2 - 0.05);
    b.cone(5, 0.03, 0.1, KIND.BONE);
  }));
  const m = {
    // framed on the bird in profile along its branch: the whole pine made it a speck (the trunk is a perch, no more)
    root, base: 0.3, view: { yaw: 1.2, pitch: 0.1, fit: 0.55, focus: [0.1, 1.65, 0] },
    ph: 0, attend: 0,
    tick(S) {
      const T = S.t % 7.2;
      const whet = T > 2.8 && T < 5.2;
      const clicks = T < 2.8;
      const react = S.react < 1.6;
      // the song: clicks (the head jerks up on each), the whetting (beak open, tail full, a shiver), then silence
      const click = clicks ? Math.max(0, Math.sin(T * Math.PI * (2.2 + T * 0.9))) ** 6 : 0;
      neck.rotation.z = lerp(neck.rotation.z, whet ? 0.35 : clicks ? 0.18 + click * 0.12 : -0.08, 1 - Math.exp(-S.dt * 8));
      jaw.rotation.z = whet ? -0.32 - 0.05 * Math.sin(S.t * 40) : -click * 0.18;
      bird.position.y = 1.5 + (whet ? Math.sin(S.t * 63) * 0.004 : 0);
      const fan = whet || react ? 1 : clicks ? 0.85 : 0.55;
      tail.scale.z = lerp(tail.scale.z, fan, 1 - Math.exp(-S.dt * 5));
      tail.rotation.z = lerp(tail.rotation.z, whet ? 0.05 : -0.35, 1 - Math.exp(-S.dt * 4));
      // in the silence it listens — and looks at whoever is there
      const listen = !clicks && !whet;
      m.attend = lerp(m.attend, listen || react ? clamp(angleDiff(Math.PI / 2, S.camAz), -1.2, 1.2) : 0, 1 - Math.exp(-S.dt * 4));
      head.rotation.y = m.attend;
      for (const [i, w] of wings.entries()) {
        const s = i ? 1 : -1;
        w.rotation.x = react ? s * (0.5 + 0.6 * Math.sin(S.t * 32)) : whet ? s * 0.12 : 0;
      }
    },
  };
  return m;
}

// Кукушка: a cuckoo clock on a pine; every few seconds its door opens and the bird counts; tally marks on the bark
function kukushka(mat) {
  const root = new THREE.Group();
  root.add(mesh(mat, (b) => {
    b.place(0, -0.1, -0.42);
    b.cylinder(7, 0.4, 0.3, 5.2, KIND.BARK, { capTop: true });
    b.identity();
    b.limb([0.2, 3.1, -0.4], [1.2, 3.7, -0.2], 0.08, 0.03, KIND.BARK);
    b.limb([-0.25, 3.9, -0.45], [-1.0, 4.6, -0.3], 0.07, 0.02, KIND.BARK);
    b.limb([0.3, 1.1, -0.35], [0.62, 1.2, -0.12], 0.05, 0.02, KIND.BARK);
    // tally marks scratched into the bark: four and a strike, three times
    for (let g = 0; g < 3; g++) {
      const y0 = 0.85 + g * 0.24;
      for (let i = 0; i < 4; i++) {
        b.place(-0.2 + i * 0.035, y0, -0.04, 0, 0, 0);
        b.box(0.012, 0.16, 0.012, KIND.EFFIGY);
      }
      b.place(-0.15, y0, -0.03, 0, 0, 1.0);
      b.box(0.012, 0.2, 0.012, KIND.EFFIGY);
    }
    // the clock's case, its gable roof, carved leaves and a bird on the ridge
    b.place(0, 2.0, -0.04);
    b.box(0.46, 0.5, 0.2, KIND.WOOD);
    const H = 2.25, R = 2.47;
    b.identity();
    b.quadN([-0.33, H, 0.14], [0.0, R, 0.14], [0.0, R, -0.18], [-0.33, H, -0.18], [-0.6, 1, 0], KIND.WOOD);
    b.quadN([0.0, R, 0.14], [0.33, H, 0.14], [0.33, H, -0.18], [0.0, R, -0.18], [0.6, 1, 0], KIND.WOOD);
    for (let i = 0; i < 5; i++) {
      const a = -0.9 + i * 0.45;
      b.place(Math.sin(a) * 0.2, 2.3 + Math.cos(a) * 0.08, 0.15, 0, 0, a, 0.6);
      b.cone(4, 0.05, 0.16, KIND.LEAF);
    }
    b.place(0, R + 0.04, 0, 0, 0.3, 0, 0.6);
    b.rock(0.06, () => 0.5, KIND.ROCK, 0.1, 0.8);
    // the dial: a disc, twelve ticks
    b.place(0, 1.93, 0.06, Math.PI / 2, 0, 0);
    b.cylinder(14, 0.15, 0.15, 0.02, KIND.METAL, { capTop: true });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      b.place(Math.sin(a) * 0.125, 1.93 + Math.cos(a) * 0.125, 0.085, 0, 0, -a);
      b.box(0.008, i % 3 ? 0.02 : 0.035, 0.006, KIND.BONE);
    }
    // the door's frame
    b.place(0, 2.13, 0.06);
    b.box(0.15, 0.15, 0.02, KIND.WOOD, { skip: 'z' });
  }, 3072));
  const hands = [0.09, 0.13].map((len) => {
    const h = node(root, 0, 1.93, 0.09);
    h.add(mesh(mat, (b) => { b.identity(); b.limb([0, -0.02, 0], [0, len, 0], 0.009, 0.004, KIND.BONE, 4); }));
    return h;
  });
  const door = node(root, -0.065, 2.13, 0.075);
  door.add(mesh(mat, (b) => { b.place(0.065, 0, 0); b.box(0.13, 0.13, 0.012, KIND.WOOD); }));
  const birdy = node(root, 0, 2.13, -0.02);
  birdy.add(mesh(mat, (b) => {
    b.place(0, 0, 0, 0, 0, 0, 0.8, 0.8, 1.3);
    b.rock(0.05, () => 0.4, KIND.ROCK, 0.1, 0.9);
    b.place(0, 0.005, 0.07, Math.PI / 2, 0, 0);
    b.cone(4, 0.014, 0.045, KIND.BONE);
    for (const x of [-0.022, 0.022]) { b.place(x, 0.02, 0.045); b.octa(0.008, 0.008, KIND.EYE); }
    b.identity();
    b.limb([0, -0.01, -0.06], [0, -0.01, -0.16], 0.012, 0.012, KIND.METAL); // its spring
  }));
  const pend = node(root, 0, 1.76, 0.1);
  pend.add(mesh(mat, (b) => {
    b.identity();
    b.limb([0, 0, 0], [0, -0.5, 0], 0.006, 0.006, KIND.METAL);
    b.place(0, -0.52, 0.0, Math.PI / 2, 0, 0);
    b.cylinder(10, 0.055, 0.055, 0.012, KIND.METAL, { capTop: true });
  }));
  const weights = [-0.11, 0.11].map((x) => {
    const w = node(root, x, 1.75, 0.04);
    const chain = mesh(mat, (b) => { b.identity(); b.limb([0, 0, 0], [0, -1, 0], 0.004, 0.004, KIND.METAL); });
    w.add(chain);
    const cone = node(w, 0, -1, 0);
    cone.add(mesh(mat, (b) => {
      b.place(0, 0, 0, Math.PI, 0, 0);
      b.cone(7, 0.05, 0.24, KIND.WOOD);
      b.place(0, -0.06, 0, 0, 0.5, 0, 1, 0.6, 1);
      b.rock(0.05, () => 0.5, KIND.WOOD, 0.3, 1);
    }));
    return { w, chain, cone };
  });
  let last = -1;
  const m = {
    root, base: 0.3, view: { yaw: 0.42, pitch: 0.06, fit: 0.36, focus: [0, 1.92, 0] },
    poses: [() => { birdy.position.z = 0.14; door.rotation.y = -1.7; }, () => { birdy.position.z = -0.02; door.rotation.y = 0; }],
    tick(S) {
      // the count: every 5 s (and at once when its voice is played) the door opens and it calls twice
      const period = 5;
      const T = S.react < 2.4 ? S.react : (S.t % period);
      const open = k01(0, 0.25, T) * (1 - k01(1.9, 2.15, T));
      door.rotation.y = -1.7 * open;
      const out = k01(0.2, 0.45, T) * (1 - k01(1.6, 1.9, T));
      const bob = Math.max(0, Math.sin((T - 0.5) * Math.PI * 2.2)) * (T > 0.5 && T < 1.6 ? 1 : 0);
      birdy.position.z = -0.02 + out * 0.16;
      birdy.rotation.x = -bob * 0.5;
      hands[0].rotation.z = -S.t * 0.08;
      hands[1].rotation.z = -S.t * 0.9;
      pend.rotation.z = Math.sin(S.t * Math.PI * 1.6) * 0.28;
      // the weights run down as it counts
      const cyc = Math.floor(S.t / period);
      if (cyc !== last) last = cyc;
      for (const [i, w] of weights.entries()) {
        const L = 0.55 + 0.4 * (((S.t * 0.02 + i * 0.37) % 1));
        w.chain.scale.y = L;
        w.cone.position.y = -L;
      }
    },
  };
  return m;
}

// Грибница: a ring of pale mushrooms (a few glow), a radio dropped in the middle; a slow wave runs round the ring and
// spores drift up out of it
function gribnica(mat) {
  const r = new RNG(77);
  const rnd = () => r.next();
  const root = new THREE.Group();
  root.add(mesh(mat, (b) => {
    // the radio someone dropped, its antenna, and a few tufts of moss
    b.place(0.1, 0.05, 0.05, 0, 0.6, 0.12);
    b.box(0.12, 0.08, 0.26, KIND.METAL);
    b.identity();
    b.limb([0.14, 0.09, -0.05], [0.25, 0.12, -0.32], 0.008, 0.005, KIND.METAL);
    for (let i = 0; i < 18; i++) {
      const a = rnd() * 6.28, d = 0.4 + rnd() * 1.6;
      b.place(Math.cos(a) * d, 0, Math.sin(a) * d, 0, rnd() * 6, 0, 0.6 + rnd() * 0.6);
      b.cone(4, 0.09, 0.16 + rnd() * 0.12, KIND.LEAF);
    }
  }, 2048));
  const caps = [];
  const N = 17;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + (rnd() - 0.5) * 0.2;
    const d = 1.25 + (rnd() - 0.5) * 0.25;
    const big = rnd();
    const h = 0.12 + big * 0.22, cr = 0.08 + big * 0.12;
    const glow = i % 6 === 2;
    const red = i % 7 === 4;
    const n = node(root, Math.cos(a) * d, 0, Math.sin(a) * d);
    n.rotation.set((rnd() - 0.5) * 0.25, rnd() * 6, (rnd() - 0.5) * 0.25);
    n.add(mesh(mat, (b) => {
      b.identity();
      b.cylinder(6, cr * 0.28, cr * 0.22, h, KIND.BONE, { capTop: false });
      b.place(0, h, 0);
      b.cylinder(9, cr, cr * 0.95, 0.015, KIND.LEAF, { capTop: false }); // the gills
      b.cone(9, cr, cr * 0.75, glow ? KIND.SHARD : red ? KIND.FLESH : KIND.BONE, { y0: 0.012 });
      if (red) for (let k = 0; k < 4; k++) {
        const q = k * 1.6;
        b.place(Math.cos(q) * cr * 0.45, h + cr * 0.4, Math.sin(q) * cr * 0.45);
        b.octa(cr * 0.12, cr * 0.06, KIND.BONE);
      }
    }, 256));
    caps.push({ n, ph: i, glow });
  }
  // spores: they rise out of the ring and fall back in
  const spores = [];
  for (let i = 0; i < 26; i++) {
    const s = node(root);
    s.add(mesh(mat, (b) => { b.identity(); b.octa(0.012 + rnd() * 0.01, 0.012, KIND.SHARD); }, 16));
    spores.push({ s, a: rnd() * 6.28, d: 1.0 + rnd() * 0.5, sp: 0.15 + rnd() * 0.25, ph: rnd() });
  }
  return {
    root, base: 0.3, view: { yaw: 0.5, pitch: 0.62, fit: 0.86 },
    tick(S) {
      const puff = S.react < 1.2 ? 1 - S.react / 1.2 : 0;
      for (const c of caps) {
        const wave = Math.max(0, Math.sin(S.t * 1.7 - c.ph * 0.37)) ** 4;
        const s = 1 + 0.09 * wave + 0.18 * puff + (c.glow ? 0.05 * S.lit : 0);
        c.n.scale.set(s, 1 + 0.12 * wave + 0.2 * puff, s);
      }
      for (const p of spores) {
        const k = (S.t * p.sp + p.ph) % 1;
        const a = p.a + S.t * 0.1;
        const lift = k * (1.4 + puff * 1.2);
        p.s.position.set(Math.cos(a) * p.d * (1 - k * 0.3), 0.2 + lift, Math.sin(a) * p.d * (1 - k * 0.3));
        const v = Math.sin(k * Math.PI);
        p.s.scale.setScalar(0.4 + v);
      }
    },
  };
}

// Шатун: a starving bear on all fours, ribs showing through the mange; it breathes, sniffs the air from side to
// side, and when its voice is played it lifts its head and roars
function shatun(mat) {
  const r = new RNG(9);
  const rnd = () => r.next();
  const root = new THREE.Group();
  const body = node(root, 0, 1.0, 0);
  body.add(mesh(mat, (b) => {
    b.place(0, 0, 0, 0, 0, 0.04, 1.55, 0.95, 1.0);
    b.rock(0.6, rnd, KIND.BARK, 0.22, 0.85);
    b.place(0.42, 0.3, 0, 0, 0, 0.2);
    b.rock(0.42, rnd, KIND.BARK, 0.28, 0.8); // the hump
    b.place(-0.62, 0.05, 0);
    b.rock(0.46, rnd, KIND.BARK, 0.28, 0.9);
    // the mange: raw patches, and the ribs under the skin
    for (const [x, y, z, s] of [[0.1, 0.25, 0.5, 0.13], [-0.35, -0.12, -0.52, 0.11], [0.5, 0.05, -0.45, 0.09]]) {
      b.place(x, y, z);
      b.rock(s, rnd, KIND.FLESH, 0.4, 0.5);
    }
    b.identity();
    for (let i = 0; i < 6; i++) {
      const x = 0.35 - i * 0.16;
      for (const s of [-1, 1]) {
        b.limb([x, 0.38, s * 0.3], [x - 0.04, 0.05, s * 0.58], 0.018, 0.016, KIND.BONE);
        b.limb([x - 0.04, 0.05, s * 0.58], [x - 0.02, -0.3, s * 0.4], 0.016, 0.012, KIND.BONE);
      }
    }
    // shaggy fur along the back
    for (let i = 0; i < 9; i++) {
      b.place(0.6 - i * 0.16, 0.42 + Math.sin(i) * 0.04 + (i < 3 ? 0.12 : 0), (rnd() - 0.5) * 0.2, -0.3, 0, 0.5 + rnd() * 0.3, 0.8);
      b.cone(4, 0.07, 0.2, KIND.BARK);
    }
  }, 4096));
  const legs = [[0.58, -0.25, 0.3], [0.58, -0.25, -0.3], [-0.62, -0.18, 0.33], [-0.62, -0.18, -0.33]].map(([x, y, z], i) => {
    const L = node(body, x, y, z);
    L.add(mesh(mat, (b) => {
      b.identity();
      const front = i < 2;
      b.limb([0, 0.1, 0], [front ? 0.06 : -0.04, -0.42, 0], 0.2, 0.15, KIND.BARK, 6);
      b.limb([front ? 0.06 : -0.04, -0.42, 0], [0.04, -0.72, 0], 0.15, 0.12, KIND.BARK, 6);
      b.place(0.08, -0.74, 0, 0, 0, 0, 1.3, 0.6, 1);
      b.rock(0.14, rnd, KIND.BARK, 0.2, 0.8);
      for (const cz of [-0.07, 0, 0.07]) {
        b.place(0.24, -0.76, cz, 0, 0, -Math.PI / 2 - 0.3);
        b.cone(4, 0.018, 0.09, KIND.BONE);
      }
    }, 512));
    return L;
  });
  const head = node(body, 0.95, 0.12, 0);
  head.add(mesh(mat, (b) => {
    b.identity();
    b.limb([-0.35, 0.05, 0], [0.05, 0.02, 0], 0.3, 0.22, KIND.BARK, 6);
    b.place(0.12, 0.04, 0, 0, 0, 0, 1.25, 0.9, 0.9);
    b.rock(0.25, rnd, KIND.BARK, 0.2, 0.9);
    b.place(0.3, -0.02, 0, 0, 0, -Math.PI / 2);
    b.taper(0.24, 0.2, 0.13, 0.12, 0.26, KIND.BARK);
    b.place(0.57, -0.01, 0);
    b.octa(0.055, 0.04, KIND.ROCK); // the nose
    for (const s of [-1, 1]) {
      b.place(0.05, 0.25, s * 0.16, s * 0.3, 0, 0);
      b.octa(0.07, 0.06, KIND.BARK);
      b.place(0.3, 0.1, s * 0.12);
      b.octa(0.025, 0.025, KIND.EYE);
    }
  }, 1024));
  const jaw = node(head, 0.3, -0.12, 0);
  jaw.add(mesh(mat, (b) => {
    b.place(0, 0, 0, 0, 0, -Math.PI / 2);
    b.taper(0.08, 0.16, 0.05, 0.1, 0.26, KIND.BARK);
    b.place(0.12, 0.035, 0, 0, 0, -Math.PI / 2);
    b.taper(0.03, 0.12, 0.02, 0.08, 0.2, KIND.FLESH);
    for (const s of [-1, 1]) {
      b.place(0.2, 0.05, s * 0.05);
      b.cone(4, 0.014, 0.05, KIND.BONE);
    }
  }));
  const m = {
    root, base: 0.3, view: { yaw: 0.62, pitch: 0.14, fit: 0.92 },
    sniff: 0,
    poses: [() => { head.rotation.z = 0.5; jaw.rotation.z = -0.6; }, () => { head.rotation.z = 0; jaw.rotation.z = 0; }],
    tick(S) {
      const roar = S.react < 2.6 ? Math.sin(Math.PI * clamp(S.react / 2.6, 0, 1)) : 0;
      const br = Math.sin(S.t * 1.7);
      body.scale.set(1, 1 + 0.025 * br, 1 + 0.03 * br);
      body.position.y = 1.0 + 0.01 * br + (roar > 0 ? Math.sin(S.t * 47) * 0.006 * roar : 0);
      // it sniffs side to side, the nose low; it swings toward you when the echo lights it
      m.sniff = lerp(m.sniff, S.lit > 0.25 ? clamp(angleDiff(Math.PI / 2, S.camAz), -0.7, 0.7) : Math.sin(S.t * 0.6) * 0.45, 1 - Math.exp(-S.dt * 2.5));
      head.rotation.y = m.sniff;
      head.rotation.z = -0.18 + 0.05 * Math.sin(S.t * 3.1) * (1 - roar) + roar * 0.65;
      jaw.rotation.z = -0.05 - roar * 0.7 - (Math.sin(S.t * 0.9) > 0.92 ? 0.12 : 0);
      for (const [i, L] of legs.entries()) L.rotation.z = roar * (i < 2 ? -0.15 : 0.05);
    },
  };
  return m;
}

// Полудница: a tall woman in a white dress in a patch of wheat, a sickle in her hand, a wreath of straw; her blank
// face turns to follow you
function poludnica(mat) {
  const r = new RNG(5);
  const rnd = () => r.next();
  const root = new THREE.Group();
  // the field
  const stalks = [];
  for (let i = 0; i < 34; i++) {
    const a = rnd() * 6.28, d = 0.75 + rnd() * 1.0, h = 0.75 + rnd() * 0.45;
    const s = node(root, Math.cos(a) * d, 0, Math.sin(a) * d);
    s.add(mesh(mat, (b) => {
      b.identity();
      b.limb([0, 0, 0], [0.02, h, 0], 0.008, 0.005, KIND.WOOD, 3);
      b.place(0.02, h + 0.06, 0, 0.1, 0, 0.12);
      b.octa(0.018, 0.07, KIND.SHARD);
    }, 64));
    stalks.push({ s, ph: rnd() * 6 });
  }
  const body = node(root, 0, 0, 0);
  const dress = node(body, 0, 0, 0);
  dress.add(mesh(mat, (b) => {
    b.identity();
    b.cylinder(11, 0.62, 0.17, 1.22, KIND.BONE, { capTop: false });
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2;
      const p0 = [Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62], p1 = [Math.cos(a + 0.29) * 0.62, 0, Math.sin(a + 0.29) * 0.62];
      b.triN(p0, p1, [Math.cos(a + 0.15) * 0.66, -0.12 - rnd() * 0.06, Math.sin(a + 0.15) * 0.66], [Math.cos(a), 0, Math.sin(a)], KIND.BONE);
    }
  }, 512));
  body.add(mesh(mat, (b) => {
    b.place(0, 1.2, 0);
    b.taper(0.3, 0.18, 0.42, 0.2, 0.6, KIND.BONE);
    b.identity();
    b.limb([0, 1.78, 0], [0, 1.98, 0.02], 0.045, 0.04, KIND.BONE);
    // the left arm hangs, too long
    b.limb([-0.22, 1.76, 0], [-0.3, 1.25, 0.04], 0.04, 0.032, KIND.BONE);
    b.limb([-0.3, 1.25, 0.04], [-0.33, 0.72, 0.1], 0.032, 0.02, KIND.BONE);
    for (let f = 0; f < 4; f++) b.limb([-0.33, 0.72, 0.1], [-0.35 + f * 0.012, 0.6, 0.08 + f * 0.015], 0.01, 0.005, KIND.BONE);
  }));
  const head = node(body, 0, 2.06, 0.02);
  head.add(mesh(mat, (b) => {
    b.place(0, 0, 0, 0, 0, 0, 0.85, 1.15, 0.9);
    b.rock(0.12, rnd, KIND.BONE, 0.12, 1);
    b.identity();
    // hair, down to the waist
    for (let i = 0; i < 11; i++) {
      const a = Math.PI * (0.15 + 0.7 * (i / 10));
      const x = Math.cos(a) * 0.11, z = -Math.sin(a) * 0.09;
      b.limb([x, 0.08, z], [x * 1.9, -0.75 - rnd() * 0.25, z * 2.2 - 0.06], 0.018, 0.006, KIND.WOOD, 3);
    }
    // the wreath of straw
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      b.place(Math.cos(a) * 0.12, 0.1, Math.sin(a) * 0.11, Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
      b.cone(4, 0.02, 0.09, KIND.SHARD);
    }
  }, 1024));
  const arm = node(body, 0.22, 1.76, 0);
  arm.add(mesh(mat, (b) => {
    b.identity();
    b.limb([0, 0, 0], [0.08, -0.48, 0.12], 0.04, 0.032, KIND.BONE);
    b.limb([0.08, -0.48, 0.12], [0.1, -0.78, 0.42], 0.032, 0.022, KIND.BONE);
    // the sickle: a short handle, a long curved blade
    b.limb([0.1, -0.74, 0.42], [0.1, -0.98, 0.52], 0.022, 0.02, KIND.WOOD);
    let p = [0.1, -0.74, 0.42];
    for (let i = 0; i < 8; i++) {
      const a = 0.3 + i * 0.34;
      const q = [0.1, p[1] + Math.cos(a) * 0.075, p[2] - Math.sin(a) * 0.075 * 0.9];
      b.limb(p, q, 0.014 - i * 0.0012, 0.012 - i * 0.0012, KIND.METAL, 3);
      p = q;
    }
  }));
  const m = {
    root, base: 0.32, view: { yaw: 0.4, pitch: 0.1, fit: 0.95 },
    look: 0,
    poses: [() => { arm.rotation.x = -1.6; }, () => { arm.rotation.x = 0; }],
    tick(S) {
      const swing = S.react < 1.4 ? Math.sin(Math.PI * clamp(S.react / 1.4, 0, 1)) : 0;
      dress.rotation.z = Math.sin(S.t * 0.8) * 0.025;
      dress.rotation.x = Math.sin(S.t * 0.63 + 1) * 0.02;
      // the blank face turns to you, slowly; more than a neck should
      m.look = lerp(m.look, clamp(angleDiff(0, S.camAz), -1.3, 1.3), 1 - Math.exp(-S.dt * 0.9));
      head.rotation.y = m.look;
      head.rotation.z = 0.18 + Math.sin(S.t * 0.4) * 0.04;
      arm.rotation.x = -0.15 - 0.2 * (0.5 + 0.5 * Math.sin(S.t * 0.55)) - swing * 1.5;
      arm.rotation.z = swing * 0.3;
      for (const s of stalks) s.s.rotation.z = Math.sin(S.t * 1.3 + s.ph) * 0.06 + Math.sin(S.t * 0.4) * 0.04;
    },
  };
  return m;
}

// Пятый: one of you — the survivor's own rig — standing with its back to you; the head turns all the way round to
// look at you, and keeps looking wherever you go
function pyaty(mat) {
  const rig = buildSurvivor();
  for (const p of rig.parts) {
    const msh = new THREE.Mesh(geometryOfArrays(p.arr), mat);
    msh.frustumCulled = false;
    p.node.add(msh);
  }
  try { poseSurvivor(rig, 0, 0, 0, false); } catch { /* the rest pose will do */ }
  const root = new THREE.Group();
  root.add(rig.root);
  rig.root.rotation.y = Math.PI; // its back to you
  const head = rig.nodes.head;
  const eyes = node(head, 0, 0.11, 0.1);
  eyes.add(mesh(mat, (b) => {
    for (const x of [-0.035, 0.035]) { b.place(x, 0, 0); b.octa(0.014, 0.012, KIND.EYE); }
  }, 32));
  const m = {
    root, base: 0.3, view: { yaw: 0.45, pitch: 0.08, fit: 0.95 },
    look: Math.PI,
    tick(S) {
      // where you stand, relative to the way its body faces (it faces away: π)
      const want = angleDiff(Math.PI, S.camAz);
      m.look = lerp(m.look, want, 1 - Math.exp(-S.dt * (S.react < 1 ? 9 : 2.2)));
      head.rotation.y = m.look;
      head.rotation.z = Math.sin(S.t * 0.7) * 0.05 + (S.react < 1.5 ? Math.sin(S.t * 31) * 0.06 : 0);
      if (rig.nodes.chest) rig.nodes.chest.rotation.x = 0.06 + Math.sin(S.t * 1.4) * 0.015;
    },
  };
  return m;
}
function geometryOfArrays(a) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a.pos, 3));
  g.setAttribute('data', new THREE.BufferAttribute(a.dat, 4, true));
  g.computeBoundingSphere();
  return g;
}

const BUILDERS = { gluhar, kukushka, gribnica, shatun, poludnica, pyaty };

export function buildMob(key, mat) {
  const make = BUILDERS[key];
  if (!make) return null;
  const m = make(mat);
  m.key = key;
  return m;
}
