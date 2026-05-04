#!/usr/bin/env bash
#
# smoke-test.sh — verifica que las URLs críticas devuelven 200/307/308 tras un deploy.
#
# Uso:
#   npm run deploy:smoke
#   ./scripts/smoke-test.sh [DOMAIN]
#
# Si no pasas DOMAIN, lo extrae con `railway domain`.
# Exit code: 0 si todo OK, 1 si alguna URL falla.
#
# Pensado para correr DESPUÉS de un deploy SUCCESS — confirma que el routing está bien
# y que el container no quedó zombie con la app caída detrás de un fallback edge.
#

set -euo pipefail

DOMAIN="${1:-}"

if [ -z "$DOMAIN" ]; then
  if ! command -v railway &> /dev/null; then
    echo "✗ railway CLI no instalada y no se pasó DOMAIN como argumento"
    exit 1
  fi
  DOMAIN=$(railway domain 2>&1 | grep -oE 'https://[^ ]+' | head -1)
  if [ -z "$DOMAIN" ]; then
    echo "✗ No se pudo obtener dominio canónico"
    exit 1
  fi
fi

echo "Smoke test contra: $DOMAIN"
echo ""

# Rutas críticas que SIEMPRE deben responder en producción.
# 200 = página estática/SSR · 307/308 = redirect (auth gate, etc.)
declare -a ROUTES=(
  "/"
  "/login"
  "/signup"
  "/forgot-password"
  "/onboarding/1"
)

FAILS=0
for route in "${ROUTES[@]}"; do
  URL="${DOMAIN}${route}"
  CODE=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 10 "$URL" 2>/dev/null || echo "000")
  if [[ "$CODE" =~ ^(200|307|308)$ ]]; then
    printf "  ✓ %-30s HTTP %s\n" "$route" "$CODE"
  else
    printf "  ✗ %-30s HTTP %s\n" "$route" "$CODE"
    FAILS=$((FAILS + 1))
  fi
done

echo ""
if [ $FAILS -eq 0 ]; then
  echo "✓ SMOKE OK — ${#ROUTES[@]} rutas respondiendo."
  exit 0
else
  echo "✗ SMOKE FAIL — $FAILS de ${#ROUTES[@]} rutas no responden."
  echo ""
  echo "Posibles causas:"
  echo "  · Edge devolviendo x-railway-fallback (dominio incorrecto)"
  echo "  · Container no arrancó (revisar railway logs --deployment <id>)"
  echo "  · App crasheó tras el boot"
  exit 1
fi
