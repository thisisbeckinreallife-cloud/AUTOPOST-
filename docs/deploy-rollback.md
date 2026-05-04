# Rollback rápido — Railway

Cuando un deploy rompe producción, **NO uses `git revert + push`**. Eso dispara otro build de 5 minutos. Hay opciones de 30 segundos.

---

## Opción 1: Railway dashboard (más rápido)

1. https://railway.app/project/<project_id>/service/<service_id>
2. Pestaña "Deployments"
3. Encuentra el último deploy que SÍ funcionaba
4. Botón "Redeploy" → activa esa versión sin rebuild (≈30 s)

---

## Opción 2: CLI

```bash
# Ver últimos deploys con su status
railway logs --json | head -20

# Redeploy del último que funcionaba (necesitas el deploy id)
railway redeploy --yes
```

Si la CLI no permite seleccionar deploy concreto, alternativa via git:

```bash
# 1. Identificar último commit bueno
git log --oneline -10

# 2. Push a un branch de rollback (no toca main)
git push origin <commit_bueno>:refs/heads/hotfix-rollback --force

# 3. En Railway dashboard, configurar service para deployar desde
#    'hotfix-rollback' temporalmente. Luego volver a 'main' cuando arregles.
```

---

## Opción 3: Cuando el build está atascado (no falla, pero no avanza)

Síntoma: deploy en BUILDING >10 min sin progreso, logs muestran `load metadata for ghcr.io/...` parado.

```bash
# Empty commit dispara nuevo deploy y reemplaza el atascado
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

Visto en sesión 2026-05-04 (commit `635e3b6`). Funciona porque el builder Railway prioriza el deploy más reciente.

---

## Cuándo NO hacer rollback

- **DB migrations aplicadas:** si la nueva versión añadió columnas/tablas, el rollback puede fallar al intentar leer datos con un schema viejo. En ese caso: `prisma migrate resolve --rolled-back <name>` antes de rollback de código.
- **Cambio de env vars:** si el deploy nuevo usa env vars que el viejo no tenía, rollback OK. Si las cambia/elimina, el viejo puede crashear.
- **Cambios irreversibles en datos:** UPDATEs masivos, deletes, cambios estructurales. Considera mejor un fix-forward que un rollback.

---

## Workflow recomendado tras detectar bug en producción

```
1. ¿Cuánto tiempo lleva el bug en producción?
   <5 min   → Rollback inmediato (opción 1 o 2)
   >30 min  → Evalúa: rollback vs fix-forward

2. ¿El fix es trivial (<3 líneas, <5 min)?
   Sí → fix-forward (commit + push, dejar CI bloquearlo si hay regresión)
   No → rollback ahora, fix con calma luego

3. Tras rollback / fix-forward:
   npm run deploy:smoke   # verificar URLs OK
   git tag rollback-<fecha>  # marcar para histórico
```

---

## Histórico de rollbacks

| Fecha | Razón | Acción | Tiempo |
|---|---|---|---|
| 2026-05-04 | Pánico falso (era dominio fantasma) | git revert + revert-of-revert | 15 min (innecesario) |
| 2026-05-04 | Build atascado en Docker pull | empty commit | 5 min |

> **Lección:** El rollback del 2026-05-04 fue innecesario — la app estaba viva pero yo consultaba dominio incorrecto. Antes de rollback: SIEMPRE `railway domain` + `npm run deploy:smoke`.
