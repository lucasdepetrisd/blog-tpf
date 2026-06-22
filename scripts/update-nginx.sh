#!/usr/bin/env bash
# update-nginx.sh — actualiza la config de nginx en CT 43362480A
# Uso: bash /opt/blog/repo/scripts/update-nginx.sh
set -euo pipefail

CLONE_DIR="/opt/blog/repo"

echo "==> Actualizando repo..."
git -C "$CLONE_DIR" pull

echo "==> Aplicando config de nginx..."
cp "$CLONE_DIR/nginx/blog.conf" /etc/nginx/sites-available/blog
ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/blog
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

echo "✓ Nginx actualizado."
