#!/usr/bin/env bash
#
# deploy-status.sh — estado actual del deploy en Railway + URLs canónicas
#
# Uso:
#   npm run deploy:status
#   ./scripts/deploy-status.sh
#
# Salida: status del último deploy + commit + dominio + curl HEAD a las URLs críticas.
#
# Requiere: railway CLI logueada en el proyecto AUTOPOST.
#

set -euo pipefail

# --- 1. Status del último deploy ---
echo "════════════════════════════════════════════"
echo "  RAILWAY DEPLOY STATUS"
echo "════════════════════════════════════════════"

if ! command -v railway &> /dev/null; then
  echo "✗ railway CLI no instalada. brew install railway"
  exit 1
fi

DEPLOY_INFO=$(railway status --json 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    ld = d['environments']['edges'][0]['node']['serviceInstances']['edges'][0]['node']['latestDeployment']
    print(f\"id={ld['id']}\")
    print(f\"status={ld['status']}\")
    print(f\"created={ld['createdAt']}\")
    print(f\"commit={ld.get('meta',{}).get('commitHash','n/a')[:8]}\")
    msg = (ld.get('meta',{}).get('commitMessage') or '').split('\n')[0]
    print(f\"message={msg[:80]}\")
except Exception as e:
    print(f'ERROR={e}')
") || { echo "✗ Error al consultar railway status"; exit 1; }

echo "$DEPLOY_INFO"
echo ""

# --- 2. Dominio canónico (NUNCA asumir) ---
echo "════════════════════════════════════════════"
echo "  DOMINIO CANÓNICO"
echo "════════════════════════════════════════════"

DOMAIN_OUTPUT=$(railway domain 2>&1 || echo "ERROR")
DOMAIN=$(echo "$DOMAIN_OUTPUT" | grep -oE 'https://[^ ]+' | head -1 || echo "")

if [ -z "$DOMAIN" ]; then
  echo "✗ No se pudo obtener dominio. Output:"
  echo "$DOMAIN_OUTPUT"
  exit 1
fi

echo "$DOMAIN"
echo ""

# --- 3. Smoke test rápido (HEAD a 4 URLs) ---
echo "════════════════════════════════════════════"
echo "  SMOKE TEST"
echo "════════════════════════════════════════════"

ROUTES=("/" "/login" "/signup" "/onboarding/1")
ALL_OK=true

for route in "${ROUTES[@]}"; do
  URL="${DOMAIN}${route}"
  CODE=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 8 "$URL" 2>/dev/null || echo "000")
  if [[ "$CODE" =~ ^(200|307|308)$ ]]; then
    printf "  ✓ %-30s HTTP %s\n" "$route" "$CODE"
  else
    printf "  ✗ %-30s HTTP %s\n" "$route" "$CODE"
    ALL_OK=false
  fi
done

echo ""
if $ALL_OK; then
  echo "✓ Todas las rutas críticas responden."
  exit 0
else
  echo "✗ Hay rutas que NO responden. Investigar con:"
  echo "  railway logs --deployment <id> --lines 50"
  exit 1
fi
