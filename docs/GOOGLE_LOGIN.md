# Вход через Google — что включить (≈10 минут, один раз)

Код готов и на сайте, и в `.exe` (3.1a). Не хватает одного: провайдер Google в Supabase выключен —
`GET /auth/v1/settings` отвечает `"google": false`, поэтому кнопка пишет «Google ещё не настроен».
Включить его может только владелец: для этого нужны свои ключи OAuth от Google.

## 1. Google Cloud — ключи OAuth

1. https://console.cloud.google.com → создать проект (например `HUSH`).
2. **APIs & Services → OAuth consent screen** (в новом интерфейсе — **Google Auth Platform → Branding**):
   - тип **External**; название `ТИШЕ / HUSH`; почта поддержки — твоя;
   - **Authorized domains:** `supabase.co`;
   - доступы (Data access / Scopes): только `openid`, `email`, `profile` — с ними проверка Google не нужна;
   - **Audience → Publish app** («In production»), иначе войти смогут только тестовые адреса из списка.
3. **Credentials → Create credentials → OAuth client ID → Web application**:
   - **Authorized JavaScript origins:** `https://sanlaran.github.io`, `http://localhost:5173`
   - **Authorized redirect URIs:** `https://ppylutuhhmvhgqqqnldm.supabase.co/auth/v1/callback`
4. Скопировать **Client ID** и **Client secret**.

## 2. Supabase — включить провайдера

https://supabase.com/dashboard/project/ppylutuhhmvhgqqqnldm

1. **Authentication → Sign In / Providers → Google** → Enable, вставить Client ID и Client secret → Save.
2. **Authentication → URL Configuration:**
   - **Site URL:** `https://sanlaran.github.io/pinterest/`
   - **Redirect URLs** (добавить все):
     - `https://sanlaran.github.io/pinterest/**`
     - `http://localhost:5173/**`
     - `http://127.0.0.1:47615/**` ← для настольной версии (`.exe`)

## Нужна ли проверка Google (verification)?

**Для входа — нет.** С доступами `openid`, `email`, `profile` приложение в статусе «In production» пускает любого
пользователя Google без проверки и без предупреждения «непроверенное приложение». Проверка бренда нужна только чтобы на
экране входа было «ТИШЕ / HUSH» с логотипом вместо адреса `ppylutuhhmvhgqqqnldm.supabase.co`.
Если загружен логотип, Google требует проверку — тогда проще **удалить логотип** и не подавать на проверку.

Если хочется имя на экране входа (проверка бренда):
- **Application home page:** `https://sanlaran.github.io/pinterest/about.html` (статичная, открывается мгновенно);
- **Privacy policy link:** `https://sanlaran.github.io/pinterest/privacy.html`;
- **Владение:** https://search.google.com/search-console → «Префикс URL» → `https://sanlaran.github.io/pinterest/` →
  способ «HTML-тег» → прислать строку `<meta name="google-site-verification" content="…">` (она не секретная) — её
  добавят в `index.html`, `about.html` и `privacy.html`. Подтверждать тем же Google-аккаунтом, что владеет проектом в Cloud.
  Если Google не примет подпуть `/pinterest/`, нужен корень `https://sanlaran.github.io/` — это отдельный репозиторий
  `SanLARAN.github.io` с тем же тегом.
- Домен `supabase.co` в списке Authorized domains ты подтвердить не сможешь; если проверка упрётся в него, остаётся
  либо жить без проверки бренда, либо свой домен для Supabase (платная опция Custom Domain).

## 3. Проверка

- `https://ppylutuhhmvhgqqqnldm.supabase.co/auth/v1/settings` (с заголовком `apikey`) → `"google": true`.
- Сайт: Профиль → «Войти через Google» → выбор аккаунта → возврат в игру уже с аккаунтом.
- `.exe`: та же кнопка открывает обычный браузер; после входа вкладка пишет «Готово», игра входит сама.
  Если порт 47615 занят другой программой — игра так и скажет.

Секрет (Client secret) хранится только в Supabase; в репозиторий и в игру он не попадает.
