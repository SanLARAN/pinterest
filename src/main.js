import './styles.css';

const iconPaths = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  map: '<path d="M3 6.5 8.5 4l7 3 5.5-2.5v13L15.5 20l-7-3L3 19.5z"/><path d="M8.5 4v13M15.5 7v13"/>',
  economy: '<path d="M12 3v18M17 7.5c0-1.8-2.2-3-5-3s-5 1.2-5 3 2.2 3 5 3 5 1.2 5 3-2.2 3-5 3-5-1.2-5-3"/>',
  diplomacy: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.6-4 3.2-6 8-6s7.4 2 8 6M16 5.2c2 .1 3.5 1.2 4 2.8-.3 1-1 1.8-2 2.2M8 5.2C6 5.3 4.5 6.4 4 8c.3 1 1 1.8 2 2.2"/>',
  military: '<path d="m14 4 6 6-3 3-6-6zM11 7l-8 8 6 6 8-8M3 21l4-4M16 3l5 5"/>',
  science: '<path d="M9 3h6M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M8 15h8"/>',
  chronicle: '<path d="M6 3h12a2 2 0 0 1 2 2v16l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Z"/><path d="M8 8h8M8 12h8"/>',
  shield: '<path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
  crown: '<path d="m3 7 4 4 5-7 5 7 4-4-2 12H5z"/><path d="M5 22h14"/>',
  bell: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  arrowDown: '<path d="M12 5v14M18 13l-6 6-6-6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  back: '<path d="m15 18-6-6 6-6M9 12h10"/>',
  play: '<path d="m8 5 11 7-11 7z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  flag: '<path d="M5 21V4M5 5c4-3 7 3 14 0v9c-7 3-10-3-14 0"/>',
  sword: '<path d="m4 20 7-7M14 6l4-4 3 3-4 4M12 8l4 4M4 16l4 4"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10M15 9c-.6-.7-1.5-1-3-1-1.6 0-2.5.7-2.5 1.7 0 2.6 5.5 1.2 5.5 4 0 1.2-1 2-3 2-1.4 0-2.5-.4-3-1.2"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20c.4-3.3 2.4-5 6-5s5.6 1.7 6 5M16 5.5a3 3 0 0 1 0 5.7M17 15c2.5.4 3.9 2 4 5"/>',
  wheat: '<path d="M12 21V5M12 10c-4 0-6-2-6-5 4 0 6 2 6 5ZM12 15c4 0 6-2 6-5-4 0-6 2-6 5ZM12 7C9 7 7 5.5 7 2.8 10 2.8 12 4.3 12 7ZM12 19c-4 0-6-2-6-5 4 0 6 2 6 5Z"/>',
  hammer: '<path d="m15 5 4 4M13 7l4 4M4 21 16 9l-4-4L2 17zM14 3l3-1 5 5-1 3"/>',
  scroll: '<path d="M6 4h12v17H7a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2ZM8 8h7M8 12h7M8 16h4"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  settings: '<path d="M12 15.3a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z"/><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1A1.7 1.7 0 0 0 6.2 12a1.7 1.7 0 0 0-1.2-1.5h-.2a1.7 1.7 0 0 1 0-3.4H5a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1A1.7 1.7 0 0 0 11.5 3h.2a1.7 1.7 0 0 1 3.4 0v.2A1.7 1.7 0 0 0 18 4.4l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1A1.7 1.7 0 0 0 19.2 10h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0 .2 1.6Z"/>',
};

function icon(name, size = 18, className = '') {
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.overview}</svg>`;
}

const state = {
  activeView: 'overview',
  paused: false,
  turn: 42,
  year: 1184,
  season: 3,
  noticeCount: 3,
  selectedProvince: 'valoria',
  mapZoom: 1,
  nation: {
    name: 'Королевство Вейра',
    shortName: 'ВЕЙРА',
    ruler: 'Аделаида I',
    government: 'Феодальная монархия',
    color: '#c7684f',
    motto: 'Словом — порядок, делом — будущее',
  },
  resources: {
    treasury: 12840,
    income: 620,
    population: 284000,
    manpower: 18400,
    maxManpower: 26000,
    food: 91,
    stability: 72,
    legitimacy: 64,
    research: 46,
    prestige: 38,
    authority: 57,
  },
  provinces: [
    { id: 'valoria', name: 'Валория', type: 'Столица', owner: 'you', population: '84.2k', output: '+184', loyalty: 81, color: 'red', x: 276, y: 209, description: 'Сердце королевства. Здесь находится двор, монетный двор и главная академия.', tags: ['Столица', 'Рынок'], buildings: ['Королевский дворец', 'Монетный двор', 'Каменистая академия'] },
    { id: 'northmarch', name: 'Северный рубеж', type: 'Пограничье', owner: 'you', population: '32.8k', output: '+96', loyalty: 68, color: 'red', x: 238, y: 126, description: 'Крепкая пограничная земля, сдерживающая гарнизоны Норда.', tags: ['Форт', 'Граница'], buildings: ['Крепость Ильмар', 'Военный лагерь'] },
    { id: 'eastgate', name: 'Восточные ворота', type: 'Порт', owner: 'you', population: '41.7k', output: '+142', loyalty: 74, color: 'red', x: 380, y: 263, description: 'Морской порт и главный канал торговли с Лигой городов.', tags: ['Порт', 'Торговля'], buildings: ['Гавань Вейры', 'Купеческая гильдия'] },
    { id: 'serev', name: 'Серевские поля', type: 'Земли короны', owner: 'you', population: '55.1k', output: '+113', loyalty: 77, color: 'red', x: 300, y: 312, description: 'Плодородные поля обеспечивают продовольственную безопасность королевства.', tags: ['Житница'], buildings: ['Королевские амбары', 'Ирригационный канал'] },
    { id: 'greycoast', name: 'Серая коса', type: 'Спорная земля', owner: 'contested', population: '18.4k', output: '+51', loyalty: 42, color: 'gold', x: 468, y: 168, description: 'Спорный прибрежный регион с богатыми соляными копями.', tags: ['Спорная'], buildings: ['Соляные копи'] },
    { id: 'kael', name: 'Княжество Каэль', type: 'Союзник', owner: 'ally', population: '96.0k', output: '+210', loyalty: 60, color: 'blue', x: 542, y: 106, description: 'Княжество под защитой Вейры. Союзники ждут взаимных гарантий.', tags: ['Союзник', 'Буфер'], buildings: ['Замок Каэль'] },
    { id: 'nord', name: 'Нордхейм', type: 'Соперник', owner: 'rival', population: '142k', output: '+268', loyalty: 53, color: 'slate', x: 194, y: 52, description: 'Северная держава наращивает войска у общей границы.', tags: ['Угроза', 'Военная держава'], buildings: ['Цитадель Стражей'] },
  ],
  notifications: [
    { type: 'danger', title: 'Нордхейм усиливает границу', body: 'Разведка докладывает о двух новых полках у перевала.', time: '2 ч назад', icon: 'sword' },
    { type: 'info', title: 'Посольство Лигории прибыло', body: 'Дипломаты предлагают торговый договор на 10 лет.', time: 'вчера', icon: 'diplomacy' },
    { type: 'success', title: 'Гавань Вейры завершена', body: 'Доход от морской торговли увеличен на 14 монет.', time: 'вчера', icon: 'check' },
  ],
  queue: [
    { name: 'Гавань Вейры', type: 'Постройка', progress: 100, icon: 'hammer', done: true },
    { name: 'II полк коронной гвардии', type: 'Армия', progress: 64, icon: 'shield', detail: 'ещё 2 хода' },
    { name: 'Кодекс городских прав', type: 'Указ', progress: 28, icon: 'scroll', detail: 'ещё 5 ходов' },
  ],
  allies: [
    { name: 'Княжество Каэль', short: 'К', color: '#7c9a91', relation: 82, status: 'Оборонительный пакт', initials: 'К', since: '1169' },
    { name: 'Лигория', short: 'Л', color: '#c5a36a', relation: 57, status: 'Торговый договор', initials: 'Л', since: '1178' },
  ],
  conflicts: [
    { name: 'Пограничный кризис с Нордхеймом', status: 'НАПРЯЖЕНИЕ', tone: 'danger', progress: 67, detail: '7 / 10' },
    { name: 'Спор за Серую косу', status: 'СПОРНАЯ ЗОНА', tone: 'gold', progress: 42, detail: 'переговоры' },
  ],
  logs: [
    { year: '1184', season: 'Зима', title: 'Вейра вступает в новый цикл', body: 'Собран Совет короны. Приоритет сезона — удержать север и открыть морской путь.', tone: 'accent' },
    { year: '1183', season: 'Осень', title: 'Договор с Лигорией', body: 'Купцы получили привилегии в портах Вейры взамен на поставки железа.', tone: 'green' },
    { year: '1183', season: 'Лето', title: 'Битва при Красном перевале', body: 'Разведывательный отряд отбил дозор Нордхейма. Потери минимальны.', tone: 'red' },
  ],
  researched: ['Основы картографии', 'Феодальное право'],
};

const views = {
  overview: { label: 'Обзор', title: 'Контур державы', subtitle: 'Ваши решения формируют страну. Следите за ресурсами, угрозами и долгими последствиями.' },
  map: { label: 'Карта мира', title: 'Театр держав', subtitle: 'Границы — это только начало. Изучайте регионы, торговые пути и точки напряжения.' },
  economy: { label: 'Экономика', title: 'Машина благосостояния', subtitle: 'Распределяйте бюджет, развивайте производство и превращайте население в устойчивую силу.' },
  diplomacy: { label: 'Дипломатия', title: 'Вес вашего слова', subtitle: 'Союзы, договоры, шпионаж и репутация определяют, кто окажется рядом в час войны.' },
  military: { label: 'Военное дело', title: 'Сила короны', subtitle: 'Создавайте армии, назначайте командиров и выбирайте: сдерживание или экспансия.' },
  science: { label: 'Наука', title: 'Лестница прогресса', subtitle: 'Инвестиции в знания ведут государство от мануфактур к промышленной державе.' },
  chronicle: { label: 'Летопись', title: 'Память государства', subtitle: 'Каждое решение оставляет след. Здесь собраны вехи, указы и последствия кампании.' },
};

function fmt(value) {
  return new Intl.NumberFormat('ru-RU').format(value);
}
function signed(value) {
  return `${value >= 0 ? '+' : ''}${fmt(value)}`;
}
function seasonName(index = state.season) {
  return ['Весна', 'Лето', 'Осень', 'Зима'][index % 4];
}
function currentEra(year = state.year) {
  if (year < 1300) return { name: 'Высокое средневековье', range: '1050 — 1299', progress: ((year - 1050) / 249) * 100, index: 0 };
  if (year < 1500) return { name: 'Позднее средневековье', range: '1300 — 1499', progress: ((year - 1300) / 199) * 100, index: 1 };
  if (year < 1750) return { name: 'Раннее новое время', range: '1500 — 1749', progress: ((year - 1500) / 249) * 100, index: 2 };
  if (year < 1900) return { name: 'Индустриальная эпоха', range: '1750 — 1899', progress: ((year - 1750) / 149) * 100, index: 3 };
  return { name: 'Современность', range: '1900 — 2026', progress: Math.min(100, ((year - 1900) / 126) * 100), index: 4 };
}
function percent(value, max = 100) {
  return Math.max(0, Math.min(100, (value / max) * 100));
}
function selectedProvince() {
  return state.provinces.find((province) => province.id === state.selectedProvince) || state.provinces[0];
}
function statusClass(value) {
  return value === 'danger' || value === 'red' ? 'is-danger' : value === 'success' || value === 'green' ? 'is-success' : value === 'gold' ? 'is-warning' : 'is-neutral';
}

function renderShell() {
  const active = views[state.activeView];
  const era = currentEra();
  const app = document.querySelector('#app');
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand-lockup">
          <div class="brand-crest"><span>✦</span></div>
          <div class="brand-name"><strong>АРКОН</strong><span>СИМУЛЯТОР ДЕРЖАВ</span></div>
        </div>
        <div class="campaign-card">
          <div class="campaign-head"><span>КАМПАНИЯ 01</span><button class="icon-button subtle" data-action="campaign-menu" aria-label="Меню кампании">${icon('settings', 15)}</button></div>
          <div class="campaign-name">${state.nation.name}</div>
          <div class="campaign-meta"><span class="status-dot"></span><span>Наследие корон · ход ${state.turn}</span><span class="campaign-difficulty">III</span></div>
          <div class="campaign-progress"><span style="width:${percent(state.turn, 60)}%"></span></div>
        </div>
        <div class="nav-section">
          <div class="nav-label">УПРАВЛЕНИЕ</div>
          ${navItem('overview', 'Обзор', '01')}
          ${navItem('map', 'Карта мира', '02')}
          ${navItem('economy', 'Экономика', '03')}
          ${navItem('diplomacy', 'Дипломатия', '04', '2')}
        </div>
        <div class="nav-section nav-section-lower">
          <div class="nav-label">ДЕРЖАВА</div>
          ${navItem('military', 'Военное дело', '05')}
          ${navItem('science', 'Наука', '06', state.researched.length >= 2 ? '' : '1')}
          ${navItem('chronicle', 'Летопись', '07')}
        </div>
        <div class="sidebar-bottom">
          <div class="network-status"><span class="status-dot"></span><span>СИНХРОНИЗИРОВАНО</span></div>
          <div class="player-card">
            <div class="player-avatar">${state.nation.ruler.split(' ').map((x) => x[0]).join('')}</div>
            <div class="player-details"><strong>${state.nation.ruler}</strong><span>Государь${state.nation.government.includes('республика') ? ' государства' : ' королевства'}</span></div>
            <button class="icon-button subtle" data-action="open-settings" aria-label="Настройки">${icon('settings', 15)}</button>
          </div>
        </div>
      </aside>
      <main class="main-area">
        <header class="topbar">
          <div class="topbar-context">
            <span class="crumb">${state.nation.shortName} <i>/</i> ${active.label.toUpperCase()}</span>
            <span class="context-separator"></span>
            <span class="era-context">${era.name}</span>
          </div>
          <div class="topbar-actions">
            <button class="top-icon-button" data-action="open-search" aria-label="Поиск">${icon('search', 18)}</button>
            <button class="top-icon-button notification-button" data-action="open-notifications" aria-label="Уведомления">${icon('bell', 18)}<span class="notification-dot">${state.noticeCount}</span></button>
            <span class="top-divider"></span>
            <div class="date-display"><span>${seasonName()}, ${state.year}</span><small>ХОД ${state.turn} / 60</small></div>
            <button class="advance-turn ${state.paused ? 'paused' : ''}" data-action="advance-turn"><span class="advance-icon">${icon(state.paused ? 'play' : 'play', 13)}</span><span>${state.paused ? 'Продолжить' : 'Следующий ход'}</span><kbd>SPACE</kbd></button>
          </div>
        </header>
        <div class="page-content">
          <div class="page-heading">
            <div>
              <div class="eyebrow"><span class="eyebrow-line"></span>${active.label.toUpperCase()} <span class="eyebrow-code">/ 0${Object.keys(views).indexOf(state.activeView) + 1}</span></div>
              <h1>${active.title}</h1>
              <p>${active.subtitle}</p>
            </div>
            <div class="heading-actions">
              <button class="outline-button" data-action="open-goals">${icon('flag', 15)} <span>Цели</span><b>3</b></button>
              <button class="primary-button" data-action="open-state-modal">${icon('crown', 16)} <span>Настроить державу</span></button>
            </div>
          </div>
          <div id="view-content">${renderView()}</div>
        </div>
      </main>
    </div>
  `;
  bindShellEvents();
}

