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
    # CharField (not URLField) so inline data-URI placeholders are valid
    poster_url = serializers.CharField(allow_blank=True, required=False) 