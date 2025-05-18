from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .recommender_service import MovieRecommender
from .serializers import RecommendationRequestSerializer, MovieRecommendationSerializer

# Create a singleton recommender instance
recommender = MovieRecommender()

@api_view(['GET'])
def health_check(request):
    """API health check endpoint"""
    return Response({"status": "ok"}, status=status.HTTP_200_OK)

@api_view(['GET'])
def movie_list(request):
    """Get list of all available movies"""
    movies = recommender.get_all_movies()
    return Response(movies, status=status.HTTP_200_OK)

@api_view(['POST'])
def recommend_movies(request):
    """Get movie recommendations based on selected movie"""
    serializer = RecommendationRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    movie_title = serializer.validated_data['movie_title']
    recommendations = recommender.recommend_movies(movie_title)
    
    if not recommendations:
        return Response(
            {"error": f"Could not generate recommendations for '{movie_title}'"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    results_serializer = MovieRecommendationSerializer(recommendations, many=True)
    return Response(results_serializer.data, status=status.HTTP_200_OK)