function navItem(id, label, key, badge = '') {
  return `<button class="nav-item ${state.activeView === id ? 'active' : ''}" data-view="${id}"><span class="nav-icon">${icon(id, 17)}</span><span>${label}</span><span class="nav-key">${badge || key}</span></button>`;
}

function renderView() {
  switch (state.activeView) {
    case 'map': return renderMapView();
    case 'economy': return renderEconomyView();
    case 'diplomacy': return renderDiplomacyView();
    case 'military': return renderMilitaryView();
    case 'science': return renderScienceView();
    case 'chronicle': return renderChronicleView();
    default: return renderOverview();
  }
}

function metricCard(iconName, label, value, detail, tone = 'neutral', action = '') {
  return `<div class="metric-card ${tone ? `tone-${tone}` : ''} ${action ? 'clickable' : ''}" ${action ? `data-action="${action}"` : ''}>
    <div class="metric-head"><span class="metric-icon">${icon(iconName, 16)}</span><span>${label}</span>${action ? `<span class="metric-arrow">${icon('chevron', 14)}</span>` : ''}</div>
    <div class="metric-value">${value}</div>
    <div class="metric-detail">${detail}</div>
  </div>`;
}

function renderEraRail() {
  const era = currentEra();
  const eras = [
    { label: 'Средневековье', date: '1066', icon: 'crown' },
    { label: 'Новое время', date: '1500', icon: 'scroll' },
    { label: 'Индустрия', date: '1750', icon: 'hammer' },
    { label: 'Современность', date: '1900+', icon: 'science' },
  ];
  return `<section class="era-rail panel"><div class="era-rail-title"><div class="panel-kicker">ПУТЬ ГОСУДАРСТВА</div><strong>Пять веков решений</strong><small>От корон и крепостей к индустрии и современным институтам</small></div><div class="era-rail-track">${eras.map((item, index) => `<button class="era-rail-node ${index < era.index ? 'passed' : ''} ${index === era.index ? 'current' : ''}" data-action="open-science"><span>${icon(item.icon, 13)}</span><b>${item.label}</b><small>${item.date}</small></button>${index < eras.length - 1 ? `<i class="era-rail-line ${index < era.index ? 'passed' : ''}"></i>` : ''}`).join('')}</div><button class="text-link" data-action="open-science">Дерево технологий <span>${icon('arrow', 13)}</span></button></section>`;
}

function renderOverview() {
  const r = state.resources;
  return `
    <div class="metric-grid">
      ${metricCard('coin', 'Казна', fmt(r.treasury), `<span class="positive">${signed(r.income)}</span> за ход`, 'gold', 'open-economy')}
      ${metricCard('people', 'Население', `${fmt(r.population)}`, `<span class="positive">+1.8%</span> за год`, 'green', 'open-population')}
      ${metricCard('wheat', 'Продовольствие', `${r.food}%`, `запас на ${Math.round(r.food / 9)} мес.`, r.food < 50 ? 'red' : 'green', 'open-economy')}
      ${metricCard('shield', 'Стабильность', `${r.stability}%`, r.stability > 65 ? 'Уверенный порядок' : 'Требуется внимание', r.stability > 65 ? 'green' : 'red', 'open-diplomacy')}
      ${metricCard('science', 'Наука', `${r.research}`, `<span class="positive">+4</span> очка за ход`, 'blue', 'open-science')}
    </div>
    ${renderEraRail()}
    <div class="overview-grid">
      <section class="panel map-panel">
        <div class="panel-header map-panel-header">
          <div><div class="panel-kicker"><span class="live-dot"></span>РАЗВЕДЫВАТЕЛЬНАЯ КАРТА</div><h2>Западный континент</h2></div>
          <div class="panel-header-actions"><span class="panel-code">СЕЗОН 42.3</span><button class="panel-icon-button" data-action="open-map">${icon('arrow', 16)}</button></div>
        </div>
        ${mapMarkup('overview')}
        <div class="map-footer"><div class="legend"><span><i class="legend-swatch own"></i>${state.nation.shortName}</span><span><i class="legend-swatch ally"></i>Союзники</span><span><i class="legend-swatch rival"></i>Соперники</span><span><i class="legend-swatch contested"></i>Спорная зона</span></div><span class="map-scale">МАСШТАБ 1 : 4.8M</span></div>
      </section>
      <aside class="side-stack">
        ${renderCouncilCard()}
        ${renderSituationCard()}
      </aside>
    </div>
    <div class="lower-grid">
      ${renderQueueCard()}
      ${renderNotificationsCard()}
      ${renderPowerCard()}
    </div>
  `;
}

