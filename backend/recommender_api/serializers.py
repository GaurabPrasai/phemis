from rest_framework import serializers
from .models import Movie

class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = ['id', 'title', 'movie_id']

class RecommendationRequestSerializer(serializers.Serializer):
    movie_title = serializers.CharField(max_length=255)

class MovieRecommendationSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    poster_url = serializers.URLField(allow_blank=True) 