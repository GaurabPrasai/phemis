import json
import os
import pickle
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote

import numpy as np
import pandas as pd
import requests
from django.conf import settings

from .moods import (
    COMPANY_ADJUST,
    ENERGY_ADJUST,
    FAMILY_ALLOWED,
    FAMILY_BLOCKED,
    GENRE_IDS,
    GENRES,
    MOODS,
)

# Single shared pool for fetching poster metadata in parallel.
# TMDB calls are network-bound, so 5 concurrent lookups turn a
# ~25s sequential waterfall into roughly one round-trip.
_POSTER_POOL = ThreadPoolExecutor(max_workers=6)

_SESSION = requests.Session()

# w342 is plenty for the ~210px-wide cards and roughly halves the
# bytes fetched compared to w500.
_TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342"


def _placeholder(text):
    """Inline SVG placeholder - no network request, never fails to load."""
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750">'
        '<rect width="100%" height="100%" fill="#1f2233"/>'
        '<text x="50%" y="50%" fill="#9aa0b5" font-size="34" '
        'font-family="sans-serif" text-anchor="middle" '
        'dominant-baseline="middle">'
        f"{quote(text)}</text></svg>"
    )
    return "data:image/svg+xml;charset=utf-8," + quote(svg, safe="")


class MovieRecommender:
    def __init__(self):
        self.movies = None
        self.similarity = None
        self._titles = None
        self._movie_ids = None
        self._sorted_titles = None
        self._title_to_pos = None
        self.load_models()
        self.load_meta()

    def load_models(self):
        """Load the movies DataFrame and similarity matrix.

        Local files first (they ship with the repo - no cold-start
        download), HuggingFace as a fallback if they are missing.
        """
        base_dir = Path(settings.BASE_DIR)
        local_movies = base_dir / "recommender_api" / "movies.pkl"
        local_similarity = base_dir / "recommender_api" / "similarity.pkl"

        movies_path = str(local_movies)
        similarity_path = str(local_similarity)

        if not (local_movies.exists() and local_similarity.exists()):
            try:
                import tempfile

                from huggingface_hub import hf_hub_download

                cache_dir = os.path.join(
                    tempfile.gettempdir(), "movie_recommender_models"
                )
                movies_path = hf_hub_download(
                    repo_id="GaurabPrasai/movie",
                    filename="movies.pkl",
                    cache_dir=cache_dir,
                )
                similarity_path = hf_hub_download(
                    repo_id="GaurabPrasai/movie",
                    filename="similarity.pkl",
                    cache_dir=cache_dir,
                )
            except Exception as e:
                print(f"Error downloading models from HuggingFace: {e}")

        try:
            with open(movies_path, "rb") as file:
                movies_list = pickle.load(file)

            if isinstance(movies_list, pd.DataFrame):
                self.movies = movies_list
            else:
                self.movies = pd.DataFrame(movies_list)

            # Labels in the stored index have gaps; everything below
            # works positionally, so normalize them to 0..n-1.
            self.movies = self.movies.reset_index(drop=True)

            with open(similarity_path, "rb") as file:
                similarity = pickle.load(file)

            # float32 halves the memory footprint (185MB -> 92MB) and
            # is far more precision than ranking similarities needs.
            self.similarity = np.ascontiguousarray(similarity, dtype=np.float32)

            self._prepare_lookups()
            return True
        except Exception as e:
            print(f"Error loading models: {e}")
            return False

    def _prepare_lookups(self):
        """Precompute the lookups used on every request, once."""
        self._titles = self.movies["title"].to_numpy()
        self._movie_ids = self.movies["movie_id"].to_numpy()
        # The movie list never changes at runtime: sort once instead
        # of on every /api/movies/ request.
        self._sorted_titles = sorted(self._titles.tolist())
        # First occurrence wins for duplicated titles (same behavior
        # the old pandas index[0] lookup had).
        self._title_to_pos = {}
        for pos, title in enumerate(self._titles):
            self._title_to_pos.setdefault(title, pos)

    def get_all_movies(self):
        """Return list of all movie titles sorted alphabetically"""
        if self._sorted_titles is None:
            return []
        return self._sorted_titles

    @lru_cache(maxsize=4096)
    def fetch_poster(self, movie_id):
        """Fetch movie poster from TMDB API (cached per process)"""
        api_key = settings.TMDB_API_KEY

        if not api_key:
            return _placeholder("No API Key")

        api_url = (
            f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={api_key}"
        )

        try:
            response = _SESSION.get(api_url, timeout=(2, 4))
            if response.status_code != 200:
                return _placeholder("No Poster")

            poster_path = response.json().get("poster_path")
            return (
                f"{_TMDB_IMAGE_BASE}{poster_path}"
                if poster_path
                else _placeholder("No Poster")
            )
        except Exception:
            return _placeholder("No Poster")

    def _poster_job(self, pos):
        """Fetch one poster (runs in the thread pool)."""
        try:
            return self.fetch_poster(self._movie_ids[pos])
        except Exception:
            return _placeholder("No Poster")

    # --- Mood data -------------------------------------------------------

    def load_meta(self):
        """Load movie_meta.json and build the arrays mood scoring needs.

        The arrays are positional, exactly like self.movies: column per
        genre, one entry per row. A movie without metadata is marked in
        ``_has_meta`` and never surfaces in mood results; the similar
        endpoint keeps working without metadata.
        """
        self.meta_ready = False
        self._genre_matrix = None
        self._has_meta = None
        self._meta_text = None
        self._overviews = None
        self._poster_paths = None
        self._adult = None

        if self.movies is None:
            return False

        path = Path(settings.BASE_DIR) / "recommender_api" / "movie_meta.json"
        try:
            with open(path, encoding="utf-8") as handle:
                raw = json.load(handle)
        except (OSError, ValueError) as error:
            print(f"Error loading {path.name}: {error}")
            return False

        count = len(self.movies)
        columns = {genre_id: index for index, genre_id in enumerate(GENRE_IDS)}
        self._genre_matrix = np.zeros((count, len(GENRE_IDS)), dtype=np.float32)
        self._rating = np.zeros(count, dtype=np.float32)
        self._votes = np.zeros(count, dtype=np.float32)
        self._runtime = np.zeros(count, dtype=np.int32)
        self._year = np.zeros(count, dtype=np.int32)
        self._has_meta = np.zeros(count, dtype=bool)
        self._adult = np.zeros(count, dtype=bool)
        self._poster_paths = [""] * count
        self._meta_text = [""] * count
        self._overviews = [""] * count

        for position, movie_id in enumerate(self._movie_ids):
            info = raw.get(str(int(movie_id)))
            if not info:
                continue

            self._has_meta[position] = True
            self._adult[position] = bool(info.get("adult"))
            for genre_id in info.get("genres") or []:
                column = columns.get(genre_id)
                if column is not None:
                    self._genre_matrix[position, column] = 1.0
            self._rating[position] = info.get("vote_average") or 0.0
            self._votes[position] = info.get("vote_count") or 0
            self._runtime[position] = info.get("runtime") or 0
            self._year[position] = info.get("year") or 0
            self._poster_paths[position] = info.get("poster_path") or ""
            self._overviews[position] = info.get("overview") or ""
            self._meta_text[position] = (
                " ".join(info.get("keywords") or [])
                + " "
                + (info.get("overview") or "").lower()
            )

        self.meta_ready = True
        return True

    def _meta_item(self, position):
        """Extra fields for a result item, or {} when meta is missing."""
        if not self.meta_ready or not self._has_meta[position]:
            return {}
        poster_path = self._poster_paths[position]
        return {
            "movie_id": int(self._movie_ids[position]),
            "year": int(self._year[position]),
            "rating": round(float(self._rating[position]), 1),
            "runtime": int(self._runtime[position]),
            "genres": self._genres_at(position),
            "overview": self._overview_at(position),
            "poster_url": (
                f"{_TMDB_IMAGE_BASE}{poster_path}"
                if poster_path
                else _placeholder("No Poster")
            ),
        }

    def _genres_at(self, position):
        return [
            GENRES[GENRE_IDS[column]]
            for column in np.flatnonzero(self._genre_matrix[position])
        ]

    def _overview_at(self, position):
        return self._overviews[position]

    def recommend_by_mood(
        self,
        mood,
        energy="balanced",
        company="alone",
        max_runtime=None,
        seed_movie=None,
        exclude=(),
        limit=10,
    ):
        """Rank the catalog for a mood profile. See docs in moods.py."""
        profile = MOODS.get(mood)
        if profile is None or not self.meta_ready:
            return []

        columns = {genre_id: index for index, genre_id in enumerate(GENRE_IDS)}
        weights = np.zeros(len(GENRE_IDS), dtype=np.float32)
        for genre_id, weight in profile["genres"].items():
            weights[columns[genre_id]] = weight
        for genre_id, delta in ENERGY_ADJUST.get(
            energy, ENERGY_ADJUST["balanced"]
        ).items():
            weights[columns[genre_id]] += delta
        for genre_id, delta in COMPANY_ADJUST.get(
            company, COMPANY_ADJUST["alone"]
        ).items():
            weights[columns[genre_id]] += delta

        genre_score = np.clip(
            self._genre_matrix @ weights / max(float(weights.sum()), 1e-6), 0.0, 1.0
        )

        avoid = [columns[genre_id] for genre_id in profile["avoid"]]
        avoid_penalty = 0.5 * (
            self._genre_matrix[:, avoid].sum(axis=1) > 0
        ).astype(np.float32)

        hits = np.zeros(len(self.movies), dtype=np.float32)
        for keyword in profile["keywords"]:
            hits += np.fromiter(
                (keyword in text for text in self._meta_text), bool, len(self.movies)
            )
        keyword_score = np.minimum(1.0, hits / 2.0)

        votes = self._votes
        quality = (
            (votes / (votes + 300.0)) * self._rating
            + (300.0 / (votes + 300.0)) * 6.0
        ) / 10.0

        score = (
            0.55 * genre_score
            + 0.15 * keyword_score
            + 0.30 * quality
            - avoid_penalty
        ).astype(np.float32)

        blocked = ~self._has_meta | (self._votes < 100)
        if max_runtime:
            blocked |= (self._runtime > int(max_runtime)) & (self._runtime > 0)
        if company == "family":
            allowed_columns = [columns[g] for g in FAMILY_ALLOWED]
            blocked_columns = [columns[g] for g in FAMILY_BLOCKED]
            allowed = self._genre_matrix[:, allowed_columns].sum(axis=1) > 0
            blocked |= ~allowed | self._adult
            blocked |= self._genre_matrix[:, blocked_columns].sum(axis=1) > 0
        if exclude:
            excluded = {str(title) for title in exclude}
            blocked |= np.fromiter(
                (title in excluded for title in self._titles), bool, len(self.movies)
            )

        seed_position = None
        if seed_movie:
            seed_position = self._title_to_pos.get(seed_movie)

        score[blocked] = -np.inf
        if seed_position is not None:
            score[seed_position] = -np.inf
            similarity = self.similarity[seed_position].astype(np.float32)
            spread = float(similarity.max() - similarity.min())
            if spread > 1e-6:
                similarity = (similarity - similarity.min()) / spread
            else:
                similarity = np.zeros_like(similarity)
            score = np.where(np.isfinite(score), 0.65 * score + 0.35 * similarity, score)

        candidates = np.argsort(-score, kind="stable")[:30]
        candidates = candidates[np.isfinite(score[candidates])]
        if len(candidates) == 0:
            return []

        take = min(int(limit), len(candidates))
        weights_pick = score[candidates] - score[candidates].min() + 1e-3
        picked = np.random.default_rng().choice(
            candidates,
            size=take,
            replace=False,
            p=weights_pick / weights_pick.sum(),
        )
        picked = picked[np.argsort(-score[picked], kind="stable")]

        return [
            self._mood_item(position, profile, weights) for position in picked.tolist()
        ]

    def _mood_item(self, position, profile, weights):
        item = {"title": str(self._titles[position])}
        item.update(self._meta_item(position))

        row = self._genre_matrix[position]
        ranked = np.argsort(-(row * weights), kind="stable")
        top = [GENRES[GENRE_IDS[c]] for c in ranked[:2] if row[c] > 0]
        if not top:
            top = self._genres_at(position)[:2]
        genre_text = " & ".join(top)
        item["why"] = (
            f"Matches your {profile['label']} mood: "
            f"{genre_text or 'a strong fit'}, rated {item.get('rating', 0):.1f}"
        )
        return item

    def recommend_movies(self, movie_title):
        """Generate movie recommendations based on input movie title"""
        try:
            if self.movies is None or self.similarity is None:
                return []

            pos = self._title_to_pos.get(movie_title) if movie_title else None
            if pos is None:
                return []

            # The matrix is positional: rank the whole row at once
            # instead of building/sorting a Python list of tuples.
            row = self.similarity[pos]
            order = np.argsort(-row, kind="stable")[1:6]

            positions = [int(p) for p in order]
            # Posters for all 5 recommendations in parallel.
            posters = list(_POSTER_POOL.map(self._poster_job, positions))

            items = []
            for p, poster in zip(positions, posters):
                item = {"title": self._titles[p], "poster_url": poster}
                meta = self._meta_item(p)
                if meta:
                    item.update(meta)
                items.append(item)
            return items
        except Exception as e:
            print(f"Error generating recommendations: {e}")
            return []
