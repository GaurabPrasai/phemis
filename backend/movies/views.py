import os

from django.conf import settings
from django.http import FileResponse, HttpResponse
from django.views.decorators.cache import never_cache
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .moods import MOODS
from .recommender import MovieRecommender

# Create a singleton instance of MovieRecommender
recommender = MovieRecommender()


@api_view(["GET"])
def health_check(request):
    """API health check endpoint - also used by start.sh and Azure."""
    ready = recommender.movies is not None and recommender.similarity is not None
    return Response(
        {"status": "ok" if ready else "models_not_loaded", "ready": ready},
        status=status.HTTP_200_OK if ready else status.HTTP_503_SERVICE_UNAVAILABLE,
    )


@api_view(["GET"])
def get_all_movies(request):
    """Get list of all available movies"""
    movies = recommender.get_all_movies()
    return Response(movies, status=status.HTTP_200_OK)


@api_view(["POST"])
def get_recommendations(request):
    """Get movie recommendations based on selected movie"""
    movie_title = request.data.get("movie_title")
    if not movie_title:
        return Response(
            {"error": "movie_title is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    recommendations = recommender.recommend_movies(movie_title)
    if not recommendations:
        return Response(
            {"error": f"Could not generate recommendations for '{movie_title}'"},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(recommendations)


@api_view(["GET"])
def get_moods(request):
    """List the mood tiles shown on the home screen."""
    return Response(
        [
            {
                "slug": slug,
                "label": mood["label"],
                "emoji": mood["emoji"],
                "blurb": mood["blurb"],
            }
            for slug, mood in MOODS.items()
        ]
    )


@api_view(["POST"])
def get_mood_recommendations(request):
    """Recommend movies for a mood, with optional refinements."""
    mood = request.data.get("mood")
    if not mood or mood not in MOODS:
        return Response(
            {"error": f"Unknown mood '{mood}'. Try one of: {', '.join(MOODS)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not recommender.meta_ready:
        return Response(
            {"error": "Mood data is not available on this server yet."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    try:
        limit = int(request.data.get("limit", 10))
    except (TypeError, ValueError):
        limit = 10
    limit = max(1, min(20, limit))

    max_runtime = request.data.get("max_runtime")
    try:
        max_runtime = int(max_runtime) if max_runtime else None
    except (TypeError, ValueError):
        max_runtime = None

    exclude = request.data.get("exclude") or []
    if not isinstance(exclude, list):
        exclude = []

    recommendations = recommender.recommend_by_mood(
        mood,
        energy=request.data.get("energy") or "balanced",
        company=request.data.get("company") or "alone",
        max_runtime=max_runtime,
        seed_movie=request.data.get("seed_movie") or None,
        exclude=[str(title) for title in exclude],
        limit=limit,
    )

    if not recommendations:
        return Response(
            {"error": "No movies matched that mood. Try relaxing the filters."},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(recommendations)


# --- Single-origin serving of the production React build ---------------
# The deployment script drops the built React app into
# staticfiles_public/ next to manage.py, so Django can serve the SPA
# and its assets from the very same host as the API.
REACT_BUILD_DIR = os.path.join(str(settings.BASE_DIR), "staticfiles_public")


def _react_build_file(path):
    """Resolve a request path to a file inside the React build.

    Returns None when the path escapes the build directory or points at
    something that is not a regular file.
    """
    relative = path.lstrip("/")
    if not relative:
        return None

    root = os.path.realpath(REACT_BUILD_DIR)
    candidate = os.path.realpath(os.path.join(root, relative))
    if candidate != root and not candidate.startswith(root + os.sep):
        return None
    if not os.path.isfile(candidate):
        return None
    return candidate


@never_cache
def serve_react_app(request):
    """Serve the built React app, falling back to index.html for routes.

    Any request that is not an API call and not a real file in the
    build returns index.html, so client-side routing keeps working.
    A path that clearly points at a file (it has an extension) is a
    404 instead, so a missing asset never gets HTML back.
    """
    target = _react_build_file(request.path)

    if target is None:
        last_segment = request.path.rstrip("/").rsplit("/", 1)[-1]
        if "." in last_segment:
            return HttpResponse("Not found", status=404)
        target = os.path.join(REACT_BUILD_DIR, "index.html")

    if not os.path.isfile(target):
        return HttpResponse(
            "Frontend build not found. Run 'npm run build' in frontend/ "
            "and copy the output to backend/staticfiles_public/.",
            status=404,
        )

    return FileResponse(open(target, "rb"))

