"""Fetch TMDB metadata for every movie in movies.pkl, once.

Writes ``recommender_api/movie_meta.json`` as ``{"<movie_id>": {...}}``.
The backend reads that file at startup, so it never needs TMDB at
runtime. The script is resumable: ids already in the file are skipped.

Usage (from backend/):
    TMDB_API_KEY=xxx python scripts/build_movie_meta.py
"""

import json
import os
import pickle
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

BACKEND = Path(__file__).resolve().parent.parent
MOVIES_PKL = BACKEND / "recommender_api" / "movies.pkl"
OUTPUT = BACKEND / "recommender_api" / "movie_meta.json"

API = "https://api.themoviedb.org/3/movie/{movie_id}"
TIMEOUT = (3, 8)
WORKERS = 8
RETRIES = 3
SAVE_EVERY = 200
OVERVIEW_CHARS = 300


def load_ids():
    with open(MOVIES_PKL, "rb") as handle:
        movies = pickle.load(handle)
    return sorted({int(movie_id) for movie_id in movies["movie_id"]})


def load_existing():
    if not OUTPUT.exists():
        return {}
    try:
        with open(OUTPUT, encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, ValueError):
        return {}


def save(meta):
    tmp = OUTPUT.with_suffix(".json.tmp")
    with open(tmp, "w", encoding="utf-8") as handle:
        json.dump(meta, handle, separators=(",", ":"), sort_keys=True)
    os.replace(tmp, OUTPUT)


def fetch_one(session, api_key, movie_id):
    """Return the trimmed metadata dict, or None if TMDB has no such movie."""
    params = {"api_key": api_key, "append_to_response": "keywords"}
    for attempt in range(1, RETRIES + 1):
        try:
            response = session.get(
                API.format(movie_id=movie_id), params=params, timeout=TIMEOUT
            )
        except requests.RequestException:
            if attempt == RETRIES:
                raise
            time.sleep(attempt)
            continue

        if response.status_code == 404:
            return None
        if response.status_code == 429 or response.status_code >= 500:
            if attempt == RETRIES:
                raise RuntimeError(f"HTTP {response.status_code}")
            time.sleep(attempt * 2)
            continue
        response.raise_for_status()

        data = response.json()
        release = data.get("release_date") or ""
        keywords = [
            item["name"].lower()
            for item in (data.get("keywords") or {}).get("keywords", [])
            if item.get("name")
        ]
        return {
            "genres": [genre["id"] for genre in data.get("genres", [])],
            "runtime": data.get("runtime") or 0,
            "vote_average": round(data.get("vote_average") or 0.0, 2),
            "vote_count": data.get("vote_count") or 0,
            "popularity": round(data.get("popularity") or 0.0, 2),
            "year": int(release[:4]) if release[:4].isdigit() else 0,
            "poster_path": data.get("poster_path") or "",
            "overview": (data.get("overview") or "")[:OVERVIEW_CHARS],
            "keywords": keywords,
            "adult": bool(data.get("adult")),
            "language": data.get("original_language") or "",
        }

    raise RuntimeError("retries exhausted")


def main():
    api_key = os.environ.get("TMDB_API_KEY", "").strip()
    if not api_key:
        print(
            "error: TMDB_API_KEY is not set.\n"
            "       run: TMDB_API_KEY=xxx python scripts/build_movie_meta.py",
            file=sys.stderr,
        )
        return 1
    if not MOVIES_PKL.exists():
        print(f"error: {MOVIES_PKL} not found", file=sys.stderr)
        return 1

    ids = load_ids()
    meta = load_existing()
    missing = [movie_id for movie_id in ids if str(movie_id) not in meta]
    print(f"{len(ids)} movies, {len(meta)} already fetched, {len(missing)} to go")

    fetched = 0
    failed = 0
    gone = 0

    with requests.Session() as session:
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            futures = {
                pool.submit(fetch_one, session, api_key, movie_id): movie_id
                for movie_id in missing
            }
            try:
                for done, future in enumerate(as_completed(futures), start=1):
                    movie_id = futures[future]
                    try:
                        result = future.result()
                    except Exception as error:
                        failed += 1
                        print(f"  {movie_id}: {error}", file=sys.stderr)
                        continue
                    if result is None:
                        # Remember the miss so a re-run stays instant.
                        meta[str(movie_id)] = None
                        gone += 1
                        continue
                    meta[str(movie_id)] = result
                    fetched += 1
                    if done % SAVE_EVERY == 0:
                        save(meta)
                        print(f"  ... {done}/{len(missing)}", flush=True)
            finally:
                save(meta)

    size_mb = OUTPUT.stat().st_size / (1024 * 1024)
    stored = sum(1 for value in meta.values() if value)
    print(
        f"fetched {fetched}, unavailable {gone}, failed {failed} - "
        f"{stored} movies in {OUTPUT.name} ({size_mb:.1f} MB)"
    )
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