function mapMarkup(mode = 'overview') {
  const transform = mode === 'map' ? `transform="translate(0 0) scale(${state.mapZoom})"` : '';
  return `<div class="map-wrap ${mode === 'map' ? 'large-map' : ''}">
    <div class="map-toolbar"><button data-action="map-zoom-out" aria-label="Уменьшить">−</button><span>${Math.round(state.mapZoom * 100)}%</span><button data-action="map-zoom-in" aria-label="Увеличить">+</button><span class="toolbar-divider"></span><button data-action="map-reset" aria-label="Сбросить масштаб">${icon('filter', 14)}</button></div>
    <svg class="world-map" viewBox="0 0 780 430" role="img" aria-label="Карта западного континента">
      <defs>
        <pattern id="mapGrid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" fill="none" stroke="#b2c6bc" stroke-opacity=".09" stroke-width="1"/></pattern>
        <filter id="softGlow"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      <rect width="780" height="430" fill="url(#mapGrid)" opacity=".6"/>
      <g class="map-sea-labels"><text x="612" y="330">ЗАПАДНОЕ МОРЕ</text><text x="67" y="278">КРАСНЫЙ ПЕРЕВАЛ</text></g>
      <g class="map-routes"><path d="M300 235 C370 205 430 190 540 133"/><path d="M345 267 C440 278 501 278 604 246"/><path d="M270 190 C246 143 222 104 202 65"/></g>
      <g class="territory-glow"><path d="M181 146 L223 101 281 112 310 158 368 166 395 226 367 282 321 319 268 294 221 307 193 266 142 253 153 204Z"/></g>
      <g class="map-territories" ${transform}>
        <path class="landmass neighbor-nord" d="M69 63 L137 28 207 35 254 70 285 107 242 133 194 125 161 147 111 121 61 128 34 97Z" data-province="nord"/>
        <path class="landmass ally-kael" d="M451 51 L509 27 574 40 622 76 612 125 562 138 529 115 483 129 443 101Z" data-province="kael"/>
        <path class="landmass rival-grey" d="M574 143 L647 121 709 151 735 210 700 259 647 270 608 245 574 207Z" data-province="greycoast"/>
        <path class="landmass own-north" d="M163 141 L204 119 247 132 278 165 304 193 278 225 232 216 197 237 159 210 138 176Z" data-province="northmarch"/>
        <path class="landmass own-capital" d="M244 205 L288 175 333 191 359 221 341 264 304 281 262 266 226 240Z" data-province="valoria"/>
        <path class="landmass own-east" d="M341 220 L385 211 428 232 453 272 428 312 383 322 346 287 337 256Z" data-province="eastgate"/>
        <path class="landmass own-south" d="M222 245 L264 260 308 279 347 291 333 339 287 369 237 360 201 330 179 284Z" data-province="serev"/>
        <path class="landmass contested" d="M433 163 L480 145 524 165 550 200 520 231 481 223 448 244 417 217Z" data-province="greycoast"/>
        <path class="border-line" d="M204 119 247 132 278 165M288 175 333 191 359 221M264 260 308 279 347 291"/>
      </g>
      <g class="map-labels" ${transform}>
        <g class="map-label" data-province="nord"><circle cx="194" cy="77" r="4"/><text x="206" y="80">НОРДХЕЙМ</text><text class="label-sub" x="206" y="94">СОПЕРНИК</text></g>
        <g class="map-label selected" data-province="valoria"><circle cx="292" cy="226" r="5"/><text x="306" y="224">ВАЛОРИЯ</text><text class="label-sub" x="306" y="239">СТОЛИЦА</text></g>
        <g class="map-label" data-province="kael"><circle cx="525" cy="80" r="4"/><text x="537" y="83">КАЭЛЬ</text><text class="label-sub" x="537" y="97">СОЮЗНИК</text></g>
        <g class="map-label contested-label" data-province="greycoast"><circle cx="472" cy="187" r="4"/><text x="483" y="185">СЕРАЯ КОСА</text><text class="label-sub" x="483" y="199">СПОРНАЯ ЗОНА</text></g>
      </g>
      <g class="map-marker marker-danger" transform="translate(214 145)"><path d="M0-13 11 7H-11Z"/><text x="0" y="2">!</text></g>
      <g class="map-marker marker-ally" transform="translate(503 158)"><circle r="11"/><path d="M-5 0h10M0-5v10"/></g>
      <g class="map-marker marker-port" transform="translate(402 288)"><circle r="10"/><path d="M-5 3h10M-3-4v7M3-4v7"/></g>
    </svg>
    <div class="map-coordinates"><span>42° 18′ N</span><span>14° 06′ E</span></div>
  </div>`;
}

function renderCouncilCard() {
  return `<section class="panel council-card">
    <div class="panel-header"><div><div class="panel-kicker">СОВЕТ ПРИ КОРОНЕ</div><h3>Пульс державы</h3></div><span class="unread-count">3</span></div>
    <div class="council-list">
      <button class="council-item" data-action="open-notifications"><span class="council-item-icon danger">${icon('sword', 15)}</span><span><strong>Граница на севере</strong><small>Нордхейм мобилизует силы</small></span><span class="council-arrow">${icon('chevron', 14)}</span></button>
      <button class="council-item" data-action="open-diplomacy"><span class="council-item-icon gold">${icon('diplomacy', 15)}</span><span><strong>Посольство Лигории</strong><small>Торговое предложение ожидает</small></span><span class="council-arrow">${icon('chevron', 14)}</span></button>
      <button class="council-item" data-action="open-economy"><span class="council-item-icon green">${icon('coin', 15)}</span><span><strong>Гавань приносит доход</strong><small>Производство выросло на 14%</small></span><span class="council-arrow">${icon('chevron', 14)}</span></button>
    </div>
    <button class="text-link" data-action="open-notifications">Все донесения <span>${icon('arrow', 13)}</span></button>
  </section>`;
}

function renderSituationCard() {
  return `<section class="panel situation-card">
    <div class="panel-header"><div><div class="panel-kicker">СТРАТЕГИЧЕСКАЯ СИТУАЦИЯ</div><h3>Хрупкое равновесие</h3></div><span class="signal-ring"><i></i></span></div>
    <div class="situation-copy">Северная граница требует внимания. Дипломатический манёвр может сохранить ресурсы для реформ.</div>
    <div class="situation-bars"><div><span><small>Военная готовность</small><b>68%</b></span><div class="progress-bar"><i class="fill-blue" style="width:68%"></i></div></div><div><span><small>Доверие союзников</small><b>74%</b></span><div class="progress-bar"><i class="fill-green" style="width:74%"></i></div></div></div>
    <button class="subtle-action" data-action="open-diplomacy">Открыть дипломатический контур ${icon('arrow', 14)}</button>
  </section>`;
}

function renderQueueCard() {
  return `<section class="panel queue-card"><div class="panel-header"><div><div class="panel-kicker">ПОРЯДОК ДЕЙСТВИЙ</div><h3>Активные проекты</h3></div><button class="panel-icon-button" data-action="open-build">${icon('plus', 16)}</button></div><div class="queue-list">${state.queue.map((item) => `<div class="queue-item"><span class="queue-icon ${item.done ? 'done' : ''}">${icon(item.icon, 15)}</span><span class="queue-info"><strong>${item.name}</strong><small>${item.type}${item.detail ? ` · ${item.detail}` : ''}</small></span><span class="queue-progress"><b>${item.progress}%</b><i><em style="width:${item.progress}%"></em></i></span></div>`).join('')}</div><button class="text-link" data-action="open-build">Управлять очередью <span>${icon('arrow', 13)}</span></button></section>`;
}

function renderNotificationsCard() {
  return `<section class="panel notifications-card"><div class="panel-header"><div><div class="panel-kicker">ПОСЛЕДНИЕ ДОНЕСЕНИЯ</div><h3>Что изменилось</h3></div><span class="date-stamp">ЗИМА · 1184</span></div><div class="notification-list">${state.notifications.map((n) => `<button class="notification-row" data-action="open-notifications"><span class="notification-icon ${n.type}">${icon(n.icon, 14)}</span><span><strong>${n.title}</strong><small>${n.body}</small></span><time>${n.time}</time></button>`).join('')}</div></section>`;
}

