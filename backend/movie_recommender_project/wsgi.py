"""
WSGI config for movie_recommender_project project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'movie_recommender_project.settings')

application = get_wsgi_application()

# Azure: Azure App Service WSGI will call this application object directly.
# The Vercel handler below is no longer referenced by webapp, but is kept so
# any existing Vercel/vercel.json deployments continue to function.
def handler(request, **kwargs):
    return application(request, **kwargs)
