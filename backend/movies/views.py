from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .recommender import MovieRecommender

# Create a singleton instance of MovieRecommender
recommender = MovieRecommender()

@api_view(['GET'])
def get_all_movies(request):
    """Get list of all available movies"""
    movies = recommender.get_all_movies()
    return Response(movies)

@api_view(['POST'])
def get_recommendations(request):
    """Get movie recommendations based on selected movie"""
    movie_title = request.data.get('movie_title')
    if not movie_title:
        return Response(
            {"error": "movie_title is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    recommendations = recommender.recommend_movies(movie_title)
    if not recommendations:
        return Response(
            {"error": f"Could not generate recommendations for '{movie_title}'"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response(recommendations) 