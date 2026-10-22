#!/bin/bash
# Azure App Service startup command.
#
# The App Service "Startup Command" is set to:  bash startup.sh
# It runs from the deployed app root (the directory that holds manage.py).
set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

PORT="${PORT:-8000}"

log() {
    echo "[startup] $(date -u +%FT%TZ) $*"
}

# The recommendations do not need the database, but the Django admin
# does - a failed migration must not keep the whole app from starting.
log "app dir: $APP_DIR"
log "applying database migrations"
python manage.py migrate --noinput || log "migrate failed - continuing"

# The deployment package already contains the collected static files;
# this is only a safety net for a fresh build.
if [ ! -d "$APP_DIR/staticfiles" ]; then
    log "collecting static files"
    python manage.py collectstatic --noinput || log "collectstatic failed - continuing"
fi

log "starting gunicorn on 0.0.0.0:${PORT}"
exec gunicorn \
    --name movie-recommender \
    --bind "0.0.0.0:${PORT}" \
    --workers 2 \
    --threads 2 \
    --timeout 120 \
    --preload \
    --access-logfile - \
    --error-logfile - \
    movie_recommender_project.wsgi:application
