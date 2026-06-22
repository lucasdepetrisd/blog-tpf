#!/usr/bin/env bash
# update-front.sh — actualiza el frontend en CT 43362480A
# Uso: bash /opt/blog/repo/scripts/update-front.sh
set -euo pipefail

CLONE_DIR="/opt/blog/repo"
DIST_DIR="/var/www/blog/dist"
BASENAME="43362480"

echo "==> Actualizando repo..."
git -C "$CLONE_DIR" pull

echo "==> Copiando dist a $DIST_DIR..."
mkdir -p "$DIST_DIR/static"
rsync -a --delete "$CLONE_DIR/backend/public/" "$DIST_DIR/"

echo "==> Creando subfolder /$BASENAME/..."
mkdir -p "$DIST_DIR/$BASENAME"
cp "$DIST_DIR/index.html" "$DIST_DIR/$BASENAME/index.html"

echo "✓ Frontend actualizado."