function renderPowerCard() {
  return `<section class="panel power-card"><div class="panel-header"><div><div class="panel-kicker">РАСКЛАД СИЛ</div><h3>Влияние в регионе</h3></div><button class="panel-icon-button" data-action="open-map">${icon('arrow', 16)}</button></div><div class="power-chart"><div class="donut-chart"><div><strong>18</strong><small>место</small></div></div><div class="power-legend"><div><span><i class="power-dot you"></i>${state.nation.shortName}</span><b>34%</b></div><div><span><i class="power-dot rival"></i>Нордхейм</span><b>29%</b></div><div><span><i class="power-dot ally"></i>Лигория</span><b>21%</b></div><div><span><i class="power-dot other"></i>Прочие</span><b>16%</b></div></div></div><div class="power-foot"><span>Ваша позиция</span><strong>Растёт <span class="positive">↗ 4.2%</span></strong></div></section>`;
}

function renderMapView() {
  const p = selectedProvince();
  return `<div class="map-view-grid"><section class="panel map-panel map-panel-full"><div class="panel-header map-panel-header"><div><div class="panel-kicker"><span class="live-dot"></span>АТЛАС КАМПАНИИ / РАЗВЕДКА</div><h2>Западный континент</h2></div><div class="map-view-controls"><button class="outline-button compact" data-action="map-reset">${icon('filter', 14)} Сбросить вид</button><span class="panel-code">ПОСЛЕДНЕЕ ОБНОВЛЕНИЕ: 2 ЧАСА НАЗАД</span></div></div>${mapMarkup('map')}<div class="map-footer"><div class="legend"><span><i class="legend-swatch own"></i>Территория Вейры</span><span><i class="legend-swatch ally"></i>Союзный блок</span><span><i class="legend-swatch rival"></i>Нейтральные / враждебные</span><span><i class="legend-swatch contested"></i>Претензии</span></div><span class="map-scale">КООРДИНАТЫ 42°N / 14°E</span></div></section><aside class="panel province-panel"><div class="province-image"><span class="province-stamp">${p.type.toUpperCase()}</span><div class="province-emblem">${icon(p.owner === 'you' ? 'crown' : p.owner === 'rival' ? 'sword' : 'flag', 31)}</div><div class="province-image-label"><small>РЕГИОН</small><h2>${p.name}</h2></div></div><div class="province-content"><div class="province-meta"><span>${p.owner === 'you' ? 'ПОД КОНТРОЛЕМ' : p.owner === 'ally' ? 'ДРУЖЕСТВЕННАЯ ДЕРЖАВА' : p.owner === 'contested' ? 'ЗОНА ИНТЕРЕСОВ' : 'ИНОСТРАННАЯ ДЕРЖАВА'}</span><i class="province-status ${statusClass(p.color)}"></i></div><p>${p.description}</p><div class="province-stats"><div><small>НАСЕЛЕНИЕ</small><strong>${p.population}</strong></div><div><small>ВЫПУСК</small><strong>${p.output} <em>₣</em></strong></div><div><small>ЛОЯЛЬНОСТЬ</small><strong>${p.loyalty}%</strong></div></div><div class="tag-row">${p.tags.map((tag) => `<span>${tag}</span>`).join('')}</div><div class="province-section"><div class="section-title"><span>КЛЮЧЕВЫЕ ОБЪЕКТЫ</span><button class="text-link" data-action="open-build">Добавить ${icon('plus', 12)}</button></div>${p.buildings.map((building, i) => `<div class="building-row"><span class="building-number">0${i + 1}</span><span>${building}</span><i>${icon(i === 0 ? 'crown' : 'hammer', 14)}</i></div>`).join('')}</div><div class="province-actions"><button class="outline-button compact" data-action="inspect-province">Подробности</button><button class="primary-button compact" data-action="province-action">${p.owner === 'you' ? 'Развить регион' : p.owner === 'ally' ? 'Укрепить союз' : 'Выдвинуть претензию'} ${icon('arrow', 13)}</button></div></div></aside></div><div class="map-intel-row"><div class="panel map-intel-card"><div class="panel-kicker">ТОРГОВЫЕ ПУТИ</div><h3>Восточный маршрут открыт</h3><p>Новая гавань соединяет Вейру с Лигорией. Доход от торговли вырастет на <b>+14 ₣</b> за ход.</p><div class="intel-route"><span>ВАЛОРИЯ</span><i></i><span>ЛИГОРИЯ</span><i></i><span>КАЭЛЬ</span></div></div><div class="panel map-intel-card"><div class="panel-kicker">ПРОГНОЗ КОНФЛИКТА</div><h3>Перевал под наблюдением</h3><p>Вероятность провокации Нордхейма в ближайшие 3 хода — <b class="danger-text">41%</b>.</p><div class="risk-meter"><span style="width:41%"></span></div></div><div class="panel map-intel-card map-intel-cta"><span class="intel-cta-icon">${icon('flag', 18)}</span><div><div class="panel-kicker">НОВАЯ ЦЕЛЬ</div><h3>Разведать Серую косу</h3><p>Награда: +12 влияния</p></div><button class="round-arrow" data-action="claim">${icon('arrow', 15)}</button></div></div>`;
}

function renderEconomyView() {
  const r = state.resources;
  const allocation = [
    ['Казна и сборы', 'Общий доход государства', '620 ₣', 54, 'gold'],
    ['Содержание армии', 'Гарнизоны и снабжение', '−184 ₣', 30, 'red'],
    ['Развитие и наука', 'Инфраструктура и академии', '−126 ₣', 20, 'blue'],
    ['Двор и дипломатия', 'Представительство', '−72 ₣', 12, 'green'],
  ];
  return `<div class="economy-top"><div class="panel treasury-hero"><div class="panel-kicker">ФИНАНСОВЫЙ КОНТУР</div><div class="treasury-main"><div><small>ДОСТУПНАЯ КАЗНА</small><strong>${fmt(r.treasury)} <em>₣</em></strong><span class="positive">${signed(r.income)} за ход</span></div><div class="treasury-spark"><svg viewBox="0 0 180 70" preserveAspectRatio="none"><path d="M0 57 C17 52 27 59 41 43 S59 47 70 37 88 46 100 31 119 30 133 24 145 28 157 12 171 17 180 7"/><path class="spark-fill" d="M0 57 C17 52 27 59 41 43 S59 47 70 37 88 46 100 31 119 30 133 24 145 28 157 12 171 17 180 7V70H0Z"/></svg><small>ДОХОД ЗА 12 ХОДОВ</small></div></div><div class="treasury-bottom"><span>Бюджет сбалансирован</span><span><i class="status-dot"></i>Стабильный рост</span></div></div><div class="panel economy-score"><div class="panel-kicker">ЭКОНОМИЧЕСКИЙ ИНДЕКС</div><div class="score-number">72<span>/100</span></div><div class="score-change positive">↗ 8 за этот год</div><div class="score-meter"><span style="width:72%"></span></div><p>Выше среднего среди соседей</p></div><div class="panel resource-mini"><div class="panel-kicker">РЕСУРСНЫЙ БАЛАНС</div><div class="mini-resource"><span class="mini-resource-icon food">${icon('wheat', 15)}</span><span><small>Зерно</small><b>9 240</b></span><em>+3.4%</em></div><div class="mini-resource"><span class="mini-resource-icon iron">${icon('hammer', 15)}</span><span><small>Железо</small><b>2 180</b></span><em>+1.1%</em></div><div class="mini-resource"><span class="mini-resource-icon trade">${icon('coin', 15)}</span><span><small>Торговля</small><b>84%</b></span><em>+12%</em></div></div></div><div class="economy-grid"><section class="panel allocation-panel"><div class="panel-header"><div><div class="panel-kicker">ПОТОКИ БЮДЖЕТА</div><h3>Куда уходят деньги</h3></div><button class="outline-button compact" data-action="budget-modal">${icon('settings', 13)} Настроить</button></div><div class="allocation-chart"><div class="budget-donut"><div><strong>620</strong><small>₣ / ход</small></div></div><div class="allocation-list">${allocation.map(([name, desc, amount, width, tone]) => `<div class="allocation-row"><span class="allocation-color ${tone}"></span><span class="allocation-info"><b>${name}</b><small>${desc}</small></span><strong class="allocation-amount ${tone === 'red' ? 'negative' : ''}">${amount}</strong><span class="allocation-bar"><i class="${tone}" style="width:${width * 1.6}%"></i></span></div>`).join('')}</div></div></section><section class="panel development-panel"><div class="panel-header"><div><div class="panel-kicker">РАЗВИТИЕ ПРОВИНЦИЙ</div><h3>Проекты короны</h3></div><button class="panel-icon-button" data-action="open-build">${icon('plus', 16)}</button></div><div class="development-list"><div class="development-item"><span class="develop-icon">${icon('hammer', 17)}</span><span><b>Каменистая академия</b><small>Валория · Наука</small></span><div class="develop-progress"><span>72%</span><i><em style="width:72%"></em></i></div></div><div class="development-item"><span class="develop-icon green">${icon('wheat', 17)}</span><span><b>Ирригационный канал</b><small>Серевские поля · Еда</small></span><div class="develop-progress"><span>31%</span><i><em style="width:31%"></em></i></div></div><div class="development-item"><span class="develop-icon gold">${icon('coin', 17)}</span><span><b>Соляные копи</b><small>Серая коса · Ресурс</small></span><div class="develop-progress"><span>18%</span><i><em style="width:18%"></em></i></div></div></div><button class="text-link" data-action="open-build">Каталог построек <span>${icon('arrow', 13)}</span></button></section></div><div class="principles-strip"><div class="principle-icon">${icon('wheat', 17)}</div><div><div class="panel-kicker">СОВЕТ ЭКОНОМИСТА</div><p>Запас зерна покрывает <b>${Math.round(r.food / 9)} месяцев</b>. Развитие полей сейчас снизит риск голода при мобилизации.</p></div><button class="outline-button compact" data-action="open-build">Изучить проекты</button></div>`;
}

