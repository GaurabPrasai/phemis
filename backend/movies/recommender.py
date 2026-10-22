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

            return [
                {"title": self._titles[p], "poster_url": poster}
                for p, poster in zip(positions, posters)
            ]
        except Exception as e:
            print(f"Error generating recommendations: {e}")
            return []
