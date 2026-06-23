#!/usr/bin/env bash
# install-db.sh — instala y configura PostgreSQL en CT 43362480DB (172.16.90.207)
# Ejecutar como root desde dentro del CT: bash scripts/install-db.sh
set -euo pipefail

DB_USER="${DB_USER:-bloguser}"
DB_PASSWORD="${DB_PASSWORD:-blogpass}"
DB_NAME="${DB_NAME:-blog_db}"
APP_HOST="${APP_HOST:-172.16.90.215}"  # CT que puede conectarse

echo "==> Instalando dependencias..."
apt-get update
apt-get install -y postgresql postgresql-contrib curl ca-certificates

systemctl enable postgresql
systemctl start postgresql

echo "==> Creando usuario y base de datos..."
su -c "psql -v ON_ERROR_STOP=1" postgres <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')
\gexec

GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

echo "==> Configurando acceso remoto desde $APP_HOST..."

PG_VERSION=$(psql --version | grep -oP '\d+' | head -1)
PG_CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"
PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"

# Escuchar en todas las interfaces
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF"

# Permitir conexión desde el CT de la app
HBA_RULE="host    ${DB_NAME}    ${DB_USER}    ${APP_HOST}/32    md5"
grep -qF "$HBA_RULE" "$PG_HBA" || echo "$HBA_RULE" >> "$PG_HBA"

systemctl restart postgresql

echo ""
echo "✓ PostgreSQL listo."
echo "  Host:     172.16.90.207:5432"
echo "  Base:     $DB_NAME"
echo "  Usuario:  $DB_USER"
echo ""
echo "  Configurá el .env del backend con estos valores."
echo "  Logs:  journalctl -u postgresql -f"
