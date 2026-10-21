# AGENTS.md — короткая шпаргалка по «ТИШЕ / HUSH»

Проект: браузерный эхолокационный хоррор. Vite 8 + three.js, vanilla ES-модули, без React и
игровых движков. Ассеты не используются: геометрия и все звуки генерируются кодом (WebAudio),
кроме двух webfont'ов. Игра: https://sanlaran.github.io/pinterest/ · версия 2.1, протокол 14.

Проверено 2026-10-21 на Node 22.22, `npm ci` с нуля:

```bash
npm test               # 133 теста, 0 падений, ~6 с
npm run build          # dist/ (в .gitignore), ~1.7 МБ одним чанком
npm run build:pages    # play/ — коммитится в git; сейчас совпадает с исходниками
npm run dev            # http://localhost:5173
```

## Где что лежит

`src/` — 38 884 строки JS: `game/` 14 873 (36 файлов), `ui/` 11 349 (29), `audio/` 4 071 (3),
`world/` 2 686 (9), `render/` 1 880 (8), `core/` 1 654 (6), `net/` 682 (4), `cloud/` 247 (5),
`input/` 391 (1). Точка входа — `src/main.js`.

| Нужно | Файл |
|---|---|
| Баланс, тайминги, свет, очки | `src/core/config.js` (193 строки, `CFG`) |
| Все строки RU/EN | `src/core/i18n.js` (1 211 строк) |
| Процедурный звук | `src/audio/audio.js` (3 668 строк) |
| Шейдер «сонара» | `src/render/sonar.js` |
| Правила ночи, рассветы, скримеры | `src/game/game.js` |
| Сеть: комнаты, `PROTOCOL = 14`, `MAX_PLAYERS = 4` | `src/net/net.js`, `src/net/coop.js` |
| История версий для игрока | `src/ui/news.js` |
| Как играть, управление | `README.md` |

## Три вещи, на которых легко сломаться

1. `play/` — собранная копия в git. Менял `src/` → `npm run build:pages` и коммить, иначе CI
   «Prebuilt ./play/ is up to date» падает. Работай не на старой сборке, а через `npm run dev`.
2. Меняешь сетевой протокол — поднимай `PROTOCOL` в `src/net/net.js`, чтобы старые клиенты
   отваливались, а не жили в полусломанной игре.
3. Тесты — чистый Node без DOM: модули импортируются напрямую с фейками. Нельзя обращаться к
   `document`/`window` на этапе импорта тестируемого модуля.

Отладка: `?night`, `?t=500`, `?fps`, `?nomic`, `?speed=2`, `?sfx`, `?autostart`, `?room=КОД`,
`?net=nostr|torrent`, `?relays=ws://…`. Микрофон работает только по `https://` или на `localhost`,
в iframe часто блокируется — открывай в отдельной вкладке.

Секреты: в `.env` только публичные `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY`
(шаблон — `.env.example`); `service_role`/`sb_secret` в клиент не попадают.

CI: `.github/workflows/pages.yml` (Pages `main`) запускается только на `main` и
`arena/428824a1-pinterest`, поэтому на других ветках проверок не будет. `online-smoke.mjs` и
`cloud-live.mjs` — только для CI: им нужны живые Nostr-релеи и headless Chrome.

## Как продолжить в новом чате

```
Продолжаем «ТИШЕ / HUSH» в этом репозитории. Прочитай AGENTS.md, потом README.md и
src/core/config.js. Кратко перескажи, что в проекте есть, и предложи, с чего продолжим.
Перед коммитом: npm test и npm run build; если менялись src/ — npm run build:pages и коммит play/.
```
