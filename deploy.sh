#!/usr/bin/env bash
#
# deploy.sh — Andromeda & Zwart Gat Live Simulatie
# Installeert en configureert:
#   - de statische frontend (index.html, script.js) onder /opt/andromeda
#   - een Python-venv + Flask/gunicorn backend
#   - een systemd-service "andromeda-backend"
#   - een nginx-server genaamd "andromeda" voor andromeda.abelsoftware123.com
#   - (optioneel) een Let's Encrypt/certbot TLS-certificaat
#
# Gebruik (als root of via sudo), vanuit de projectroot:
#   sudo ./deploy.sh
#
# Herhaald draaien is veilig (idempotent): bestaande installatie wordt
# bijgewerkt in plaats van dubbel aangemaakt.

set -euo pipefail

# ---------------------------------------------------------------------
# Instellingen
# ---------------------------------------------------------------------
DOMAIN="andromeda.abelsoftware123.com"
APP_DIR="/opt/andromeda"
VENV_DIR="${APP_DIR}/venv"
SERVICE_NAME="andromeda-backend"
SYSTEM_USER="andromeda"
LOG_DIR="/var/log/andromeda"
NGINX_SITE_NAME="andromeda"
NGINX_AVAILABLE="/etc/nginx/sites-available/${NGINX_SITE_NAME}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${NGINX_SITE_NAME}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@abelsoftware123.com}"
SKIP_TLS="${SKIP_TLS:-false}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------
# Hulpfuncties
# ---------------------------------------------------------------------
info()  { echo -e "\033[1;36m[deploy]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[deploy]\033[0m $*"; }
error() { echo -e "\033[1;31m[deploy]\033[0m $*" >&2; }

require_root() {
    if [[ "${EUID}" -ne 0 ]]; then
        error "Dit script moet als root draaien (gebruik: sudo ./deploy.sh)"
        exit 1
    fi
}

command_exists() { command -v "$1" >/dev/null 2>&1; }

# ---------------------------------------------------------------------
# 0. Voorwaarden
# ---------------------------------------------------------------------
require_root
info "Start deploy voor domein: ${DOMAIN}"

if ! command_exists python3; then
    error "python3 is niet geïnstalleerd. Installeer eerst: apt install python3 python3-venv python3-pip"
    exit 1
fi

if ! command_exists nginx; then
    warn "nginx niet gevonden — wordt geïnstalleerd."
    apt-get update -y
    apt-get install -y nginx
fi

if ! command_exists python3 -m venv; then
    apt-get install -y python3-venv >/dev/null 2>&1 || true
fi

# ---------------------------------------------------------------------
# 1. Systeemgebruiker voor de service (geen login, geen home-schrijfrechten)
# ---------------------------------------------------------------------
if ! id -u "${SYSTEM_USER}" >/dev/null 2>&1; then
    info "Systeemgebruiker '${SYSTEM_USER}' aanmaken…"
    useradd --system --no-create-home --shell /usr/sbin/nologin "${SYSTEM_USER}"
else
    info "Systeemgebruiker '${SYSTEM_USER}' bestaat al."
fi

# ---------------------------------------------------------------------
# 2. Applicatiebestanden kopiëren naar /opt/andromeda
# ---------------------------------------------------------------------
info "Applicatiebestanden kopiëren naar ${APP_DIR}…"
mkdir -p "${APP_DIR}"
mkdir -p "${LOG_DIR}"

# Frontend
cp -f "${SCRIPT_DIR}/index.html" "${APP_DIR}/index.html"
cp -f "${SCRIPT_DIR}/script.js"  "${APP_DIR}/script.js"

# Backend
mkdir -p "${APP_DIR}/backend"
cp -f "${SCRIPT_DIR}/backend/app.py" "${APP_DIR}/backend/app.py"
cp -f "${SCRIPT_DIR}/backend/requirements.txt" "${APP_DIR}/backend/requirements.txt"

chown -R "${SYSTEM_USER}:${SYSTEM_USER}" "${APP_DIR}" "${LOG_DIR}"

# ---------------------------------------------------------------------
# 3. Python virtual environment + dependencies
# ---------------------------------------------------------------------
if [[ ! -d "${VENV_DIR}" ]]; then
    info "Virtual environment aanmaken in ${VENV_DIR}…"
    python3 -m venv "${VENV_DIR}"
