# Deploy Troubleshooting — Railway

Errores conocidos en producción y sus fixes verificados. Si te encuentras con uno de estos síntomas, NO improvises — el playbook está abajo.

---

## Antes de diagnosticar nada: 3 reglas no negociables

1. **Verificar dominio canónico SIEMPRE primero**
   ```bash
   railway domain
   ```
   El dominio público lleva un sufijo random (`autopost-production-cd57.up.railway.app`, no `autopost-production.up.railway.app`). Asumirlo cuesta 30+ min de debugging contra una URL fantasma.

2. **`x-railway-fallback: true` ≠ app caída**
   Si curl devuelve 502 con ese header, es el edge devolviendo fallback porque NO encuentra el servicio en ese dominio. La app probablemente esté corriendo perfectamente en otro dominio.

3. **Logs runtime SIEMPRE confirman si la app arrancó**
   ```bash
   railway logs --deployment <id> --lines 100
   ```
   Buscar `Next.js Ready in Xms` y `Worker Started`. Si están, la app está viva — el problema es de routing.

---

## Errores conocidos

### 1. `npm error Missing: @swc/helpers@0.5.21 from lock file`

**Causa raíz:** `package-lock.json` desincronizado tras editar `package.json` sin reinstalar.

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "fix(deps): regenerate lock"
git push
```

**Cómo prevenir:** El pre-push hook (`scripts/pre-push.sh`) detecta si `package.json` es más nuevo que `package-lock.json` y bloquea el push.

**Histórico:** Este error tumbó 8 deploys consecutivos en Fase 2 (commits `9be1405`, `9b119a5`, `88dbbdc`, `945bf44`).

---

### 2. Deploy SUCCESS pero edge devuelve 502 en todas las rutas

**Síntoma:** `railway status` dice SUCCESS, logs muestran `Next.js Ready`, pero `curl` a las rutas devuelve 502 con `x-railway-fallback: true`.

**Causa raíz:** Estás consultando un dominio que no existe. Railway añade un sufijo random al dominio público.

**Fix:**
```bash
railway domain                    # ← ver el dominio canónico real
curl -sI https://<DOMAIN>/login   # ← probar con ese
```

**Cómo prevenir:** Usar `npm run deploy:status` que extrae el dominio canónico automáticamente.

**Histórico:** 30+ minutos perdidos en sesión 2026-05-04 contra `autopost-production.up.railway.app` sin sufijo.

---

### 3. Build atascado >10 min en Docker image pull

**Síntoma:** Logs de build muestran `[INFO] load metadata for ghcr.io/railwayapp/nixpacks:ubuntu-...` y se quedan ahí 8+ min.

**Causa raíz:** Builder Railway congestionado. Sin Dockerfile custom, Nixpacks reconstruye el árbol Docker entero cada vez sin cache efectivo.

**Fix temporal:**
```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
# Triggera un nuevo deploy que suele desencallar
```

**Fix permanente:** Migrar a `Dockerfile` multi-stage (ver `Dockerfile` en raíz). Builds 40-60% más rápidos por cache de capas.

---

### 4. Build OK localmente, falla en Railway por archivo missing

**Síntoma típico:** "Cannot find module 'src/messages/es.json'" o similar en runtime, no en build.

**Causa raíz:** El bundle standalone de Next.js no incluye automáticamente todos los archivos. Hay que copiarlos en post-build.

**Fix:** Asegurar que `package.json#scripts.build` copia los archivos extra:
```json
"build": "next build && cp -R .next/static .next/standalone/.next/ ; cp -R public .next/standalone/ ; cp -R src/messages .next/standalone/src/"
```

**Histórico:** Causó el deploy fail commit `9be1405` (Fase 2).

---

### 5. Migración Prisma falla en `preDeployCommand`

**Síntoma:** `prisma migrate deploy` falla con `P3018` o "drift detected".

**Causa raíz:** Esquema de DB en producción tiene columnas que Prisma no sabe que existen (aplicaste un SQL manual sin INSERT en `_prisma_migrations`).

**Fix:**
```bash
# Conectar a DB prod via TCP proxy
PGURL=$(railway variables --service Postgres --kv | grep DATABASE_PUBLIC_URL | cut -d= -f2-)

# Marcar la migración como aplicada manualmente
DATABASE_URL="$PGURL" npx prisma migrate resolve --applied <migration_name>
```

---

## Comandos de emergencia

### Rollback rápido (30 segundos, NO `git revert`)

```bash
railway rollback                   # vuelve al deploy anterior, sin rebuild
```

Si la CLI no soporta rollback directo, redeploy del commit anterior:
```bash
git checkout <commit_anterior>
railway redeploy --yes
git checkout main
```

### Cancelar build atascado

```bash
git commit --allow-empty -m "chore: cancel stuck build"
git push    # nuevo deploy reemplaza el atascado
```

### Ver último error de deploy

```bash
DEPLOY_ID=$(railway status --json | python3 -c "import sys,json; print(json.load(sys.stdin)['environments']['edges'][0]['node']['serviceInstances']['edges'][0]['node']['latestDeployment']['id'])")

railway logs --build "$DEPLOY_ID" --lines 100      # logs del build
railway logs --deployment "$DEPLOY_ID" --lines 100 # logs runtime
```

### Smoke test post-deploy

```bash
npm run deploy:smoke
```

---

## Checklist pre-push (ya automatizado)

El hook `scripts/pre-push.sh` corre automáticamente y valida:

- [ ] `package.json` no es más nuevo que `package-lock.json`
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] `npm run build` completa OK

Bypass de emergencia (solo si sabes lo que haces):
```bash
SKIP_PREPUSH=1 git push
```

---

## Histórico de incidentes

| Fecha | Síntoma | Causa raíz | Fix | Commit |
|---|---|---|---|---|
| 2026-04 | 6 deploys FAILED | next-intl plugin roto en standalone | Disable plugin | `88dbbdc` |
| 2026-04 | 7 deploys FAILED | `messages/` no en bundle standalone | Copy en post-build | `9be1405` |
| 2026-04 | 8 deploys FAILED | `package-lock.json` desincronizado | Regenerar lock | `945bf44` |
| 2026-05 | 30 min debug 502 | Dominio fantasma sin sufijo `cd57` | `railway domain` | (memory) |
| 2026-05 | Build atascado 12 min | Docker image pull congestionado | Empty commit | `635e3b6` |
