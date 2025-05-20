# Frontend Deployment Guide

## GitHub Pages Deployment

This guide will help you deploy your React frontend to GitHub Pages and connect it to your backend API.

### Configuration Files

1. **Environment Variables (.env)**

   - The `.env` file contains environment variables used during development
   - Make sure it has the correct API URL pointing to your deployed backend:

   ```
   REACT_APP_API_URL=https://phemis.vercel.app
   REACT_APP_TMDB_API_KEY=420b8821330cec3f214163c75423281c
   ```

2. **Vercel Configuration (vercel.json)**

   - The `vercel.json` file configures the Vercel deployment
   - Ensure the API URL matches your deployed backend:

   ```json
   "build": {
       "env": {
           "REACT_APP_API_URL": "https://phemis.vercel.app"
       }
   }
   ```

3. **Package.json**
   - The `homepage` field must match your GitHub Pages URL
   - Current setting: `"homepage": "https://gaurabprasai.github.io/phemis/"`

### Deployment Steps

1. **Build and Deploy**
   ```bash
   npm run deploy
   ```
   This will run the predeploy script (which builds the app) and then deploy to GitHub Pages.

### Troubleshooting

#### "Failed to load movies" Error

If you see this error on your deployed site:

1. **Check Network Requests**: Open browser developer tools and look at the network requests

   - Are API requests going to the correct URL?
   - Are there any CORS errors?

2. **CORS Issues**: If you see CORS errors, make sure your backend allows requests from your GitHub Pages domain

   - Your backend should include `https://gaurabprasai.github.io` in its CORS allowed origins

3. **API URL**: Verify that the app is using the correct API URL

   - The app should be using `https://phemis.vercel.app` as the base URL for API requests
   - This is configured in `src/config.js` and should be picking up the environment variable

4. **Environment Variables**: GitHub Pages doesn't process `.env` files
   - The environment variables are baked into the build during the build process
   - Make sure to run `npm run build` after updating the `.env` file

### Testing Locally

To test the production build locally before deploying:

```bash
npm run build
npx serve -s build
```

This will create a production build and serve it locally, simulating how it will behave when deployed.
