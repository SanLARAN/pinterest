// Menu screens, settings and high-score tables.
import { t, setLang, getLang } from '../core/i18n.js';
import { settings, saveSettings, getScores } from '../core/storage.js';
import { fmtTime, fmtScore } from './hud.js';

const $ = (id) => document.getElementById(id);

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export class Menus {
  constructor(handlers) {
    this.h = handlers; // { onPlay, onResume, onRestart, onMenu, onMicToggle, onSettingsChanged, onAtlas, uiSound }
    this.screens = ['menu', 'pause', 'over', 'settingsPanel', 'howPanel', 'scoresPanel', 'coopPanel', 'atlasPanel', 'boot'];
    this.settingsReturn = null;
    this.highlight = -1;
    this._bind();
    this.applyI18n();
    this.loadSettingsForm();
    this.renderScores();
  }

  show(id, on = true) {
    $(id).classList.toggle('show', on);
  }
  only(id) {
    for (const s of this.screens) this.show(s, s === id);
    document.body.classList.toggle('in-menu', id === 'menu' || id === 'over' || id === 'pause');
  }
  isOpen(id) {
    return $(id).classList.contains('show');
  }

  applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    $('howBody').innerHTML = t('howtoBody');
    const title = $('titleText');
    title.textContent = t('title');
    title.dataset.text = t('title');
    $('bootText').textContent = t('loading');
    document.title = `${t('title')} — ${t('subtitle')}`;
    this.renderScores();
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
    click('btnPlay', () => this.h.onPlay());
    click('btnCoop', () => this.h.onCoop && this.h.onCoop());
    click('btnLobby', () => this.h.onLobby && this.h.onLobby());
    click('btnHow', () => this.show('howPanel'));
    click('btnHowBack', () => this.show('howPanel', false));
    click('btnAtlas', () => this.h.onAtlas && this.h.onAtlas());
    click('btnScores', () => {
      this.renderScores();
      this.show('scoresPanel');
    });
    click('btnScoresBack', () => this.show('scoresPanel', false));
    click('btnSettings', () => this.openSettings('menu'));
    click('btnSettingsP', () => this.openSettings('pause'));
    click('btnSettingsBack', () => this.closeSettings());
    click('btnResume', () => this.h.onResume());
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
        saveSettings();
        if (key === 'lang') {
          setLang(el.value);
          this.applyI18n();
        }
        this.h.onSettingsChanged && this.h.onSettingsChanged(key);
      });
    };
    bindRange('sVolume', 'volume');
    bindRange('sMouse', 'mouseSens');
    bindRange('sMicSens', 'micSens');
    bindCheck('sInvert', 'invertY');
    bindCheck('sMic', 'micEnabled');
    bindCheck('sEcho', 'voiceEcho');
    bindCheck('sRadar', 'radar');
    bindSelect('sScares', 'scares');
    bindSelect('sQuality', 'quality');
    bindSelect('sLang', 'lang');

    // tap anywhere on the game-over screen background = restart (touch friendly)
    $('over').addEventListener('pointerdown', (e) => {
      if (e.target.id === 'over') this.h.onRestart();
    });
  }

  loadSettingsForm() {
    $('sVolume').value = settings.volume;
    $('sMouse').value = settings.mouseSens;
    $('sMicSens').value = settings.micSens;
    $('sInvert').checked = settings.invertY;
    $('sMic').checked = settings.micEnabled;
    $('sEcho').checked = settings.voiceEcho;
    $('sRadar').checked = !!settings.radar;
    $('sScares').value = settings.scares;
    $('sQuality').value = settings.quality;
    $('sLang').value = getLang();
  }

  openSettings(from) {
    this.settingsReturn = from;
    this.loadSettingsForm();
    this.show('settingsPanel');
  }
  closeSettings() {
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
    $('over').classList.toggle('won', won);
    $('overKicker').textContent = won ? `${t('winKicker')} · ${fmtTime(stats.time)}` : `${t('survived')} ${fmtTime(stats.time)} · ${t('generators')} ${stats.gens | 0}/5`;
    const titles = { scream: 'deadScream', crawler: 'deadCrawler', watcher: 'deadWatcher', howler: 'deadHowler' };
    let title = won ? t('winTitle') : t(titles[res.cause] || 'deadTitle');
    const who = !won && res.cause !== 'scream' ? (t('deathBy')[res.cause] || '') : '';
    let sub = won ? t('winSub') : who ? `— ${who}` : '';
    if (res.coop) {
      if (res.hostLost) {
        title = t('hostLostTitle');
        sub = t('hostLostSub');
      } else if (won && !res.alive) sub = t('teamWonDead');
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
    $('overStats').innerHTML = [
      [`${stats.gens | 0}/5`, t('gensGot')],
      [stats.shards, t('shardsGot')],
      [stats.close, t('closeCalls')],
      [stats.escapes, t('escapes')],
      [loud, t('loudest')],
    ].map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('');
    this.renderScores(rank, 'overTable');
    void list;
  }
}
