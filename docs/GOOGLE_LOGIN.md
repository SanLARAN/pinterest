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

## 3. Проверка

- `https://ppylutuhhmvhgqqqnldm.supabase.co/auth/v1/settings` (с заголовком `apikey`) → `"google": true`.
- Сайт: Профиль → «Войти через Google» → выбор аккаунта → возврат в игру уже с аккаунтом.
- `.exe`: та же кнопка открывает обычный браузер; после входа вкладка пишет «Готово», игра входит сама.
  Если порт 47615 занят другой программой — игра так и скажет.

Секрет (Client secret) хранится только в Supabase; в репозиторий и в игру он не попадает.