function renderDiplomacyView() {
  return `<div class="diplomacy-head"><div class="panel diplomatic-score"><div class="score-orbit"><div><strong>57</strong><small>влияние</small></div></div><div><div class="panel-kicker">ДИПЛОМАТИЧЕСКИЙ ВЕС</div><h3>Осторожный игрок</h3><p>Ваши договоры соблюдаются. Соседи ждут ясной позиции.</p><span class="positive">+6 с начала года</span></div></div><div class="panel treaty-banner"><div class="treaty-seal">${icon('shield', 22)}</div><div><div class="panel-kicker">ГЛАВНАЯ ЛИНИЯ</div><h3>Сдержать Нордхейм</h3><p>Укрепите пакт с Каэлем или предложите перемирие северному соседу.</p></div><button class="primary-button compact" data-action="diplomatic-action">Открыть переговоры ${icon('arrow', 13)}</button></div></div><div class="diplomacy-grid"><section class="panel relations-panel"><div class="panel-header"><div><div class="panel-kicker">КАРТА ОТНОШЕНИЙ</div><h3>Соседние державы</h3></div><button class="outline-button compact" data-action="diplomatic-action">${icon('filter', 13)} Фильтры</button></div><div class="relation-table"><div class="relation-header"><span>ДЕРЖАВА</span><span>ОТНОШЕНИЕ</span><span>ДОГОВОР</span><span></span></div>${[{name:'Княжество Каэль', sub:'Союзник · 96k населения', initials:'К', color:'#75988b', relation:82, relationText:'Надёжный союзник', treaty:'Оборона'}, {name:'Лигория', sub:'Торговая лига · 210k населения', initials:'Л', color:'#bb9861', relation:57, relationText:'Прагматично', treaty:'Торговля'}, {name:'Нордхейм', sub:'Соперник · 142k населения', initials:'Н', color:'#9b5e55', relation:-38, relationText:'Враждебность', treaty:'Нет договора'}, {name:'Вольные города', sub:'Нейтральные · 88k населения', initials:'В', color:'#687b83', relation:12, relationText:'Настороженно', treaty:'Нет договора'}].map((x) => `<div class="relation-row"><span class="relation-name"><i style="background:${x.color}">${x.initials}</i><span><b>${x.name}</b><small>${x.sub}</small></span></span><span class="relation-value"><b class="${x.relation < 0 ? 'negative' : 'positive'}">${x.relation > 0 ? '+' : ''}${x.relation}</b><i class="relation-track"><em class="${x.relation < 0 ? 'negative' : ''}" style="width:${Math.abs(x.relation)}%"></em></i><small>${x.relationText}</small></span><span class="treaty-pill">${x.treaty}</span><button class="row-arrow" data-action="diplomatic-action">${icon('chevron', 15)}</button></div>`).join('')}</div></section><aside class="panel allies-panel"><div class="panel-header"><div><div class="panel-kicker">СЕТЬ ДОГОВОРОВ</div><h3>Ваши обязательства</h3></div><span class="panel-code">2 АКТИВНЫХ</span></div><div class="ally-cards">${state.allies.map((a) => `<div class="ally-card"><div class="ally-avatar" style="background:${a.color}">${a.initials}</div><div class="ally-info"><b>${a.name}</b><small>${a.status} · с ${a.since}</small></div><span class="ally-strength">${a.relation}%</span></div>`).join('')}</div><div class="obligation"><span class="obligation-icon">${icon('shield', 15)}</span><span><b>Обещание защиты</b><small>Каэль рассчитывает на 1 200 солдат</small></span><em>через 4 хода</em></div><button class="text-link" data-action="diplomatic-action">Все договоры <span>${icon('arrow', 13)}</span></button></aside></div><div class="diplomatic-actions"><div class="action-intro"><div class="panel-kicker">ДИПЛОМАТИЧЕСКИЕ ДЕЙСТВИЯ</div><h3>Ваш следующий ход</h3><p>Любое действие меняет карту доверия.</p></div><button class="action-tile" data-action="diplomatic-action"><span class="action-tile-icon blue">${icon('diplomacy', 18)}</span><b>Отправить посла</b><small>Улучшить отношения</small><em>−12 влияния</em></button><button class="action-tile" data-action="diplomatic-action"><span class="action-tile-icon gold">${icon('scroll', 18)}</span><b>Предложить договор</b><small>Закрепить торговлю</small><em>−24 влияния</em></button><button class="action-tile" data-action="diplomatic-action"><span class="action-tile-icon red">${icon('sword', 18)}</span><b>Выдвинуть ультиматум</b><small>Повысить ставки</small><em>−8 стабильности</em></button></div>`;
}

function renderMilitaryView() {
  return `<div class="military-overview"><div class="panel army-readiness"><div class="panel-kicker">ВОЕННЫЙ КОНТУР</div><div class="readiness-line"><div><small>ГОТОВНОСТЬ АРМИИ</small><strong>68<span>%</span></strong></div><div class="readiness-ring"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="17"/><circle class="ring-value" cx="22" cy="22" r="17"/></svg></div></div><div class="progress-bar large"><i class="fill-red" style="width:68%"></i></div><div class="readiness-meta"><span>18 400 / 26 000 бойцов</span><span class="positive">+2 полка в очереди</span></div></div><div class="panel military-stat"><span class="metric-icon red">${icon('sword', 17)}</span><small>СИЛА НА ФРОНТЕ</small><strong>7 240</strong><span>Боеспособных</span></div><div class="panel military-stat"><span class="metric-icon gold">${icon('shield', 17)}</span><small>ЗАЩИТА ГРАНИЦ</small><strong>82</strong><span>Фортов и застав</span></div><div class="panel military-stat"><span class="metric-icon blue">${icon('people', 17)}</span><small>РЕЗЕРВ</small><strong>11 160</strong><span>Доступно в запасе</span></div></div><div class="military-grid"><section class="panel army-panel"><div class="panel-header"><div><div class="panel-kicker">АРМИИ И ГАРНИЗОНЫ</div><h3>Под знамёнами короны</h3></div><button class="primary-button compact" data-action="recruit">${icon('plus', 14)} Создать полк</button></div><div class="army-list"><div class="army-row"><span class="army-banner red">I</span><span class="army-name"><b>Северная стража</b><small>Северный рубеж · Гарнизон</small></span><span class="army-commander"><small>КОМАНДИР</small><b>Эдрик Лоу</b></span><span class="army-strength"><i style="width:91%"></i><b>91%</b></span><button class="row-arrow" data-action="army-details">${icon('chevron', 15)}</button></div><div class="army-row"><span class="army-banner gold">II</span><span class="army-name"><b>Коронная гвардия</b><small>Валория · Полевой корпус</small></span><span class="army-commander"><small>КОМАНДИР</small><b>Леди Мирен</b></span><span class="army-strength"><i style="width:76%"></i><b>76%</b></span><button class="row-arrow" data-action="army-details">${icon('chevron', 15)}</button></div><div class="army-row queued"><span class="army-banner blue">III</span><span class="army-name"><b>Восточный легион</b><small>Формируется · ещё 2 хода</small></span><span class="army-commander"><small>КОМАНДИР</small><b>Не назначен</b></span><span class="army-strength"><i style="width:24%"></i><b>24%</b></span><button class="row-arrow" data-action="army-details">${icon('chevron', 15)}</button></div></div></section><aside class="panel conflict-panel"><div class="panel-header"><div><div class="panel-kicker">ТЕАТРЫ НАПРЯЖЕНИЯ</div><h3>Где будет удар</h3></div><span class="signal-ring danger"><i></i></span></div>${state.conflicts.map(c => `<div class="conflict-row"><div class="conflict-name"><span class="conflict-mark ${c.tone}"></span><span><b>${c.name}</b><small>${c.status}</small></span></div><div class="conflict-progress"><i style="width:${c.progress}%"></i><small>${c.detail}</small></div></div>`).join('')}<button class="text-link" data-action="open-map">Открыть карту фронтов <span>${icon('arrow', 13)}</span></button></aside></div><div class="war-actions"><div><div class="panel-kicker">РЕШЕНИЯ ГЕНЕРАЛЬНОГО ШТАБА</div><h3>Выберите доктрину</h3></div><button class="doctrine-card active" data-action="doctrine"><span>${icon('shield', 18)}</span><b>Сдерживание</b><small>−10% содержания армии</small><i>${icon('check', 13)}</i></button><button class="doctrine-card" data-action="doctrine"><span>${icon('sword', 18)}</span><b>Агрессивная оборона</b><small>+12% сила на границе</small></button><button class="doctrine-card" data-action="doctrine"><span>${icon('flag', 18)}</span><b>Большая мобилизация</b><small>+25% рекрутов · −8 стабильности</small></button></div>`;
}

