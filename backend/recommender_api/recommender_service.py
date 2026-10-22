"""Recommendation service for the recommender_api app.

Re-uses the single optimized implementation from the movies app so
both endpoints share one code path (positional indexing, precomputed
lookups, parallel poster fetching) and only ever one model is loaded.
"""
from movies.recommender import MovieRecommender

__all__ = ["MovieRecommender"]
