import pickle
import os
import pandas as pd
import requests
from functools import lru_cache
from django.conf import settings
from pathlib import Path

class MovieRecommender:
    def __init__(self):
        self.movies = None
        self.similarity = None
        self.load_models()
    
    def load_models(self):
        """Load the movies DataFrame and similarity matrix"""
        try:
            # Get the current directory path
            base_dir = Path(__file__).resolve().parent
            
            # Load movies data
            with open(os.path.join(base_dir, 'movies.pkl'), 'rb') as file:
                movies_list = pickle.load(file)
                
            if isinstance(movies_list, pd.DataFrame):
                self.movies = movies_list
            else:
                self.movies = pd.DataFrame(movies_list)
                
            # Load similarity matrix
            with open(os.path.join(base_dir, 'similarity.pkl'), 'rb') as file:
                self.similarity = pickle.load(file)
                
            return True
        except Exception as e:
            print(f"Error loading models: {str(e)}")
            return False
    
    def get_all_movies(self):
        """Return list of all movies titles sorted alphabetically"""
        if self.movies is not None:
            return self.movies['title'].sort_values().tolist()
        return []
    
    @lru_cache(maxsize=1000)
    def fetch_poster(self, movie_id):
        """Fetch movie poster from TMDB API"""
        api_key = settings.TMDB_API_KEY
        
        if not api_key:
            return "https://via.placeholder.com/500x750.png?text=No+API+Key"
        
        base_url = "https://image.tmdb.org/t/p/w500"
        api_url = f'https://api.themoviedb.org/3/movie/{movie_id}?api_key={api_key}'
        
        try:
            response = requests.get(api_url, timeout=5)
            if response.status_code != 200:
                return "https://via.placeholder.com/500x750.png?text=API+Error"
            
            data = response.json()
            poster_path = data.get('poster_path')
            return f"{base_url}{poster_path}" if poster_path else "https://via.placeholder.com/500x750.png?text=No+Poster"
        except Exception as e:
            print(f"Error fetching poster: {str(e)}")
            return "https://via.placeholder.com/500x750.png?text=Error"
    
    def recommend_movies(self, movie_title):
        """Generate movie recommendations based on input movie title"""
        try:
            if self.movies is None or self.similarity is None:
                return []
                
            if movie_title not in self.movies['title'].values:
                return []
                
            movie_index = self.movies[self.movies['title'] == movie_title].index[0]
            distances = self.similarity[movie_index]
            movies_list = sorted(list(enumerate(distances)), reverse=True, key=lambda x: x[1])[1:6]
            
            recommendations = []
            for i in movies_list:
                movie_id = self.movies.iloc[i[0]].movie_id
                title = self.movies.iloc[i[0]].title
                poster_url = self.fetch_poster(movie_id)
                recommendations.append({
                    'title': title,
                    'poster_url': poster_url
                })
            
            return recommendations
        except Exception as e:
            print(f"Error generating recommendations: {str(e)}")
            return [] 