function renderScienceView() {
  const hasGunpowder = state.researched.includes('Пороховая смесь');
  const techs = [
    { era: 'ВЫСОКОЕ СРЕДНЕВЕКОВЬЕ', title: 'Освоено', items: [{ name: 'Феодальное право', desc: 'Легитимность и вассалы', done: true }, { name: 'Основы картографии', desc: 'Точность разведки', done: true }] },
    { era: 'ПОЗДНЕЕ СРЕДНЕВЕКОВЬЕ', title: hasGunpowder ? 'Последние открытия' : 'Доступно для изучения', items: [{ name: 'Пороховая смесь', desc: 'Осадные орудия и новые войска', done: hasGunpowder, cost: '42 науки', tone: 'blue' }, { name: 'Гильдейская бухгалтерия', desc: '−8% содержание построек', cost: '36 науки', tone: 'gold' }, { name: 'Печатный станок', desc: 'Указы и распространение идей', cost: '58 науки', tone: 'green' }] },
    { era: 'РАННЕЕ НОВОЕ ВРЕМЯ', title: 'Заблокировано', items: [{ name: 'Морская навигация', desc: 'Дальний океанский флот', lock: 'Требуется 1 технология' }, { name: 'Центральный банк', desc: 'Стабильная кредитная система', lock: 'Требуется 2 технологии' }] },
    { era: 'ИНДУСТРИАЛЬНАЯ ЭПОХА', title: 'Горизонт реформ', items: [{ name: 'Паровая машина', desc: 'Мануфактуры и железные дороги', lock: 'Требуется эпоха 3' }, { name: 'Национальная школа', desc: '+12% рост образования', lock: 'Требуется эпоха 3' }] },
    { era: 'СОВРЕМЕННОСТЬ', title: 'Дальний горизонт', items: [{ name: 'Электрификация', desc: 'Города нового века', lock: 'Требуется эпоха 4' }, { name: 'Цифровое управление', desc: 'Скорость решений и связи', lock: 'Требуется эпоха 4' }, { name: 'Орбитальная программа', desc: 'Государство выходит за пределы карты', lock: 'Особая веха' }] },
  ];
  return `<div class="science-summary"><div class="panel science-progress-card"><div class="panel-kicker">ПУТЬ ПРОГРЕССА</div><div class="science-main"><div><strong>${state.resources.research}</strong><small>очков науки</small></div><div class="science-next"><span>${hasGunpowder ? 'До следующего открытия' : 'До «Пороховой смеси»'}</span><b>${hasGunpowder ? '4 / 36' : '42 / 42'}</b><i><em style="width:${hasGunpowder ? percent(state.resources.research, 36) : 100}%"></em></i></div></div><div class="science-footer"><span>Академия Валории приносит <b>+4</b> за ход</span><button class="text-link" data-action="research">Открыть академию ${icon('arrow', 13)}</button></div></div><div class="panel research-focus"><span class="focus-icon">${icon('science', 20)}</span><div><div class="panel-kicker">ФОКУС ИССЛЕДОВАНИЙ</div><h3>Военная инженерия</h3><p>Следующий бонус: +8% к осадным орудиям</p></div><button class="outline-button compact" data-action="research">Сменить</button></div></div><div class="technology-tree">${techs.map((group, groupIndex) => `<section class="tech-era ${groupIndex === 1 ? 'current' : ''}"><div class="tech-era-header"><div><span class="era-number">0${groupIndex + 1}</span><span class="panel-kicker">${group.era}</span><h3>${group.title}</h3></div>${groupIndex === 1 ? '<span class="current-badge">ТЕКУЩАЯ ЭРА</span>' : ''}</div><div class="tech-grid">${group.items.map((t, i) => `<button class="tech-card ${t.done ? 'done' : ''} ${t.lock ? 'locked' : ''}" data-action="${t.done || t.lock ? 'tech-info' : 'research'}"><div class="tech-card-top"><span class="tech-symbol ${t.tone || (t.done ? 'done' : '')}">${t.done ? icon('check', 15) : t.lock ? icon('lock', 14) : icon(i === 0 ? 'sword' : i === 1 ? 'coin' : 'scroll', 15)}</span><span class="tech-status">${t.done ? 'ИЗУЧЕНО' : t.lock ? 'ЗАКРЫТО' : 'ДОСТУПНО'}</span></div><b>${t.name}</b><small>${t.desc}</small><em>${t.done ? 'Открыто' : t.cost || t.lock}</em>${!t.done && !t.lock ? `<span class="tech-arrow">${icon('arrow', 14)}</span>` : ''}</button>`).join('')}</div></section>`).join('')}</div>`;
}

function renderChronicleView() {
  return `<div class="chronicle-head"><div class="panel legacy-card"><div class="legacy-emblem">${icon('crown', 24)}</div><div><div class="panel-kicker">НАСЛЕДИЕ ${state.nation.shortName}</div><h2>${state.nation.motto}</h2><p>Государство живёт столько, сколько помнит цену своих решений.</p></div></div><div class="panel chronicle-score"><div class="panel-kicker">РЕПУТАЦИЯ</div><strong>38</strong><span>престижа</span><div class="progress-bar"><i class="fill-gold" style="width:38%"></i></div></div><div class="panel chronicle-score"><div class="panel-kicker">ВЕХИ КАМПАНИИ</div><strong>07</strong><span>из 24 событий</span><div class="progress-bar"><i class="fill-blue" style="width:29%"></i></div></div></div><div class="chronicle-layout"><section class="panel timeline-panel"><div class="panel-header"><div><div class="panel-kicker">ХОДЫ И РЕШЕНИЯ</div><h3>Летопись короны</h3></div><button class="outline-button compact" data-action="chronicle-filter">${icon('filter', 13)} Фильтр</button></div><div class="timeline">${state.logs.map((log, i) => `<div class="timeline-entry"><div class="timeline-marker ${log.tone}">${i === 0 ? icon('crown', 13) : icon(i === 1 ? 'diplomacy' : 'sword', 13)}</div><div class="timeline-date"><b>${log.year}</b><small>${log.season}</small></div><div class="timeline-copy"><h4>${log.title}</h4><p>${log.body}</p><span>${i === 0 ? 'Текущий момент' : `Ход ${42 - i * 7}`}</span></div></div>`).join('')}</div><button class="load-more" data-action="chronicle-more">Показать ранние записи <span>${icon('arrowDown', 14)}</span></button></section><aside class="chronicle-side"><div class="panel stats-panel"><div class="panel-kicker">ПОКАЗАТЕЛИ ПРАВЛЕНИЯ</div><div class="rule-stat"><span>Легитимность</span><b>${state.resources.legitimacy}%</b><i><em style="width:${state.resources.legitimacy}%"></em></i></div><div class="rule-stat"><span>Авторитет</span><b>${state.resources.authority}%</b><i><em style="width:${state.resources.authority}%"></em></i></div><div class="rule-stat"><span>Престиж</span><b>${state.resources.prestige}</b><i><em style="width:${state.resources.prestige}%"></em></i></div></div><div class="panel next-era"><div class="panel-kicker">ГОРИЗОНТ</div><h3>Следующий век</h3><p>Ваши реформы определят, станет ли Вейра торговой республикой или военной монархией.</p><div class="era-road"><span class="era-node active">1184</span><i></i><span class="era-node">1300</span><i></i><span class="era-node future">1500</span></div></div></aside></div>`;
}

function bindShellEvents() {
  document.querySelectorAll('[data-view]').forEach((el) => el.addEventListener('click', () => {
    state.activeView = el.dataset.view;
    renderShell();
  }));
  document.querySelectorAll('[data-action]').forEach((el) => el.addEventListener('click', () => handleAction(el.dataset.action, el)));
  document.querySelectorAll('[data-province]').forEach((el) => el.addEventListener('click', (event) => {
    event.stopPropagation();
    state.selectedProvince = el.dataset.province;
    if (state.activeView !== 'map') { state.activeView = 'map'; }
    renderShell();
    toast(`Регион выбран: ${selectedProvince().name}`, 'info');
  }));
}

function handleAction(action, element) {
  switch (action) {
    case 'advance-turn': advanceTurn(); break;
    case 'open-map': state.activeView = 'map'; renderShell(); break;
    case 'open-economy': state.activeView = 'economy'; renderShell(); break;
    case 'open-diplomacy': state.activeView = 'diplomacy'; renderShell(); break;
    case 'open-science': state.activeView = 'science'; renderShell(); break;
    case 'open-notifications': openModal(notificationModal()); break;
    case 'open-state-modal': openModal(stateModal()); break;
    case 'open-goals': openModal(goalsModal()); break;
    case 'open-search': openModal(searchModal()); break;
    case 'open-settings': openModal(settingsModal()); break;
    case 'open-build': openModal(buildModal()); break;
    case 'budget-modal': openModal(budgetModal()); break;
    case 'recruit': openModal(recruitModal()); break;
    case 'army-details': openModal(armyModal()); break;
    case 'diplomatic-action': openModal(diplomacyModal()); break;
    case 'province-action': provinceAction(); break;
    case 'inspect-province': openModal(provinceModal()); break;
    case 'claim': claimProvince(); break;
    case 'research': researchTech(element); break;
    case 'tech-info': openModal(techInfoModal()); break;
    case 'doctrine': selectDoctrine(element); break;
    case 'map-zoom-in': state.mapZoom = Math.min(1.35, +(state.mapZoom + .1).toFixed(2)); refreshView(); break;
    case 'map-zoom-out': state.mapZoom = Math.max(.8, +(state.mapZoom - .1).toFixed(2)); refreshView(); break;
    case 'map-reset': state.mapZoom = 1; refreshView(); break;
    case 'campaign-menu': openModal(campaignModal()); break;
    case 'chronicle-filter': toast('Показаны ключевые события кампании', 'info'); break;
    case 'chronicle-more': toast('Ранние записи будут доступны после следующего рубежа кампании', 'info'); break;
    default: toast('Действие подготовлено к исполнению', 'info');
  }
}

function refreshView() {
  const target = document.querySelector('#view-content');
  if (target) { target.innerHTML = renderView(); bindShellEvents(); }
}

