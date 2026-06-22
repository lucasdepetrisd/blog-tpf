#!/usr/bin/env bash
# update-db.sh — actualiza la base de datos en CT 43362480DB
# Uso: bash /opt/blog/repo/scripts/update-db.sh
set -euo pipefail

CLONE_DIR="/opt/blog/repo"

echo "==> Actualizando repo..."
if [ -d "$CLONE_DIR/.git" ]; then
  git -C "$CLONE_DIR" pull
else
  git clone "${REPO_URL:-https://github.com/lucasdepetrisd/blog-tpf}" "$CLONE_DIR"
fi

echo "==> Aplicando schema SQL..."
su -c "psql -v ON_ERROR_STOP=1 -d blog_db -f $CLONE_DIR/scripts/schema.sql" postgres

echo "✓ Base de datos actualizada."
