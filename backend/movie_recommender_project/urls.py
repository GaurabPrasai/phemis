"""
URL configuration for movie_recommender_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path

from movies.views import serve_react_app

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('movies.urls')),
    # Everything else is the React single-page app. This route also
    # picks up /static/ requests that WhiteNoise did not find in
    # STATIC_ROOT, so the hashed React assets in the build resolve.
    re_path(r'^(?!api/).*$', serve_react_app, name='react_app'),
]
