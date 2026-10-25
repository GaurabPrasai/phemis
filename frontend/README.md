# Movie Recommender React Frontend

This is the frontend for Phemis, a mood-led movie recommender built with React and plain CSS.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will be available at http://localhost:3000.

## Features

- Nine colour-coded mood tiles that open recommendations straight away
- Refine chips for energy, company and runtime, kept in the URL
- Similar-movie search with a keyboard-friendly combobox
- Film details dialog with synopsis and a saved watchlist
- Responsive layouts, accessible controls and reduced-motion support

## API Integration

The frontend communicates with the Django backend API. Make sure the backend is running on port 8000 before starting the frontend. 