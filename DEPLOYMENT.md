# Movie Recommender Deployment Guide

This guide will walk you through deploying your Movie Recommender application on Vercel.

## Prerequisites

- A Vercel account (https://vercel.com)
- A GitHub account with your repository pushed
- A Hugging Face account (where your models are stored)

## Step 1: Deploy Backend on Vercel

1. Go to [Vercel](https://vercel.com) and log in or sign up
2. Click "Add New" > "Project"
3. Connect your GitHub repository
4. Configure project:
   - Framework Preset: Other
   - Root Directory: `backend/`
5. Add Environment Variables (Settings > Environment Variables):
   - `HUGGINGFACE_TOKEN`: Create a token on HuggingFace [Settings > Access Tokens](https://huggingface.co/settings/tokens)
   - `SECRET_KEY`: A secure Django secret key (you can generate one at https://djecrety.ir/)
   - `DEBUG`: false
   - `TMDB_API_KEY`: Your TMDB API key (default is already set in settings)
   - `CORS_ALLOWED_ORIGINS`: The URL of your frontend app (once deployed)
6. Click "Deploy"

After deployment, make note of the URL - it will look like: `https://your-app-name-backend.vercel.app`

## Step 2: Deploy Frontend on Vercel

1. Go to [Vercel](https://vercel.com) again
2. Click "Add New" > "Project"
3. Connect your GitHub repository (same as before)
4. Configure project:
   - Framework Preset: Create React App
   - Root Directory: `frontend/`
5. Add Environment Variables:
   - `REACT_APP_API_URL`: The URL of your backend (from Step 1)
   - `REACT_APP_TMDB_API_KEY`: Your TMDB API key (same as backend)
6. Click "Deploy"

## Step 3: Update CORS Settings

After both applications are deployed:

1. Go to your backend project in Vercel
2. Navigate to Settings > Environment Variables
3. Update `CORS_ALLOWED_ORIGINS` with your actual frontend URL (e.g., `https://your-app-name.vercel.app`)
4. Click "Save"

## Troubleshooting

### Large File Issues

Your large model files (movies.pkl and similarity.pkl) are hosted on Hugging Face, so they shouldn't cause deployment issues.

### API Connection Issues

If your frontend can't connect to the backend:

- Check your CORS_ALLOWED_ORIGINS setting
- Verify your REACT_APP_API_URL is correctly set
- Check browser console for any errors

### Model Loading Issues

If the recommender doesn't work:

- Check backend logs in Vercel
- Verify your HUGGINGFACE_TOKEN is correctly set
- Make sure your Hugging Face repository is public or the token has access

## Continuous Deployment

Both your frontend and backend are now set up for continuous deployment. Any changes pushed to your GitHub repository will trigger automatic redeployment.

# Ignore large pickle files

_.pkl
recommender_api/_.pkl

# Ignore virtual environments

venv/
.venv/
**pycache**/
\*.pyc
