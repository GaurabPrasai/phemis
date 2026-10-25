# Phemis

**Find a film for how you feel.** Pick a mood, and Phemis suggests ten films that fit it. Or start from a movie you already love and get similar ones.

<!-- Live demo: add your link here once the Azure app is up, e.g. https://phemis.azurewebsites.net -->

## Features

- **Mood-based picks.** Nine moods (laugh, cozy, need a good cry, romantic, hyped, spooky, mind-bending, adventure, inspired) with refinements for energy, who you are watching with, and runtime.
- **Similar to a movie.** Search the catalog and get films with a similar feel, using content-based similarity.
- **Blend both.** Add a movie you loved to a mood search and the results mix mood match with similarity.
- **Shuffle.** Get a fresh set of ten without repeats.
- **Film details.** Poster, rating, runtime, genres, synopsis and a short "why it fits" line.
- **Watchlist.** Save films in your browser.
- **Shareable state.** Your mood and filters live in the URL, so a refresh or a shared link restores the view.
- **Responsive and accessible.** Works on phone and desktop, keyboard friendly, respects reduced-motion settings.

## How it works

### Similar movies
The catalog (about 4,800 popular films, mostly before 2018) is turned into text "tags" per movie (genres, keywords, cast, crew, overview). The tags are vectorised and compared with **cosine similarity**. The result is a precomputed similarity matrix stored as a pickle, so a lookup at request time is a single array read.

### Mood picks
Mood ranking is plain NumPy, with no LLM and no TMDB call while you browse.

- Each mood has a **profile** in `backend/movies/moods.py`: genre weights, genres to avoid, and keywords.
- **Energy** (chill, balanced, intense) and **company** (alone, partner, friends, family) adjust those weights. Choosing *family* is a hard filter: Family or Animation only, and no Horror, Thriller, Crime or War.
- **Score** = 0.55 x genre match + 0.15 x keyword hits + 0.30 x Bayesian-weighted rating, minus 0.5 for an avoided genre. With a seed movie the final score is 0.65 x mood + 0.35 x similarity.
- **Shuffle** samples ten films from the top 30 candidates, skipping titles you have already seen.
- Metadata (genres, runtime, rating, poster path, synopsis, keywords) was fetched once from TMDB into `backend/recommender_api/movie_meta.json`, so requests do not call TMDB.

## Tech stack

| Layer | Tools |
|---|---|
| Backend | Python 3.10 to 3.12, Django 5, Django REST Framework, pandas, NumPy, WhiteNoise, Gunicorn |
| Frontend | React 18 (Create React App), plain CSS, axios |
| Data | TMDB 5000-style movie dataset, TMDB API for metadata |
| Hosting | Azure App Service (one app serves both the API and the built React site) |

## Getting started

