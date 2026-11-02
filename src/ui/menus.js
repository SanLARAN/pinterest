import { AdvancedGraphics } from './graphics.js';
// Menu screens, settings and high-score tables.
import { t, setLang, getLang } from '../core/i18n.js';
import { settings, saveSettings, getScores } from '../core/storage.js';
import { fmtTime, fmtScore } from './hud.js';
import {currentIdentity} from '../core/identity.js';
import { cleanMap } from '../core/maps.js'; // 3.0g: which участок the solo panel is offering
import { mapOpen } from '../core/mapUnlock.js'; // 3.0s: the bog is earned on the forestry

const $ = (id) => document.getElementById(id);

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export class Menus {
  constructor(handlers) {
    this.h = handlers; // { onPlay, onResume, onRestart, onMenu, onMicToggle, onSettingsChanged, onAtlas, uiSound }
    this.screens = ['menu', 'pause', 'over', 'settingsPanel', 'howPanel', 'scoresPanel', 'soloPanel', 'coopPanel', 'atlasPanel', 'wardrobePanel', 'boot'];
    this.settingsReturn = null;
    this.highlight = -1;
    this.graphics = new AdvancedGraphics({ onChange: key => this.h.onSettingsChanged?.(key), stats: () => this.h.graphicsStats?.() });
    this._bind();
    this.applyI18n();
    this.loadSettingsForm();
    this.renderScores();
  }

  show(id, on = true) {
    if (id === 'settingsPanel' && !on) this.graphics.close(false);
    $(id).classList.toggle('show', on);
  }
  only(id) {
    for (const s of this.screens) this.show(s, s === id);
    document.body.classList.toggle('in-menu', id === 'menu' || id === 'over' || id === 'pause');
  }
  isOpen(id) {
    return $(id).classList.contains('show');
  }
  // the solo shift: which участок, then the length (2.1t, 3.0g)
  openSolo() {
    this.paintSoloDays?.();
    this.paintSoloMap?.();
    this.show('soloPanel', true);
  }

  applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    $('howBody').innerHTML = t('howtoBody') + t('howtoBog'); // (3.0s) the bog has its own page of the rules
    const title = $('titleText');
    title.textContent = t('title');
    title.dataset.text = t('title');
    $('bootText').textContent = t(cleanMap(new URLSearchParams(location.search).get('map')) === 'bog' ? 'loadingBog' : 'loading'); // (3.0s: the bog does not grow a forest)
    document.title = `${t('title')} — ${t('subtitle')}`;
    this.renderScores();
    if (this.graphics.opened) this.graphics.render();
  }

  _bind() {
    const click = (id, fn) => {
      const el = $(id);
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.h.uiSound && this.h.uiSound('click');
        fn(e);
      });
      el.addEventListener('mouseenter', () => this.h.uiSound && this.h.uiSound('hover'));
    };
    click('btnPlay', () => this.openSolo());
    // the solo shift length (2.1t): 2, 4 or 6 nights — asked after ОДНОМУ, not on the menu itself.
    // The card you press is the shift: it is remembered like any other setting.
    const nights = $('soloPanel');
    if (nights) {
      for (const b of nights.querySelectorAll('[data-days]')) {
        b.addEventListener('click', (e) => {
          e.preventDefault();
          this.h.uiSound && this.h.uiSound('click');
          settings.shiftDays = +b.dataset.days;
          saveSettings();
          this.paintSoloDays();
          this.show('soloPanel', false);
          this.h.onPlay();
        });
        b.addEventListener('mouseenter', () => this.h.uiSound && this.h.uiSound('hover'));
      }
      this.paintSoloDays = () => {
        for (const b of nights.querySelectorAll('[data-days]')) b.setAttribute('aria-pressed', String((settings.shiftDays || 4) === +b.dataset.days));
      };
      // 3.0g: which участок. Picking one only picks it — the night cards below still start the shift
      for (const b of nights.querySelectorAll('[data-map]')) {
        b.addEventListener('click', (e) => {
          e.preventDefault();
          // (3.0s) a locked ground says what opens it and stays unpicked
          if (!mapOpen(cleanMap(b.dataset.map)) && !this.h.unlockAll?.()) {
            this.h.uiSound && this.h.uiSound('deny');
            b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
            return;
          }
          this.h.uiSound && this.h.uiSound('click');
          settings.shiftMap = cleanMap(b.dataset.map);
          saveSettings();
          this.paintSoloMap();
          this.h.onMap?.(settings.shiftMap);
        });
        b.addEventListener('mouseenter', () => this.h.uiSound && this.h.uiSound('hover'));
      }
      // 3.0h: the plate above the cards is the chosen ground — the real plan of it, printed from the terrain
      const plate = $('soloMapPreview'), note = $('soloMapNote');
      this.paintSoloMap = () => {
        const open = (m) => mapOpen(m) || !!this.h.unlockAll?.();
        // (3.0s) a remembered bog on a profile that has not earned it (a new device, a wiped atlas) is the forest
        const want = open(cleanMap(settings.shiftMap)) ? cleanMap(settings.shiftMap) : 'forest';
        for (const b of nights.querySelectorAll('[data-map]')) {
          const locked = !open(b.dataset.map);
          b.setAttribute('aria-pressed', String(b.dataset.map === want));
          b.setAttribute('aria-disabled', String(locked));
          b.classList.toggle('locked', locked);
          const hint = b.querySelector('span');
          if (hint) hint.textContent = t(locked ? 'mapBogLocked' : b.dataset.map === 'bog' ? 'mapBogHint' : 'mapForestHint');
        }
        if (plate) {
          const src = `maps/${want}.png`;
          if (!plate.getAttribute('src')?.endsWith(src)) {
            plate.classList.add('swap');
            const show = () => {
              plate.src = src;
              plate.alt = t(want === 'bog' ? 'mapBog' : 'mapForest');
              plate.classList.remove('swap');
            };
            // (a cached plate is ready at once; a fresh one fades in behind the dark)
            if (plate.complete && plate.naturalWidth) show(); else setTimeout(show, 90);
          }
        }
        if (note) note.textContent = t(want === 'bog' ? 'mapBogFoot' : 'mapForestFoot');
      };
      click('btnSoloBack', () => this.show('soloPanel', false));
      this.paintSoloDays();
      this.paintSoloMap();
    }
    click('btnCoop', () => this.h.onCoop && this.h.onCoop());
    click('btnLobby', () => this.h.onLobby && this.h.onLobby());
    click('btnHow', () => this.show('howPanel'));
    click('btnHowBack', () => this.show('howPanel', false));
    click('btnAtlas', () => this.h.onAtlas && this.h.onAtlas());
    click('btnShop', () => this.h.onShop && this.h.onShop());
    // (3.1j) the home list walks like a game menu: ↑/↓ move between its lines, Enter/Space press (buttons do that).
    // One line is lit at a time: while the keyboard drives, the line under a resting mouse stays dark (.kbd).
    const homeList = $('homeList');
    homeList?.addEventListener('pointermove', () => homeList.classList.remove('kbd'));
    homeList?.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) homeList.classList.add('kbd'); });
    homeList?.addEventListener('keydown', (e) => {
      homeList.classList.add('kbd');
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const items = [...e.currentTarget.querySelectorAll('.home-item')].filter((b) => b.offsetParent);
      const i = items.indexOf(document.activeElement);
      const next = items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length];
      if (!next) return;
      e.preventDefault();
      next.focus();
      this.h.uiSound && this.h.uiSound('hover');
    });
    click('btnScores', () => {
      this.renderScores();
      this.show('scoresPanel');
    });
    click('btnScoresBack', () => this.show('scoresPanel', false));
    click('btnSettings', () => this.openSettings('menu'));
    click('btnSettingsP', () => this.openSettings('pause'));
    click('btnSettingsBack', () => this.closeSettings());
    click('btnResume', () => this.h.onResume());
    click('btnRange', () => this.h.onRange && this.h.onRange());
    click('btnRestartP', () => this.h.onRestart());
    click('btnMenuP', () => this.h.onMenu());
    click('btnRestart', () => this.h.onRestart());
    click('btnMenu', () => this.h.onMenu());
    click('micToggle', () => this.h.onMicToggle());
    click('langBtn', () => {
      setLang(getLang() === 'ru' ? 'en' : 'ru');
      settings.lang = getLang();
      saveSettings();
      this.loadSettingsForm();
      this.applyI18n();
      this.h.onSettingsChanged && this.h.onSettingsChanged();
    });

    const name = $('nameInput');
    name.value = settings.name || '';
    name.addEventListener('input', () => {
      const identity=currentIdentity();if(identity?.locked){name.value=identity.name;return;}
      settings.name = name.value.trim().slice(0, 14);
      saveSettings();
    });
    name.addEventListener('keydown', (e) => e.stopPropagation());

    const bindRange = (id, key, cb) => {
      const el = $(id);
      el.addEventListener('input', () => {
        settings[key] = parseFloat(el.value);
        saveSettings();
        cb && cb();
        this.h.onSettingsChanged && this.h.onSettingsChanged(key);
      });
    };
    const bindCheck = (id, key) => {
      const el = $(id);
      el.addEventListener('change', () => {
        settings[key] = el.checked;
        saveSettings();
        this.h.onSettingsChanged && this.h.onSettingsChanged(key);
      });
    };
    const bindSelect = (id, key) => {
      const el = $(id);
      el.addEventListener('change', () => {
        settings[key] = el.value;
        if (key === 'quality') settings.graphics = { ...settings.graphics, enabled: false };
        saveSettings();
        if (key === 'lang') {
          setLang(el.value);
          this.applyI18n();
        }
        this.h.onSettingsChanged && this.h.onSettingsChanged(key);
      });
    };
    bindRange('sVolume', 'volume');
    bindRange('sMusic', 'music');
    bindRange('sMouse', 'mouseSens');
    bindRange('sMicSens', 'micSens');
    bindCheck('sInvert', 'invertY');
    bindCheck('sMic', 'micEnabled');
    bindCheck('sEcho', 'voiceEcho');
    bindCheck('sRadar', 'radar');
    bindSelect('sScares', 'scares');
    bindSelect('sQuality', 'quality');
    bindSelect('sAudioBuf', 'audioBuffer'); // (3.1g)
    bindSelect('sLang', 'lang');

    // tap anywhere on the game-over screen background = restart (touch friendly)
    $('over').addEventListener('pointerdown', (e) => {
      if (e.target.id === 'over') this.h.onRestart();
    });
  }

  loadSettingsForm() {
    $('sVolume').value = settings.volume;
    $('sMusic').value = settings.music ?? 0.55;
    $('sMouse').value = settings.mouseSens;
    $('sMicSens').value = settings.micSens;
    $('sInvert').checked = settings.invertY;
    $('sMic').checked = settings.micEnabled;
    $('sEcho').checked = settings.voiceEcho;
    $('sRadar').checked = !!settings.radar;
    $('sScares').value = settings.scares;
    $('sQuality').value = settings.quality;
    $('sAudioBuf').value = ['auto', 'fast', 'bt'].includes(settings.audioBuffer) ? settings.audioBuffer : 'auto';
    $('sLang').value = getLang();
  }

  openSettings(from) {
    this.graphics.close(false);
    this.settingsReturn = from;
    this.loadSettingsForm();
    this.show('settingsPanel');
  }
  closeSettings() {
    if (this.graphics.opened) { this.graphics.close(); return; }
    this.show('settingsPanel', false);
  }

  renderScores(highlightRank = -1, target = 'scoreTable') {
    const list = getScores();
    if (target === 'scoreTable') {
      const best = list[0];
      const bl = $('bestLine');
      if (bl) bl.innerHTML = best ? `${esc(t('best'))} <b>${fmtScore(best.score)}</b> · ${fmtTime(best.time)} · ${best.won ? '☀' : `${best.gens | 0}/5`}` : '';
    }
    const el = $(target);
    if (!el) return;
    if (!list.length) {
      el.innerHTML = `<div class="empty">${esc(t('noScores'))}</div>`;
      return;
    }
    let html = `<div class="row head"><span class="r">${t('rank')}</span><span class="n">${esc(t('name'))}</span><span class="s">${esc(t('score'))}</span><span class="t">${esc(t('time'))}</span></div>`;
    list.forEach((s, i) => {
      const me = i === highlightRank ? ' me' : '';
      const mark = (s.won ? '<span class="w">☀</span>' : s.gens ? `<span class="g">${s.gens | 0}/5</span>` : '') + (s.coop > 1 ? `<span class="c">${esc(t('coopTag').replace('{n}', s.coop))}</span>` : '');
      html += `<div class="row${me}"><span class="r">${i + 1}</span><span class="n">${esc(s.name || '???')}${mark}</span><span class="s">${fmtScore(s.score)}</span><span class="t">${fmtTime(s.time)}</span></div>`;
    });
    el.innerHTML = html;
  }

  // mic status line on the start screen
  setMicStatus(state, inIframe) {
    const st = $('micStatus');
    const btn = $('micToggle');
    const warn = $('micWarn');
    const on = state === 'on';
    st.textContent = on ? t('micOn') : state === 'pending' ? '…' : t('micOff');
    st.className = on ? 'on' : 'off';
    btn.textContent = on ? t('off') : t('micAsk');
    $('micTest').style.display = on ? 'flex' : 'none';
    let msg = '';
    if (state === 'blocked' || (state === 'denied' && inIframe) || (state === 'unsupported' && inIframe)) {
      msg = `${esc(t('micIframe'))} <a href="${esc(location.href)}" target="_blank" rel="noopener">${esc(t('micOpenTab'))} ↗</a><br>${esc(t('micDenied'))}`;
    } else if (state === 'denied' || state === 'unsupported') {
      msg = esc(t('micDenied'));
    }
    warn.innerHTML = msg;
    warn.classList.toggle('show', !!msg);
  }

  micTest(level, trigPos) {
    $('micTestFill').style.transform = `scaleX(${Math.min(1, level)})`;
    $('micTestTrig').style.left = `${(trigPos * 100).toFixed(1)}%`;
  }

  showOver(res, stats, rank, list, team = null) {
    const won = res.won;
    const isEsc = !!res.escaped;
    const bog = res.map === 'bog'; // (3.0r) the bog leaves by the old track and counts pumps; it has no car parts to find
    const B = (k) => t(bog ? k + 'Bog' : k);
    $('over').classList.toggle('won', won);
    $('overKicker').textContent = won
      ? `${isEsc ? B('escKicker') : t('winKicker')} · ${fmtTime(stats.time)}`
      : `${t('survived')} ${fmtTime(stats.time)} · ${t(bog ? 'pumps' : 'generators')} ${stats.gens | 0}/5`;
    const titles = { scream: 'deadScream', crawler: 'deadCrawler', watcher: 'deadWatcher', howler: 'deadHowler', shkaf: 'deadShkaf', angler: 'deadAngler', razlom: 'deadRazlom', shiftEnd: 'deadShiftEnd' };
    let title = won ? (isEsc ? B('escTitle') : t('winTitle')) : t(titles[res.cause] || 'deadTitle');
    const who = !won && res.cause !== 'scream' ? (t('deathBy')[res.cause] || '') : '';
    let sub = won ? (isEsc ? (res.alive === false ? t('escSubHurt') : B('escSub')) : t('winSub')) : who ? `— ${who}` : '';
    if (res.cause === 'shiftEnd' && !won) {
      // (3.1m) the forest's last morning ran out with the УАЗ in the yard: nobody died, nobody got out
      sub = t('shiftEndSub');
    } else if (res.left) {
      // the УАЗ went without you
      title = t('leftTitle');
      sub = t('leftSub');
    } else if (res.coop) {
      if (res.hostLost) {
        title = t('hostLostTitle');
        sub = t('hostLostSub');
      } else if (won && !res.alive && !isEsc) sub = t('teamWonDead');
      else if (!won) sub = `${t('teamAllDead')}${who ? ` · ${who}` : ''}`;
    }
    $('overTitle').textContent = title;
    $('overSub').textContent = sub;
    const tt = $('overTeam');
    if (team && team.length) {
      tt.innerHTML = `<div class="row head"><span>${esc(t('teamHead'))}</span></div>` + team.map((m) =>
        `<div class="row"><i class="dot" style="--c:${m.color}"></i><span class="n">${esc(m.name)}${m.self ? ` <em>· ${esc(t('coopYou'))}</em>` : ''}</span>` +
        `<span class="st ${m.alive ? 'alive' : ''}">${esc(m.alive ? t('stAlive') : t('stDead'))}</span><span class="s">${fmtScore(m.score)}</span></div>`).join('');
    } else tt.innerHTML = '';
    $('overScore').textContent = fmtScore(stats.score);
    $('newRecord').classList.toggle('show', rank === 0 && stats.score > 0);
    const loud = `${Math.round((stats.loudest / 0.78) * 100)}%`;
    const cells = [
      [`${stats.gens | 0}/5`, t(bog ? 'pumps' : 'gensGot')],
      ...(stats.gens >= 5 && !bog ? [[`${stats.carParts | 0}/4`, t('partsGot')]] : []),
      [stats.shards, t('shardsGot')],
      [stats.close, t('closeCalls')],
      [stats.escapes, t('escapes')],
      [loud, t('loudest')],
    ];
    const grid = $('overStats');
    grid.style.gridTemplateColumns = `repeat(${cells.length}, 1fr)`;
    grid.innerHTML = cells.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('');
    this.renderScores(rank, 'overTable');
    void list;
  }
}
