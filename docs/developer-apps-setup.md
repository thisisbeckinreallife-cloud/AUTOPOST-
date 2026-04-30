# Setup de Developer Apps · AutoPost

Guía paso a paso para crear las 4 apps developer (TikTok, LinkedIn, YouTube, Pinterest) y conectarlas a AutoPost. Hazlo en este orden — los más rápidos primero.

## Antes de empezar

Tu callback URL para todas las plataformas es:

```
https://autopost-production-cd57.up.railway.app/api/social/{platform}/oauth/callback
```

Donde `{platform}` es: `tiktok`, `linkedin`, `youtube`, `pinterest`.

Cuando la app esté en local:

```
http://localhost:3000/api/social/{platform}/oauth/callback
```

Necesitarás añadir **ambas URLs** en cada developer dashboard si quieres testear en local + producción.

Variables de entorno en Railway: `Settings → Variables`. Cada plataforma usa 3 variables:

| Variable | Qué es |
|---|---|
| `{PLATFORM}_CLIENT_ID` | (o `_KEY` en TikTok) — público, va en la URL OAuth |
| `{PLATFORM}_CLIENT_SECRET` | privado, sólo en backend |
| `{PLATFORM}_PRODUCTION_MODE` | `0` mientras esperas review, `1` cuando aprueben |

---

## 1. LinkedIn — el más fácil, hazlo primero

**Tiempo: ~10 minutos. Sin app review necesario para `w_member_social`.**

### Paso 1.1 — Crear app

1. Entra en https://www.linkedin.com/developers/apps
2. `Create app`
3. Datos:
   - **App name**: AutoPost
   - **LinkedIn Page**: enlaza una página de empresa tuya (puedes crear una rápida si no tienes)
   - **App logo**: sube el logo de AutoPost
4. Acepta los términos → `Create app`

### Paso 1.2 — Habilitar Sign In with LinkedIn + Share on LinkedIn

1. Tab `Products`
2. `Request access` en:
   - **Sign In with LinkedIn using OpenID Connect** (instantáneo)
   - **Share on LinkedIn** (instantáneo)
3. Tab `Auth`:
   - **OAuth 2.0 settings → Authorized redirect URLs**: añade
     - `https://autopost-production-cd57.up.railway.app/api/social/linkedin/oauth/callback`
     - `http://localhost:3000/api/social/linkedin/oauth/callback`
4. Copia `Client ID` + `Primary Client Secret`

### Paso 1.3 — Configurar Railway

```
LINKEDIN_CLIENT_ID="86…"
LINKEDIN_CLIENT_SECRET="WPL_AP1.…"
LINKEDIN_PRODUCTION_MODE="1"   # LinkedIn no requiere review largo, ya está activo
```

### Paso 1.4 — Probar

En AutoPost → cualquier business → `Configuración` → click `Conectar` en LinkedIn → autoriza con tu cuenta personal de LinkedIn → vuelves a Settings con `?connected=1`.

---

## 2. Pinterest — segundo más fácil

**Tiempo: ~15 minutos. App review estándar (~1 semana) pero muchas features funcionan sin review.**

### Paso 2.1 — Crear app

1. Entra en https://developers.pinterest.com/apps
2. `Connect app` → da nombre `AutoPost`
3. Acepta términos

### Paso 2.2 — Configurar OAuth

1. Tab `Configuration`
2. **Redirect URIs**: añade
   - `https://autopost-production-cd57.up.railway.app/api/social/pinterest/oauth/callback`
   - `http://localhost:3000/api/social/pinterest/oauth/callback`
3. **Scopes habilitados**: `pins:write`, `boards:read`, `user_accounts:read`
4. Copia `App ID` + `App secret token`

### Paso 2.3 — Añadir testers

1. Tab `Testers` → invita tu propio email + los emails de los 4 testers que tengas
2. Cada tester recibe un email de Pinterest → debe aceptar la invitación

### Paso 2.4 — Configurar Railway

```
PINTEREST_CLIENT_ID="…"
PINTEREST_CLIENT_SECRET="…"
PINTEREST_PRODUCTION_MODE="0"   # hasta que apruebes review
```

### Paso 2.5 — Pedir review

En el dashboard de Pinterest, tab `Submit for review`. Para Pinterest la review es para subir el rate limit + acceso a Trial features. Para crear pins el flujo básico funciona sin review aprobado, sólo limitado a testers añadidos.

---

## 3. YouTube (Google Cloud) — tercero

**Tiempo: ~20 minutos. App review largo (1-3 semanas) + verificación de marca.**

### Paso 3.1 — Crear proyecto en Google Cloud

1. https://console.cloud.google.com/ → `Select project` → `New project`
2. Nombre: `AutoPost`
3. Una vez creado, selecciónalo

### Paso 3.2 — Activar YouTube Data API

1. `APIs & Services → Library`
2. Busca **YouTube Data API v3** → `Enable`

### Paso 3.3 — OAuth consent screen

1. `APIs & Services → OAuth consent screen`
2. **User Type**: External → `Create`
3. Datos:
   - **App name**: AutoPost
   - **User support email**: tu email
   - **App logo**: sube el logo
   - **App domain**: `https://autopost-production-cd57.up.railway.app`
   - **Privacy Policy URL**: necesitarás crear una (ver `docs/privacy-policy-template.md` cuando exista)
   - **Terms of Service URL**: idem
   - **Authorized domains**: `autopost-production-cd57.up.railway.app`
