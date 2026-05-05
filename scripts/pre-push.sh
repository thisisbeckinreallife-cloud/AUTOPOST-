#!/usr/bin/env bash
#
# pre-push.sh — Git hook que valida el build ANTES de pushear a remote.
#
# Filosofía: pillar errores en 1 min localmente en vez de 10 min en Railway.
# Cuando esto falla, Railway ni se entera — ahorras un build entero.
#
# Bypass de emergencia: SKIP_PREPUSH=1 git push
#
# Para activar este hook:
#   ln -s ../../scripts/pre-push.sh .git/hooks/pre-push
#   chmod +x scripts/pre-push.sh
#

set -e

if [ "${SKIP_PREPUSH:-0}" = "1" ]; then
  echo "⚠ Pre-push validation SKIPPED (SKIP_PREPUSH=1)"
  exit 0
fi

START=$(date +%s)
echo "════════════════════════════════════════════"
echo "  PRE-PUSH VALIDATION"
echo "════════════════════════════════════════════"
echo ""

# 1. Detectar lock desync — DOS niveles
echo "→ Verificando package-lock.json sincronizado..."
if [ -f package-lock.json ] && [ -f package.json ]; then
  # 1a. Check rápido por mtime
  if [ "package.json" -nt "package-lock.json" ]; then
    echo "✗ package.json modificado después que package-lock.json"
    echo "  → Ejecuta: npm install"
    echo "  → Esto destrucción 8 deploys consecutivos en Fase 2."
    exit 1
  fi
  # 1b. Check estricto: simular lo que hará GitHub Actions y Railway
  # Esto pilla casos donde el mtime es OK pero el lock no describe
  # todos los paquetes (caso real: root cause del 9º deploy fail).
  if ! npm ci --dry-run > /tmp/prepush-npmci.log 2>&1; then
    echo "✗ npm ci --dry-run falla → el lock no está completo"
    echo "  → rm -rf node_modules package-lock.json && npm install"
    echo "  Últimas líneas del error:"
    tail -8 /tmp/prepush-npmci.log | sed 's/^/    /'
    exit 1
  fi
fi
echo "  ✓ Lock OK (mtime + npm ci dry-run)"
echo ""

# 2. Type-check (rápido, ~10s)
echo "→ Type-check (npx tsc --noEmit)..."
if ! npx tsc --noEmit 2>&1 | tail -5; then
  echo "✗ Type-check failed. Arregla los errores antes de pushear."
  exit 1
fi
echo "  ✓ Type-check OK"
echo ""

# 3. Build local (lento pero crítico, ~30s-2min)
echo "→ Build local (npm run build)..."
if ! npm run build > /tmp/prepush-build.log 2>&1; then
  echo "✗ Build failed. Últimas 20 líneas:"
  tail -20 /tmp/prepush-build.log
  echo ""
  echo "Log completo: /tmp/prepush-build.log"
  exit 1
fi
echo "  ✓ Build OK"
echo ""

ELAPSED=$(($(date +%s) - START))
echo "════════════════════════════════════════════"
echo "  ✓ PRE-PUSH OK — ${ELAPSED}s"
echo "════════════════════════════════════════════"
echo "Listo para pushear. Railway construirá en ~3-5 min."
