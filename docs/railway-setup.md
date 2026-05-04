# Railway · Setup post-Fase 2

Guía rápida de las **credenciales que necesitas generar tú** (no se pueden
crear desde código) para que la Fase 2 del rebrand funcione end-to-end en
producción. Cada bloque incluye el comando `railway variables --set` exacto
para configurarla.

**Dominio actual:** `https://autopost-production-cd57.up.railway.app`

## ✅ Ya configurado en Railway

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Postgres interno |
| `REDIS_URL` | Redis interno |
| `STORAGE_*` | R2 Cloudflare bucket `autopost` |
| `OPENAI_API_KEY` | sk-proj-... |
| `TOGETHER_API_KEY` | tgp_v1_... (fallback IA) |
| `SESSION_SECRET` | iron-session 64 chars |
| `ENCRYPTION_KEY` | AES-256-GCM (Meta tokens) |
| `NEXT_PUBLIC_APP_URL` | dominio público |
| `GOOGLE_REDIRECT_URI` | `…/api/auth/google/callback` ✓ |
| `META_REDIRECT_URI` | `…/api/meta/oauth/callback` ✓ |

---

## 1. Google OAuth — IMPRESCINDIBLE para Fase 2

Sin esto el botón "Continuar con Google" no aparece (se oculta server-side
si las 3 vars no están).

### a) Crear OAuth client

1. Ve a [console.cloud.google.com](https://console.cloud.google.com/) → tu proyecto (o crea uno nuevo "Autopost").
2. Menú izquierdo → **APIs y servicios → Credenciales**.
3. Click **Crear credenciales → ID de cliente de OAuth 2.0**.
4. Tipo de aplicación: **Aplicación web**.
5. Nombre: `Autopost Production`.
6. **URIs de redirección autorizados** (añade ambos):
   ```
   https://autopost-production-cd57.up.railway.app/api/auth/google/callback
   http://localhost:3000/api/auth/google/callback
   ```
   (el segundo es para dev local).
7. **Crear**. Copia `Client ID` y `Client Secret`.

### b) Setear en Railway

```bash
railway variables \
  --set "GOOGLE_CLIENT_ID=<TU_CLIENT_ID>.apps.googleusercontent.com" \
  --set "GOOGLE_CLIENT_SECRET=<TU_CLIENT_SECRET>"
```

### c) Configurar consent screen (primera vez)

Si Google te pide configurar la pantalla de consentimiento:
- Tipo de usuario: **Externo** (cualquier usuario con cuenta Google)
- Nombre de aplicación: `Autopost`
- Email de soporte: tu email
- Dominio autorizado: `autopost-production-cd57.up.railway.app`
- Scopes mínimos: `email`, `profile`, `openid`
- Estado: **En producción** (después del primer testing)

---

## 2. Anthropic API key — RECOMENDADO

Sin esto, la IA captions cae a Together (Llama 3.3) — funciona pero menos
calidad. Para Claude Sonnet 4.5 con prompt caching:

### a) Conseguir la key

1. Ve a [console.anthropic.com](https://console.anthropic.com/) y crea cuenta.
2. **Settings → API Keys → Create Key**.
3. Copia (empieza por `sk-ant-…`).
4. Añade créditos en Billing (mín 5€ para empezar).

### b) Setear en Railway

```bash
railway variables --set "ANTHROPIC_API_KEY=sk-ant-..."
```

---

## 3. SMTP — IMPRESCINDIBLE para email verification y password reset

Sin esto, los emails de signup welcome y reset no se envían. **Resend
recomendado** (DX más simple, plan free 100/día).

### a) Crear cuenta Resend

1. Ve a [resend.com](https://resend.com) y crea cuenta con tu email.
2. Verifica tu dominio (si tienes uno) o usa el sandbox `onboarding@resend.dev`.
3. **API Keys → Create API Key**. Permission: `Sending access`.
4. Copia (empieza por `re_…`).

### b) Setear en Railway

```bash
railway variables \
  --set "SMTP_HOST=smtp.resend.com" \
  --set "SMTP_PORT=587" \
  --set "SMTP_USER=resend" \
  --set "SMTP_PASS=re_..." \
  --set "SMTP_FROM=Autopost <noreply@autopost.app>"
```

> **Sin dominio propio:** usa `SMTP_FROM=Autopost <onboarding@resend.dev>`
> hasta que verifiques `autopost.app`.

---

## 4. Meta App (Instagram + Facebook) — Para que IG/FB OAuth funcione

Sin esto, los usuarios no pueden conectar su Instagram en `/connect`.
Esto requiere **Meta App Review** (1-2 semanas independientes).

### a) Crear app

1. [developers.facebook.com/apps](https://developers.facebook.com/apps) → **Crear app**.
2. Tipo: **Empresa**. Nombre: `Autopost`.
3. **Configuración → Básica** → copia `App ID` y `App Secret`.
4. **Productos → Instagram → Configuración**:
   - URI de redireccionamiento OAuth válidos:
     ```
     https://autopost-production-cd57.up.railway.app/api/meta/oauth/callback
     ```
5. Para **producción** necesitas pasar **App Review** con permisos:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
   - `business_management`

### b) Setear en Railway

```bash
railway variables \
  --set "META_APP_ID=<APP_ID>" \
  --set "META_APP_SECRET=<APP_SECRET>"
```

> Mientras Meta App Review está pendiente, puedes probar con **Modo
> desarrollador** añadiendo tu cuenta de Instagram como tester en
> Roles → Probadores de Instagram.

---

## 5. Multi-plataforma (opcional, Fase 5)

| Plataforma | Vars necesarias | Donde generarlas |
|---|---|---|
| TikTok | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | [developers.tiktok.com](https://developers.tiktok.com) |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | [linkedin.com/developers](https://linkedin.com/developers) |
| YouTube | usa GOOGLE_CLIENT_ID (mismo proyecto Google Cloud) | añadir scope `youtube.upload` |
| Pinterest | `PINTEREST_CLIENT_ID`, `PINTEREST_CLIENT_SECRET` | [developers.pinterest.com](https://developers.pinterest.com) |

Cada una requiere su propio app review (varias semanas). **Lánzate sólo
con Google + Meta**; las demás se añaden post-launch.

---

## Verificar que todo está bien

```bash
# 1. Lista vars actuales (esconder valores)
railway variables | grep -E "GOOGLE|META|ANTHROPIC|SMTP" | head

# 2. Smoke-test de URLs públicas
curl -sI https://autopost-production-cd57.up.railway.app/login | head -1
curl -sI https://autopost-production-cd57.up.railway.app/api/auth/google/start | head -1
# Si Google está configurado → 302 (redirect a Google)
# Si no → 503 con { error: "google_oauth_not_configured" }

# 3. Verificar logs runtime (busca errores de credenciales)
railway logs --deployment | grep -iE "error|missing|not configured"
```

---

## Orden recomendado de configuración

1. **Google OAuth** (15 min) — el botón aparece en /login y /signup
2. **Resend SMTP** (10 min) — email verification + reset funcionan
3. **Anthropic API key** (5 min) — IA captions premium
4. **Meta App** (15 min + 1-2 semanas review) — Instagram conectable
5. **Multi-plataforma** (post-launch) — TikTok, LinkedIn, etc.

Tras paso 1 y 2 ya tienes signup + login + reset funcionales con Google
y email. Eso es el MVP de Fase 2.