function advanceTurn() {
  if (state.turn >= 60) { toast('Кампания достигла последнего хода сценария', 'warning'); return; }
  state.turn += 1;
  if (state.season === 3) { state.season = 0; state.year += 1; } else state.season += 1;
  state.resources.treasury += state.resources.income;
  state.resources.population += Math.round(state.resources.population * 0.0045);
  state.resources.research += 4;
  state.resources.food = Math.max(0, state.resources.food - 1);
  state.queue = state.queue.map((item) => item.done ? item : ({ ...item, progress: Math.min(100, item.progress + 12), detail: item.progress + 12 >= 100 ? 'готово' : item.detail, done: item.progress + 12 >= 100 }));
  if (state.turn === 45) state.notifications.unshift({ type: 'danger', title: 'Нордхейм выдвинул условия', body: 'На северной границе замечены парламентёры и новые знамёна.', time: 'только что', icon: 'flag' });
  state.noticeCount = Math.min(9, state.noticeCount + 1);
  renderShell();
  toast(`Наступил новый ход: ${seasonName()}, ${state.year}`, 'success');
}

function provinceAction() {
  const p = selectedProvince();
  if (p.owner === 'you') {
    if (state.resources.treasury < 800) { toast('Недостаточно средств для развития региона', 'warning'); return; }
    state.resources.treasury -= 800;
    state.queue.unshift({ name: `Проект в регионе ${p.name}`, type: 'Развитие', progress: 0, icon: 'hammer', detail: 'ещё 8 ходов' });
    toast(`Проект развития запущен в регионе ${p.name}`, 'success');
    refreshView();
  } else if (p.owner === 'ally') {
    state.resources.authority += 3;
    toast('Влияние в княжестве укреплено: +3 авторитета', 'success');
  } else {
    state.resources.authority = Math.max(0, state.resources.authority - 5);
    toast(`Претензия на ${p.name} зарегистрирована. Соседи встревожены.`, 'warning');
  }
}

function claimProvince() {
  if (state.resources.authority < 12) { toast('Нужно 12 авторитета для разведки региона', 'warning'); return; }
  state.resources.authority -= 12;
  toast('Разведка Серой косы начата: +12 влияния после завершения', 'success');
}
function researchTech() {
  const nextTech = state.researched.includes('Пороховая смесь') ? 'Гильдейская бухгалтерия' : 'Пороховая смесь';
  const cost = nextTech === 'Пороховая смесь' ? 42 : 36;
  if (state.resources.research < cost) { toast(`Нужно ${cost} очков науки`, 'warning'); return; }
  state.resources.research -= cost;
  state.researched.push(nextTech);
  toast(`Исследование завершено: ${nextTech}`, 'success');
  refreshView();
}
function selectDoctrine(element) {
  document.querySelectorAll('.doctrine-card').forEach((card) => card.classList.remove('active'));
  element.classList.add('active');
  toast('Доктрина генерального штаба обновлена', 'success');
}

function openModal(content) {
  const root = document.querySelector('#modal-root');
  root.innerHTML = `<div class="modal-backdrop" data-action="close-modal"><div class="modal-window" role="dialog" aria-modal="true" onclick="event.stopPropagation()">${content}</div></div>`;
  root.querySelectorAll('[data-action="close-modal"]').forEach((el) => el.addEventListener('click', () => closeModal()));
  root.querySelectorAll('[data-modal-action]').forEach((el) => el.addEventListener('click', () => handleModalAction(el.dataset.modalAction, el)));
  document.addEventListener('keydown', escClose, { once: true });
}
function escClose(event) { if (event.key === 'Escape') closeModal(); }
function closeModal() { document.querySelector('#modal-root').innerHTML = ''; }

function modalHeader(kicker, title, close = true) { return `<div class="modal-header"><div><div class="panel-kicker">${kicker}</div><h2>${title}</h2></div>${close ? `<button class="modal-close" data-action="close-modal">${icon('close', 18)}</button>` : ''}</div>`; }
function notificationModal() { return `${modalHeader('СОВЕТ ПРИ КОРОНЕ', 'Донесения и сигналы')}<div class="modal-list">${state.notifications.concat([{ type:'info', title:'Академия просит покровительства', body:'Учёные предлагают ускорить исследования за счёт 260 ₣.', time:'3 дня назад', icon:'science' }]).map(n => `<div class="modal-notification"><span class="notification-icon ${n.type}">${icon(n.icon, 15)}</span><div><b>${n.title}</b><p>${n.body}</p><small>${n.time}</small></div><button class="text-link" data-modal-action="ack">${icon('check', 14)}</button></div>`).join('')}</div><div class="modal-footer"><span class="muted">Последняя синхронизация: только что</span><button class="primary-button compact" data-modal-action="close">Закрыть донесения</button></div>`; }
function goalsModal() { return `${modalHeader('КОНТУР КАМПАНИИ', 'Цели текущего сезона')}<div class="goal-list"><div class="goal completed"><span>${icon('check', 16)}</span><div><b>Открыть морской путь</b><small>Построить гавань в Восточных воротах</small></div><em>ЗАВЕРШЕНО</em></div><div class="goal"><span>02</span><div><b>Удержать север</b><small>Поднять готовность Северной стражи выше 80%</small><i><em style="width:68%"></em></i></div><strong>68%</strong></div><div class="goal"><span>03</span><div><b>Закрепить влияние</b><small>Заключить ещё один договор с соседней державой</small><i><em style="width:50%"></em></i></div><strong>1 / 2</strong></div></div><div class="goal-reward"><span>${icon('crown', 18)}</span><div><b>Награда за сезон</b><small>+20 престижа · открытие решения «Королевская реформа»</small></div></div>`; }
function searchModal() { return `${modalHeader('НАВИГАТОР', 'Найти в державе')}<div class="search-modal"><div class="search-box">${icon('search', 18)}<input autofocus placeholder="Провинция, персонаж, решение..."/><kbd>ESC</kbd></div><div class="search-suggestions"><span>Быстрый переход</span><button data-modal-action="search-map">Карта мира <b>02</b></button><button data-modal-action="search-military">Северная стража <b>Армии</b></button><button data-modal-action="search-science">Пороховая смесь <b>Наука</b></button></div></div>`; }
function settingsModal() { return `${modalHeader('ПАРАМЕТРЫ КАМПАНИИ', 'Настройки интерфейса')}<div class="settings-list"><label><span><b>Подсказки советников</b><small>Показывать контекстные рекомендации</small></span><input type="checkbox" checked/><i class="toggle"></i></label><label><span><b>Автоматическая пауза</b><small>Останавливать время при событии</small></span><input type="checkbox"/><i class="toggle"></i></label><label><span><b>Компактный режим карты</b><small>Меньше подписей, больше территории</small></span><input type="checkbox"/><i class="toggle"></i></label></div><div class="modal-footer"><span class="muted">Версия кампании 0.9.4</span><button class="primary-button compact" data-modal-action="close">Сохранить</button></div>`; }
function campaignModal() { return `${modalHeader('КАМПАНИЯ 01', 'Наследие корон')}<div class="campaign-modal"><div class="campaign-art"><span>1184</span><small>ЗИМА</small></div><div><div class="panel-kicker">СЦЕНАРИЙ</div><h3>От пограничного королевства к мировой державе</h3><p>Пять веков решений: от феодальных договоров до парламентов, промышленности и новых границ.</p><div class="campaign-facts"><span><b>СРЕДНЯЯ</b> сложность</span><span><b>60</b> ходов сезона</span><span><b>5</b> эпох развития</span></div></div></div><div class="modal-footer"><button class="outline-button compact" data-modal-action="close">Продолжить кампанию</button><button class="primary-button compact" data-modal-action="reset">Начать заново ${icon('arrow', 13)}</button></div>`; }
function buildModal() { return `${modalHeader('МАСТЕРСКАЯ КОРОНЫ', 'Запустить проект')}<div class="build-intro">Выберите, на что направить ресурсы. Очередь действует для всей державы.</div><div class="build-options"><button data-modal-action="build-fort"><span class="build-option-icon red">${icon('shield', 18)}</span><span><b>Пограничная крепость</b><small>Северный рубеж · 1 200 ₣ · 8 ходов</small></span><i>${icon('chevron', 15)}</i></button><button data-modal-action="build-market"><span class="build-option-icon gold">${icon('coin', 18)}</span><span><b>Торговый двор</b><small>Восточные ворота · 800 ₣ · 6 ходов</small></span><i>${icon('chevron', 15)}</i></button><button data-modal-action="build-academy"><span class="build-option-icon blue">${icon('science', 18)}</span><span><b>Дом знаний</b><small>Валория · 960 ₣ · 9 ходов</small></span><i>${icon('chevron', 15)}</i></button><button data-modal-action="build-granary"><span class="build-option-icon green">${icon('wheat', 18)}</span><span><b>Королевские амбары</b><small>Серевские поля · 620 ₣ · 5 ходов</small></span><i>${icon('chevron', 15)}</i></button></div>`; }
function budgetModal() { return `${modalHeader('ФИНАНСОВЫЙ КОНТУР', 'Настроить бюджет')}<div class="budget-modal"><div class="budget-total"><span>Свободный доход</span><b>${fmt(state.resources.income)} ₣ <em>за ход</em></b></div>${['Армия и границы', 'Строительство', 'Наука и образование', 'Двор и посольства'].map((x, i) => `<label class="budget-slider"><span><b>${x}</b><em>${[30,22,20,12][i]}%</em></span><input type="range" min="0" max="60" value="${[30,22,20,12][i]}"/><i></i></label>`).join('')}</div><div class="modal-footer"><span class="muted">Изменения применятся со следующего хода</span><button class="primary-button compact" data-modal-action="save-budget">Применить</button></div>`; }
function recruitModal() { return `${modalHeader('ГЕНЕРАЛЬНЫЙ ШТАБ', 'Создать новый полк')}<div class="recruit-hero"><span class="recruit-icon">${icon('shield', 26)}</span><div><b>Восточный легион</b><small>Полевое соединение II класса</small></div><strong>+1 800</strong></div><div class="recruit-specs"><span><small>Набор</small><b>1 800 чел.</b></span><span><small>Стоимость</small><b>540 ₣</b></span><span><small>Подготовка</small><b>6 ходов</b></span></div><div class="modal-note warning-note">${icon('flag', 15)} Резерв позволяет создать это соединение без экстренной мобилизации.</div><div class="modal-footer"><button class="outline-button compact" data-modal-action="close">Отмена</button><button class="primary-button compact" data-modal-action="recruit-confirm">Начать набор ${icon('arrow', 13)}</button></div>`; }
function armyModal() { return `${modalHeader('СЕВЕРНАЯ СТРАЖА', 'I полк коронной гвардии')}<div class="army-detail-hero"><span class="army-banner red">I</span><div><b>Эдрик Лоу</b><small>Командир · 4 звезды</small></div><span class="positive">91% готовности</span></div><div class="detail-stat-grid"><div><small>Личный состав</small><b>4 200</b></div><div><small>Мораль</small><b>84%</b></div><div><small>Снабжение</small><b>76%</b></div><div><small>Опыт</small><b>Ветераны</b></div></div><div class="modal-note">Отряд стоит на перевале Ильмар. Приказ на передислокацию изменит баланс сил на северной границе.</div><div class="modal-footer"><button class="outline-button compact" data-modal-action="close">Закрыть</button><button class="primary-button compact" data-modal-action="move-army">Отдать приказ ${icon('arrow', 13)}</button></div>`; }
function diplomacyModal() { return `${modalHeader('ДИПЛОМАТИЧЕСКИЙ КАНАЛ', 'Кому отправить посла?')}<div class="diplomacy-modal-options"><button data-modal-action="send-kael"><span class="ally-avatar" style="background:#75988b">К</span><span><b>Княжество Каэль</b><small>Укрепить оборонительный пакт</small></span><em>−12 влияния</em></button><button data-modal-action="send-ligoria"><span class="ally-avatar" style="background:#bb9861">Л</span><span><b>Лигория</b><small>Закрепить торговые привилегии</small></span><em>−18 влияния</em></button><button data-modal-action="send-nord"><span class="ally-avatar" style="background:#9b5e55">Н</span><span><b>Нордхейм</b><small>Предложить временное перемирие</small></span><em>−24 влияния</em></button></div><div class="modal-note">Дипломатические решения не дают мгновенной выгоды — следите за отношениями в течение нескольких ходов.</div>`; }
function provinceModal() { const p = selectedProvince(); return `${modalHeader('ДОСЬЕ РЕГИОНА', p.name)}<div class="province-dossier"><div class="dossier-code">REGION / ${p.id.toUpperCase()} / 04</div><p>${p.description}</p><div class="dossier-grid"><span><small>ВЛАДЕЛЕЦ</small><b>${p.owner === 'you' ? 'Корона Вейры' : p.type}</b></span><span><small>НАСЕЛЕНИЕ</small><b>${p.population}</b></span><span><small>ЛОЯЛЬНОСТЬ</small><b>${p.loyalty}%</b></span><span><small>ВЫПУСК</small><b>${p.output} ₣</b></span></div></div><div class="modal-footer"><button class="outline-button compact" data-modal-action="close">Вернуться к карте</button><button class="primary-button compact" data-modal-action="province-from-modal">Открыть регион ${icon('arrow', 13)}</button></div>`; }
function techInfoModal() { return `${modalHeader('ТЕХНОЛОГИЧЕСКИЙ АТЛАС', 'Дерево исследований')}<div class="tech-info-modal"><span class="tech-symbol blue">${icon('science', 22)}</span><div><h3>Технологии меняют правила</h3><p>Каждая эпоха открывает не только новые здания, но и иной способ вести войну, управлять людьми и договариваться.</p></div></div><div class="modal-note">Выберите доступную технологию на панели науки, чтобы потратить накопленные очки.</div><div class="modal-footer"><button class="primary-button compact" data-modal-action="go-science">Перейти к науке ${icon('arrow', 13)}</button></div>`; }
function stateModal() { return `${modalHeader('ИДЕНТИЧНОСТЬ ДЕРЖАВЫ', 'Соберите своё государство')}<form id="state-form" class="state-form"><label><span>Название государства</span><input name="name" value="${state.nation.name}" maxlength="32" required/></label><label><span>Правитель</span><input name="ruler" value="${state.nation.ruler}" maxlength="26" required/></label><label><span>Форма правления</span><select name="government"><option ${state.nation.government === 'Феодальная монархия' ? 'selected' : ''}>Феодальная монархия</option><option>Городская республика</option><option>Военная диктатура</option><option>Совет князей</option></select></label><label><span>Девиз</span><input name="motto" value="${state.nation.motto}" maxlength="48" required/></label><div class="state-preview"><div class="preview-crest">✦</div><div><small>ПРЕДПРОСМОТР</small><b id="preview-name">${state.nation.name}</b><em id="preview-motto">${state.nation.motto}</em></div></div><div class="modal-footer"><button type="button" class="outline-button compact" data-modal-action="close">Отмена</button><button type="submit" class="primary-button compact">Сохранить герб и имя ${icon('arrow', 13)}</button></div></form>`; }