### Prerequisites
- Python 3.10 to 3.12
- Node.js 18 or newer
- Git with [Git LFS](https://git-lfs.github.com) (the model files are large)
- A free [TMDB API key](https://www.themoviedb.org/settings/api)

### 1. Clone and fetch the model files

```bash
git lfs install
git clone https://github.com/GaurabPrasai/phemis.git
cd phemis
git lfs pull
```

Check that `backend/recommender_api/movies.pkl` and `similarity.pkl` are real files (megabytes, not about 130 bytes). If they are tiny text files, see [docs/LFS.md](docs/LFS.md).

### 2. Backend

```bash
cd backend
python -m venv venv
# macOS / Linux:  source venv/bin/activate
# Windows (Git Bash or MSYS2): use venv/Scripts/python.exe for every command below
pip install -r requirements.txt
```

Create `backend/.env` (it is gitignored):

```
TMDB_API_KEY=your_tmdb_key
```

Run it:

```bash
python manage.py runserver
```

The API is now at http://localhost:8000/api/health/. The first start takes a few seconds while the model loads.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env.local` so the dev server talks to your local backend:

```
REACT_APP_API_URL=http://localhost:8000
```

Then:

```bash
npm start
```

Open http://localhost:3000.

### Shortcut

`./start.sh` (from the repo root, in Git Bash or a Unix shell) creates the virtual environment if needed, starts Django on port 8000 and the React dev server on port 3000.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `TMDB_API_KEY` | backend | Poster lookups and rebuilding the metadata |
| `SECRET_KEY` | backend | Django secret (generated once on Azure) |
| `DEBUG` | backend | `True` by default locally, `False` in production |
| `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` | backend | Set automatically by the Azure deploy script |
| `REACT_APP_API_URL` | frontend | API base URL. Leave empty in production (same origin) |

The frontend never needs a TMDB key. Never put secrets in anything under `frontend/`, because they end up in the public JavaScript.

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health/` | Health check (`ready: true` once the model is loaded) |
| GET | `/api/movies/` | All movie titles (used by the search box) |
| POST | `/api/recommend/` | Movies similar to a title. Body: `{"movie_title": "Avatar"}` |
| GET | `/api/moods/` | The nine moods (`slug`, `label`, `emoji`, `blurb`) |
| POST | `/api/recommend/mood/` | Mood-based picks (below) |

`POST /api/recommend/mood/` body (only `mood` is required, unknown moods return 400):

```json
{
  "mood": "cry",
  "energy": "chill",
  "company": "alone",
  "max_runtime": 120,
  "seed_movie": "Titanic",
  "exclude": ["Doctor Zhivago"],
  "limit": 10
}
```

Each result has `movie_id`, `title`, `poster_url`, `year`, `rating`, `runtime`, `genres`, `overview` and `why`.

## Tests

```bash
cd backend
python manage.py test movies        # 8 backend tests

cd ../frontend
npm test -- --watchAll=false        # frontend tests
npm run build                       # production build
```

## Deployment

The whole app runs as **one Azure App Service**: Django serves the API and the built React bundle from the same address, so there is no CORS setup and only one process to keep warm.

```bash
az login
export TMDB_API_KEY="your_tmdb_key"
bash backend/azure/azure-deploy.sh
```

The script is safe to re-run. The first deploy on a new app can take 10 minutes or more while Azure installs the Python packages, and Azure may report a 504 timeout even though the deploy is still running. See [DEPLOYMENT.md](DEPLOYMENT.md) for the full guide, troubleshooting and how to rename the app.

## Rebuilding the movie metadata

Only needed if you change the catalog:

```bash
cd backend
TMDB_API_KEY=your_key python scripts/build_movie_meta.py
```

The script is resumable and skips movies it already has.

## Troubleshooting

- **Model fails to load or the app shows no films.** Check that the `.pkl` files are real files and not Git LFS pointers (see [docs/LFS.md](docs/LFS.md)). If the files are missing entirely, the backend tries to download them from Hugging Face.
- **Mood endpoints return 503.** `movie_meta.json` is missing or the model did not load. Check the server log.
- **Frontend cannot reach the API locally.** Make sure the backend is running on port 8000 and `frontend/.env.local` sets `REACT_APP_API_URL=http://localhost:8000`.
- **`No module named django` on Windows.** Your shell is using a different Python than the project's. Run commands with `venv/Scripts/python.exe`.

## Known limits and ideas

- The catalog is about 4,800 films, mostly released before 2018. Newer films would need a live TMDB source blended in.
- Possible next steps: free-text mood input ("stressed after exams"), user accounts and ratings, collaborative filtering, streaming availability per country.

## Credits

Movie data and posters come from [TMDB](https://www.themoviedb.org). *This product uses the TMDB API but is not endorsed or certified by TMDB.*

## Contributing

Fork the repo, create a feature branch, and open a pull request describing the change. Please run the backend and frontend tests first.

## Contact

Gaurab Prasai: [GitHub](https://github.com/GaurabPrasai) · Gaurabprasaigp@gmail.com