4. **Scopes**: añade
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube.readonly`
5. **Test users**: añade tu email + los 4 testers (máx 100 en test mode)
6. `Save`

### Paso 3.4 — Crear OAuth Client ID

1. `APIs & Services → Credentials → Create credentials → OAuth client ID`
2. **Application type**: Web application
3. **Authorized redirect URIs**: añade
   - `https://autopost-production-cd57.up.railway.app/api/social/youtube/oauth/callback`
   - `http://localhost:3000/api/social/youtube/oauth/callback`
4. Copia `Client ID` + `Client secret`

### Paso 3.5 — Pedir aumento de quota desde el día 1

Quota inicial: 10,000 unidades/día. Cada upload cuesta 1600 → ~6 uploads/día. Insuficiente.

1. `APIs & Services → YouTube Data API v3 → Quotas`
2. Click sobre la quota → `Edit quotas` → solicita aumento (rellena el form explicando que es un scheduler para creators).

### Paso 3.6 — Configurar Railway

```
GOOGLE_CLIENT_ID="…apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-…"
YOUTUBE_PRODUCTION_MODE="0"   # hasta que pase review
```

### Paso 3.7 — Pedir review

Cuando tengas privacy policy + terms + canal de YouTube vinculado, en `OAuth consent screen → Publishing status → Submit for verification`. Tarda 1-3 semanas. Mientras esperas, los testers añadidos pueden subir videos.

---

## 4. TikTok — el más lento, déjalo para el final

**Tiempo: ~30 minutos para crear la app + 1-2 semanas de review.**

### Paso 4.1 — Crear app

1. https://developers.tiktok.com/apps → `Manage apps → Connect app`
2. Datos:
   - **App name**: AutoPost
   - **Description**: "Scheduler editorial para creadores hispanohablantes"
   - **Category**: Productivity
   - **Privacy Policy URL**: requerida (necesitas tener la URL pública)
   - **Terms of Service URL**: requerida
3. `Create app`

### Paso 4.2 — Configurar Login Kit

1. Tab `Add products → Login Kit → Add`
2. **Redirect URI**:
   - `https://autopost-production-cd57.up.railway.app/api/social/tiktok/oauth/callback`
   - `http://localhost:3000/api/social/tiktok/oauth/callback`
3. **Scopes**: `user.info.basic`, `video.publish`

### Paso 4.3 — Configurar Content Posting API

1. Tab `Add products → Content Posting API → Add`
2. Selecciona **Direct Post** (no Inbox) — esto es lo que requiere review
3. **App permissions verification**: rellena el form explicando uso

### Paso 4.4 — Añadir testers

1. Tab `Targeted Roles → Add role → Tester`
2. Añade tu email + los 4 testers (máx 10 en test mode TikTok)

### Paso 4.5 — Configurar Railway

```
TIKTOK_CLIENT_KEY="aw…"   # ojo: TikTok llama "Client Key" no "Client ID"
TIKTOK_CLIENT_SECRET="…"
TIKTOK_PRODUCTION_MODE="0"
```

### Paso 4.6 — Pedir review

Tab `Submit for review`. TikTok pide:
- Demo video del flow completo (upload → schedule → publish)
- Privacy policy
- Terms
- Justificación clara del uso del scope `video.publish`

Tarda 1-2 semanas. Mientras tanto los 10 testers añadidos pueden publicar.

---

## 5. Verificación post-setup

Después de configurar las 4 apps:

### 5.1 — Variables Railway completas

Confirma que tienes:

```bash
LINKEDIN_CLIENT_ID
LINKEDIN_CLIENT_SECRET
LINKEDIN_PRODUCTION_MODE

PINTEREST_CLIENT_ID
PINTEREST_CLIENT_SECRET
PINTEREST_PRODUCTION_MODE

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
YOUTUBE_PRODUCTION_MODE

TIKTOK_CLIENT_KEY
TIKTOK_CLIENT_SECRET
TIKTOK_PRODUCTION_MODE
```

Railway redeploya automáticamente cuando cambias variables.

### 5.2 — Probar conexión por plataforma

En cada business → `Configuración`:
- LinkedIn → `Conectar` → autoriza → vuelve `?connected=1`
- Pinterest → idem
- YouTube → idem (con cuenta Google que tenga canal)
- TikTok → idem (sólo con cuenta marcada como tester)

### 5.3 — Probar publish multi-plataforma

1. Sube una carpeta con un post (un video corto en formato vertical 9:16, ~30s)
2. En el detalle del post: marca todas las plataformas en `Plataformas destino`
3. Cambia el `publishAt` a 2 minutos en el futuro
4. `Confirmar batch`
5. Espera 2 minutos y revisa:
   - Tab `Posts` → status del post
   - Sección `Publicaciones por plataforma` → cada una con su permalink

### 5.4 — Si algo falla

- Logs del worker: `railway logs --service worker | grep "Worker:social"`
- Audit logs en `/logs` filtra por `SOCIAL_POST_PUBLISH_FAILED`
- Status de cada SocialConnection en business settings — si dice `TOKEN_EXPIRED` ve a "Reconectar"

---

## 6. Cuando aprueben las apps

Para cada plataforma aprobada, sólo cambia su flag a `1`:

```
LINKEDIN_PRODUCTION_MODE="1"
TIKTOK_PRODUCTION_MODE="1"
YOUTUBE_PRODUCTION_MODE="1"
PINTEREST_PRODUCTION_MODE="1"
```

Railway redeploya. La UI deja de mostrar "Beta · sólo testers" y los nuevos usuarios pueden conectar libremente.

---

## 7. Documentos legales pendientes (necesarios para review)

Antes de pedir review en TikTok + YouTube necesitas tener URLs públicas de:
- **Privacy Policy** (tratamiento de datos personales + tokens OAuth + assets)
- **Terms of Service** (planes, cancelación, responsabilidad)

Cuando estés listo para el review, dime y te genero los templates.
