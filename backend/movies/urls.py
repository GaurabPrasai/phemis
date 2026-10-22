from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('movies/', views.get_all_movies, name='get_all_movies'),
    path('recommend/', views.get_recommendations, name='get_recommendations'),
]
