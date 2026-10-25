#!/bin/bash
# Deploy the Movie Recommender to Azure App Service (single web app).
#
#   az login
#   bash backend/azure/azure-deploy.sh
#
# Everything lives on one host: Django serves the API *and* the built
# React app, so there is a single always-on process and no CORS.
#
# The script is idempotent - existing resources are reused.
set -e

# Git Bash rewrites arguments that look like POSIX paths ("/api/health/")
# into Windows paths - that would corrupt PUBLIC_URL and the health
# check path below.
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

# ---------------------------------------------------------------- config ---
GROUP="movie-recommender-rg"
LOCATION="centralindia"
PLAN_NAME="movie-recommender-plan"
APP_NAME="phemis"
SKU="B1"                        # Basic: always-on, 1 core / 1.75 GB. P*v3
                               # quota is 0 on student/free subscriptions.
PYTHON_RUNTIME="PYTHON:3.12"
TMDB_API_KEY="${TMDB_API_KEY:?Set TMDB_API_KEY in your environment before deploying}"

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"
PACKAGE="deploy-package/backend.zip" # relative to the backend dir

# Python used for the build steps (collectstatic, packaging).
if [ -x "$BACKEND_DIR/venv/Scripts/python.exe" ]; then
    PY="$BACKEND_DIR/venv/Scripts/python.exe"
elif [ -x "$BACKEND_DIR/venv/bin/python" ]; then
    PY="$BACKEND_DIR/venv/bin/python"
else
    PY="$(command -v python3 || command -v python)"
fi

step() { echo ""; echo "==> $*"; }

step "Checking Azure login"
az account show --output none

step "Ensuring resource group $GROUP"
az group create -g "$GROUP" -l "$LOCATION" --tags project=movie-recommender --output none

step "Ensuring App Service plan $PLAN_NAME ($SKU)"
az appservice plan create \
    -g "$GROUP" -n "$PLAN_NAME" -l "$LOCATION" \
    --sku "$SKU" --is-linux --number-of-workers 1 --output none

step "Ensuring web app $APP_NAME"
az webapp create \
    -g "$GROUP" -n "$APP_NAME" -p "$PLAN_NAME" -r "$PYTHON_RUNTIME" \
    --https-only true --output none

APP_URL=$(az webapp show -g "$GROUP" -n "$APP_NAME" --query defaultHostName -o tsv)
echo "    host: $APP_URL"

step "Configuring application settings"
# Keep the existing SECRET_KEY so a redeploy does not invalidate
# sessions; only generate one the first time.
SECRET_KEY=$(az webapp config appsettings list -g "$GROUP" -n "$APP_NAME" \
    --query "[?name=='SECRET_KEY'].value | [0]" -o tsv)
if [ -z "$SECRET_KEY" ]; then
    SECRET_KEY=$("$PY" -c "import secrets; print(secrets.token_hex(32))")
fi
az webapp config appsettings set -g "$GROUP" -n "$APP_NAME" --settings \
    SECRET_KEY="$SECRET_KEY" \
    DEBUG=False \
    ALLOWED_HOSTS="$APP_URL,localhost,127.0.0.1,.azurewebsites.net" \
    CORS_ALLOWED_ORIGINS="https://$APP_URL" \
    TMDB_API_KEY="$TMDB_API_KEY" \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    --output none

# Always On keeps the model in memory instead of paying a cold start
# on the first request after an idle period.
az webapp config set -g "$GROUP" -n "$APP_NAME" --always-on true --output none

step "Setting the startup command (bash startup.sh)"
az webapp config set -g "$GROUP" -n "$APP_NAME" --startup-file "bash startup.sh" --output none

step "Building the React frontend for https://$APP_URL"
cd "$FRONTEND_DIR"
# PUBLIC_URL=/ makes the bundle root-relative (the app is served from
# the site root), overriding the GitHub Pages "homepage" in package.json.
PUBLIC_URL=/ \
REACT_APP_API_URL="https://$APP_URL" \
    npm run build

step "Copying the React build into the Django static root"
rm -rf "$BACKEND_DIR/staticfiles_public"
mkdir -p "$BACKEND_DIR/staticfiles_public"
cp -r "$FRONTEND_DIR/build/." "$BACKEND_DIR/staticfiles_public/"

step "Collecting static files"
cd "$BACKEND_DIR"
"$PY" manage.py collectstatic --noinput

step "Packaging the backend"
# Relative paths here: this script disables MSYS path conversion, so a
# POSIX path like /d/... would reach Windows Python unmodified.
"$PY" azure/make_package.py --backend . --out "$PACKAGE"

step "Deploying to Azure (uploads ~56 MB)"
# Azure's own verdict is not trustworthy here: the app has a startup command
# from the first run on, so the container can fail once (and get blocked for
# a minute) while the zip is still being extracted, which makes zip deploy
# report "site failed to start" even though the new code does run. The
# bundle check below is the real result, so do not abort on this command.
if ! az webapp deploy \
    -g "$GROUP" -n "$APP_NAME" \
    --src-path "$PACKAGE" --type zip \
    --timeout 1800000 --track-status false; then
    echo "az reported a deployment failure - verifying the site itself"
fi

# The hash in the file name changes on every build, so its presence proves
# the deployed code is the code built above.
BUNDLE="$(cd "$FRONTEND_DIR/build/static/js" && ls main.*.js | head -1)"
step "Waiting for https://$APP_URL to serve $BUNDLE"
READY=0
for _ in $(seq 1 72); do
    if curl -fsS --max-time 15 "https://$APP_URL/static/js/$BUNDLE" > /dev/null 2>&1 \
        && curl -fsS --max-time 15 "https://$APP_URL/api/health/" > /dev/null 2>&1; then
        READY=1
        break
    fi
    sleep 5
done

echo ""
if [ "$READY" = "1" ]; then
    echo "Deployment complete."
    echo "  App:   https://$APP_URL"
    echo "  API:   https://$APP_URL/api/health/"
    echo "  Logs:  az webapp log tail -g $GROUP -n $APP_NAME"
else
    echo "The new bundle was not being served in time."
    echo "Check the logs with:"
    echo "  az webapp log tail -g $GROUP -n $APP_NAME"
    exit 1
fi
