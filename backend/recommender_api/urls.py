from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('movies/', views.movie_list, name='movie_list'),
    path('recommend/', views.recommend_movies, name='recommend_movies'),
] 