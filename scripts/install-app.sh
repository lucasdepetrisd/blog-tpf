#!/usr/bin/env bash
# install-app.sh — instala frontend + backend en CT 43362480A (172.16.90.215)
# Uso: curl -fsSL <url-raw>/scripts/install-app.sh | bash
#   o: bash scripts/install-app.sh  (desde dentro del repo ya clonado)
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/lucasdepetrisd/blog-tpf}"
CLONE_DIR="/opt/blog/repo"
DIST_DIR="/var/www/blog/dist"
BACKEND_DIR="/opt/blog/backend"
SERVICE_FILE="/etc/systemd/system/blog.service"

echo "==> Instalando dependencias del sistema..."
apt-get update
apt-get install -y git nginx python3 python3-pip python3-venv curl ca-certificates rsync

# ── Clonar / actualizar repo ──────────────────────────────────────────────────
if [ -d "$CLONE_DIR/.git" ]; then
  echo "==> Actualizando repo..."
  git -C "$CLONE_DIR" pull
else
  echo "==> Clonando repo..."
  git clone "$REPO_URL" "$CLONE_DIR"
fi

REPO_DIR="$CLONE_DIR"

# ── Frontend ──────────────────────────────────────────────────────────────────
# El dist se buildea en la PC de desarrollo y se sube al repo.
# El CT solo copia — no necesita Node.
if [ ! -d "$REPO_DIR/backend/public/assets" ]; then
  echo "ERROR: no se encontró el dist del frontend en backend/public/"
  echo "Ejecutá 'npm run build' en tu PC y commiteá el resultado antes de deployar."
  exit 1
fi
echo "==> Frontend dist encontrado, saltando build..."

echo "==> Copiando dist a $DIST_DIR..."
mkdir -p "$DIST_DIR/static"
rsync -a --delete "$REPO_DIR/backend/public/" "$DIST_DIR/"

# ── Backend ───────────────────────────────────────────────────────────────────
echo "==> Instalando backend en $BACKEND_DIR..."
mkdir -p "$BACKEND_DIR"
rsync -a --exclude='.venv' --exclude='__pycache__' --exclude='public' \
  "$REPO_DIR/backend/" "$BACKEND_DIR/"

cd "$BACKEND_DIR"
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# Crear .env si no existe
if [ ! -f "$BACKEND_DIR/.env" ]; then
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  echo ""
  echo "  ATENCIÓN: se copió .env.example a .env"
  echo "  Editá $BACKEND_DIR/.env con las credenciales reales antes de iniciar."
  echo ""
fi

# ── Systemd ───────────────────────────────────────────────────────────────────
echo "==> Configurando servicio systemd..."
cat > "$SERVICE_FILE" <<'EOF'
[Unit]
Description=Blog TPF - FastAPI
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/blog/backend
ExecStart=/opt/blog/backend/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 1 --loop uvloop
Restart=always
RestartSec=3
EnvironmentFile=/opt/blog/backend/.env
Environment=STATIC_DIR=/var/www/blog/dist/static

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable blog
systemctl restart blog

# ── Nginx ─────────────────────────────────────────────────────────────────────
echo "==> Configurando nginx..."
cp "$REPO_DIR/nginx/blog.conf" /etc/nginx/sites-available/blog
ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/blog
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

echo ""
echo "✓ Deploy completo."
echo "  Blog:    http://172.16.90.215"
echo "  API:     http://172.16.90.215/api"
echo "  Logs:    journalctl -u blog -f"