fi

info "Python dependencies installeren…"
"${VENV_DIR}/bin/pip" install --upgrade pip --quiet
"${VENV_DIR}/bin/pip" install -r "${APP_DIR}/backend/requirements.txt" --quiet
chown -R "${SYSTEM_USER}:${SYSTEM_USER}" "${VENV_DIR}"

# ---------------------------------------------------------------------
# 4. systemd-service installeren
# ---------------------------------------------------------------------
info "systemd-service '${SERVICE_NAME}' installeren…"
cp -f "${SCRIPT_DIR}/backend/andromeda-backend.service" "/etc/systemd/system/${SERVICE_NAME}.service"

systemctl daemon-reload
systemctl enable "${SERVICE_NAME}"
systemctl restart "${SERVICE_NAME}"

sleep 1
if systemctl is-active --quiet "${SERVICE_NAME}"; then
    info "Service '${SERVICE_NAME}' draait."
else
    error "Service '${SERVICE_NAME}' kon niet starten. Controleer: journalctl -u ${SERVICE_NAME} -n 50"
    exit 1
fi

# ---------------------------------------------------------------------
# 5. nginx-server "andromeda" configureren
# ---------------------------------------------------------------------
info "nginx-configuratie voor '${DOMAIN}' plaatsen…"
mkdir -p /var/www/certbot

cp -f "${SCRIPT_DIR}/nginx/andromeda.conf" "${NGINX_AVAILABLE}"

if [[ ! -e "${NGINX_ENABLED}" ]]; then
    ln -s "${NGINX_AVAILABLE}" "${NGINX_ENABLED}"
fi

# Als er nog geen certificaat bestaat, gebruik tijdelijk een HTTP-only
# configuratie zodat nginx niet crasht op het ontbrekende certificaat
# tijdens de allereerste run (certbot heeft dan nog niets aangemaakt).
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
if [[ ! -f "${CERT_PATH}" ]]; then
    warn "Nog geen TLS-certificaat gevonden voor ${DOMAIN}."
    warn "Tijdelijke HTTP-only configuratie wordt geactiveerd tot certbot draait."
    cat > "${NGINX_AVAILABLE}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    root ${APP_DIR};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF
fi

info "nginx-configuratie testen…"
nginx -t

info "nginx herladen…"
systemctl reload nginx || systemctl restart nginx

# ---------------------------------------------------------------------
# 6. TLS-certificaat via certbot (optioneel, aan te zetten met DNS live)
# ---------------------------------------------------------------------
if [[ "${SKIP_TLS}" == "true" ]]; then
    warn "SKIP_TLS=true — certbot-stap overgeslagen."
else
    if ! command_exists certbot; then
        warn "certbot niet gevonden — wordt geïnstalleerd."
        apt-get install -y certbot python3-certbot-nginx
    fi

    info "Let op: zorg dat het DNS A-record van ${DOMAIN} al naar dit server-IP wijst."
    read -p "Doorgaan met certbot om een TLS-certificaat aan te vragen? [y/N] " -n 1 -r
    echo
    if [[ "${REPLY}" =~ ^[Yy]$ ]]; then
        certbot --nginx -d "${DOMAIN}" \
            --non-interactive --agree-tos -m "${CERTBOT_EMAIL}" \
            --redirect

        info "Volledige HTTPS-configuratie herstellen na certbot…"
        cp -f "${SCRIPT_DIR}/nginx/andromeda.conf" "${NGINX_AVAILABLE}"
        nginx -t && systemctl reload nginx
    else
        warn "Certbot-stap overgeslagen. Site draait vooralsnog alleen via HTTP."
    fi
fi

# ---------------------------------------------------------------------
# 7. Klaar
# ---------------------------------------------------------------------
info "----------------------------------------------------------------"
info "Deploy voltooid."
info "  Frontend + backend: ${APP_DIR}"
info "  Backend-service:    systemctl status ${SERVICE_NAME}"
info "  Backend-logs:       journalctl -u ${SERVICE_NAME} -f"
info "  nginx-config:       ${NGINX_AVAILABLE}"
info "  Site:                http(s)://${DOMAIN}"
info "----------------------------------------------------------------"