function handleModalAction(action, element) {
  switch (action) {
    case 'close': closeModal(); break;
    case 'ack': element.closest('.modal-notification')?.classList.add('read'); toast('Донесение отмечено прочитанным', 'info'); break;
    case 'search-map': closeModal(); state.activeView = 'map'; renderShell(); break;
    case 'search-military': closeModal(); state.activeView = 'military'; renderShell(); break;
    case 'search-science': closeModal(); state.activeView = 'science'; renderShell(); break;
    case 'reset': state.turn = 1; state.year = 1066; state.season = 0; closeModal(); renderShell(); toast('Кампания начата заново с 1066 года', 'success'); break;
    case 'build-fort': startBuild('Пограничная крепость', 1200, 8, 'shield'); break;
    case 'build-market': startBuild('Торговый двор', 800, 6, 'coin'); break;
    case 'build-academy': startBuild('Дом знаний', 960, 9, 'science'); break;
    case 'build-granary': startBuild('Королевские амбары', 620, 5, 'wheat'); break;
    case 'save-budget': closeModal(); toast('Бюджет обновлён. Приоритеты вступят в силу со следующего хода.', 'success'); break;
    case 'recruit-confirm':
      if (state.resources.treasury < 540) { toast('Недостаточно средств для набора', 'warning'); return; }
      state.resources.treasury -= 540; state.queue.push({ name: 'Восточный легион', type: 'Армия', progress: 0, icon: 'shield', detail: 'ещё 6 ходов' }); closeModal(); refreshView(); toast('Набор Восточного легиона начат', 'success'); break;
    case 'move-army': closeModal(); toast('Приказ передан Северной страже', 'success'); break;
    case 'send-kael': state.resources.authority += 4; closeModal(); toast('Посол отправлен в Каэль: доверие растёт', 'success'); break;
    case 'send-ligoria': state.resources.authority = Math.max(0, state.resources.authority - 3); closeModal(); toast('Лигория получила ваши условия торговли', 'success'); break;
    case 'send-nord': state.resources.stability = Math.max(0, state.resources.stability - 2); closeModal(); toast('Канал перемирия открыт. Ответ ожидается 2 хода.', 'success'); break;
    case 'province-from-modal': closeModal(); state.activeView = 'map'; renderShell(); break;
    case 'go-science': closeModal(); state.activeView = 'science'; renderShell(); break;
    default: toast('Решение принято', 'success');
  }
}

function startBuild(name, cost, turns, buildIcon) {
  if (state.resources.treasury < cost) { toast('Недостаточно средств в казне', 'warning'); return; }
  state.resources.treasury -= cost;
  state.queue.unshift({ name, type: 'Постройка', progress: 0, icon: buildIcon, detail: `ещё ${turns} ходов` });
  closeModal(); refreshView(); toast(`${name} добавлен в очередь строительства`, 'success');
}

function toast(message, type = 'info') {
  const region = document.querySelector('#toast-region');
  if (!region) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icon(type === 'success' ? 'check' : type === 'warning' ? 'flag' : 'bell', 15)}</span><span>${message}</span><button>${icon('close', 13)}</button>`;
  el.querySelector('button').addEventListener('click', () => el.remove());
  region.appendChild(el);
  setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 280); }, 4200);
}

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-action="close-modal"]')) closeModal();
});
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) { event.preventDefault(); advanceTurn(); }
});
document.addEventListener('submit', (event) => {
  if (event.target.id !== 'state-form') return;
  event.preventDefault();
  const data = new FormData(event.target);
  state.nation.name = data.get('name');
  state.nation.shortName = String(data.get('name')).split(/\s+/).pop().slice(0, 8).toUpperCase();
  state.nation.ruler = data.get('ruler');
  state.nation.government = data.get('government');
  state.nation.motto = data.get('motto');
  closeModal(); renderShell(); toast('Государство обновлено. Совет короны учтёт новую идентичность.', 'success');
});

document.addEventListener('input', (event) => {
  if (event.target.closest('#state-form')) {
    const form = event.target.form;
    const name = form?.querySelector('[name="name"]')?.value;
    const motto = form?.querySelector('[name="motto"]')?.value;
    const namePreview = document.querySelector('#preview-name');
    const mottoPreview = document.querySelector('#preview-motto');
    if (namePreview) namePreview.textContent = name;
    if (mottoPreview) mottoPreview.textContent = motto;
  }
});

renderShell();
