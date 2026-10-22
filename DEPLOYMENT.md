# Deploying to Azure App Service

The whole app runs as **one** Azure Web App: Django serves the API and the
built React bundle from the same origin, so there is nothing to configure
for CORS and only one process to keep warm.

## What you need

- An Azure subscription and the [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) (`az --version`)
- Node.js 18+ and the backend virtualenv (`backend/venv`) already in place
- `az login`

## Deploy

```bash
az login
bash backend/azure/azure-deploy.sh
```

The script is idempotent — run it again to ship a new version. It:

1. Creates (or reuses) resource group `movie-recommender-rg`, a Linux
   `B1` App Service plan (Always On, 1 core / 1.75 GB — gunicorn loads the
   pickle once and forks, so both workers share the ~200 MB model) and the
   web app `movie-recommender-app` on `PYTHON:3.12`.

   `B1` is chosen because student/free subscriptions have zero quota for
   the `P*v3` families (`Operation cannot be completed without additional
   quota`). If your subscription has that quota and you want more than one
   core, change `SKU` at the top of the script.
2. Sets `SECRET_KEY` (generated once, then reused), `DEBUG=False`,
   `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `TMDB_API_KEY` and
   `SCM_DO_BUILD_DURING_DEPLOYMENT=true`, enables Always On and sets the
   startup command to `bash startup.sh`.
3. Builds the React app with `PUBLIC_URL=/` (root-relative assets) and
   `REACT_APP_API_URL=https://<app-host>`, copies the output to
   `backend/staticfiles_public/`, then runs `collectstatic`.
4. Packages `backend/` with `backend/azure/make_package.py` (the ~56 MB
   zip, model included, no `venv`, logs or database) and uploads it with
   `az webapp deploy`.
5. Polls `https://<app-host>/api/health/` until the app answers.

Everything in step 1–2 is configurable at the top of
`backend/azure/azure-deploy.sh` (names, region, SKU, TMDB key).

## What runs on the server

`backend/startup.sh` is the startup command. It applies migrations,
collects static files if they are missing, then starts:

```bash
gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 120 \
    --preload movie_recommender_project.wsgi:application
```

Request routing in `movie_recommender_project/urls.py`:

| Path            | Served by                                    |
| --------------- | -------------------------------------------- |
| `/api/...`      | Django REST endpoints (`health`, `movies`, `recommend`) |
| `/admin/`       | Django admin                                 |
| `/static/...`   | WhiteNoise (admin/admin assets) then the React build |
| anything else   | `index.html` so client-side routes work      |

## Verify the deployment

```bash
curl https://movie-recommender-app.azurewebsites.net/api/health/
# {"status":"ok","ready":true}
```

Open the site and search for a movie; the request goes to
`https://<host>/api/recommend/` on the same origin.

To create an admin user:

```bash
az webapp ssh -g movie-recommender-rg -n movie-recommender-app
python manage.py createsuperuser
```

## Logs and troubleshooting

```bash
az webapp log tail -g movie-recommender-rg -n movie-recommender-app
```

- **502 / app never answers** — the startup command failed; the tail above
  shows the traceback. `az webapp log download` fetches the full log.
- **"Frontend build not found"** — `backend/staticfiles_public/` was empty
  when the package was built; rerun the deploy script.
- **Static assets 404** — `collectstatic` or the copy step did not run;
  check the script output before the upload step.
- **`az webapp deploy` reports "site failed to start"** — on a cold
  container the first start attempt can fail while Oryx is still unpacking
  the zip, and App Service then reports the whole deployment as failed even
  though the next attempt runs. The script does not abort on that verdict:
  it checks that the server serves the JS bundle it just built and that
  `/api/health/` answers, and only then reports success. A cold start on B1
  takes roughly two minutes.
- **Slow first request** — Always On keeps the process (and the pickled
  model) in memory; make sure it stays enabled on the plan.
- **Admin login fails with "Origin checking failed"** — the app relies on
  `SECURE_PROXY_SSL_HEADER` (`X-Forwarded-Proto`) to know it is behind
  Azure's TLS terminator; do not remove it or `ALLOWED_HOSTS` entries.

## Local development

Unchanged: `./start.sh` (Django on :8000, React dev server on :3000) or
`npm start` in `frontend/`.
