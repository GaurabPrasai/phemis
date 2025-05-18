# Movie Recommender Backend

This is the backend service for the Movie Recommender project, built with Django REST framework.

## Vercel Deployment Notes

### Handling Large Pickle Files

This project uses large machine learning model files (`.pkl` files) which exceed Vercel's serverless function size limits. To handle this:

1. The large model files are hosted on HuggingFace: https://huggingface.co/GaurabPrasai/movie
2. We exclude these files from being uploaded to Vercel using:
   - A `.vercelignore` file that excludes all `.pkl` files
   - The `functions` property in `vercel.json` that explicitly excludes PKL files

### Runtime Model Loading

During runtime, the application:

1. Downloads models from HuggingFace using the `huggingface_hub` package
2. Stores them in a temporary cache directory
3. Falls back to local files only if HuggingFace download fails

## Environment Variables

Make sure to set these environment variables in your Vercel project:

- `SECRET_KEY`: Django secret key
- `DEBUG`: Set to "False" for production
- `TMDB_API_KEY`: Your TMDB API key for movie posters
- `HUGGINGFACE_TOKEN`: Your HuggingFace token if the repository is private

## API Endpoints

- `/api/movies/`: Get a list of all movie titles
- `/api/recommend/`: Get movie recommendations based on a given movie title
