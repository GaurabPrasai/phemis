from django.urls import path
from . import views

urlpatterns = [
    path('movies/', views.get_all_movies, name='get_all_movies'),
    path('recommend/', views.get_recommendations, name='get_recommendations'),
] 