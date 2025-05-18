# Movie Recommender Django Backend

This is the backend API for the Movie Recommender System. It uses Django and Django REST Framework to provide recommendation functionality.

## Setup

1. Create a virtual environment:

```bash
python -m venv env
```

2. Activate the virtual environment:

- Windows:

```
.\env\Scripts\activate
```

- Linux/Mac:

```
source env/bin/activate
```

3. Install dependencies:

```
pip install -r requirements.txt
```

4. Setup environment variables:
   Create a `.env` file in the project root and add:

```
API_KEY=your_tmdb_api_key_here
```

5. Run the development server:

```
python manage.py runserver
```

## API Endpoints

- `GET /api/health/`: Health check endpoint
- `GET /api/movies/`: Get list of all available movies
- `POST /api/recommend/`: Get movie recommendations

  Request body:

  ```json
  {
    "movie_title": "Movie Title"
  }
  ```
