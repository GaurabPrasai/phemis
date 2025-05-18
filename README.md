# Fikson: A Movie Recommendation System

Fikson is a machine learning-powered movie recommendation system designed to provide users with personalized movie suggestions based on their preferences. By utilizing advanced content-based filtering techniques and state-of-the-art tools, Fikson ensures precise and relevant recommendations through a seamless and interactive interface.

## System Architecture

### 1. Machine Learning Model

Fikson employs a **content-based filtering algorithm** that analyzes features such as genres, directors, actors, and plot summaries. Using **TF-IDF vectorization**, these features are transformed into numerical vectors, enabling precise similarity calculations via **cosine similarity**. This ensures the model identifies movies that closely match user preferences.

### 2. Web Application

The application is built using a modern tech stack:

- **Backend**: Django REST Framework API
- **Frontend**: React with Bootstrap
- **Data Processing**: Pandas and NumPy

### 3. Model Serialization

The trained machine learning model is serialized using **Pickle**, ensuring fast and efficient deployment.

## Features

1. **Real-Time Recommendations**: Delivers instant movie suggestions based on user input.
2. **Scalable Design**: Modular architecture facilitates easy updates and future enhancements.
3. **Responsive UI**: Modern interface that works on both desktop and mobile devices.
4. **Movie Posters**: Displays movie posters fetched from TMDB API.

## Installation Guide

### Prerequisites

- Python 3.8+
- Node.js 14+
- TMDB API key

### Backend Setup

1. Navigate to the Django backend directory:
   ```bash
   cd django_backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv env
   ```
3. Activate the virtual environment:
   - Windows: `.\env\Scripts\activate`
   - Linux/Mac: `source env/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Create a `.env` file with your TMDB API key:
   ```
   API_KEY=your_tmdb_api_key_here
   ```
6. Run the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the React frontend directory:
   ```bash
   cd react_frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## API Endpoints

- `GET /api/health/`: Health check endpoint
- `GET /api/movies/`: Get list of all available movies
- `POST /api/recommend/`: Get movie recommendations

## Future Roadmap

- **Enhanced Recommendation Algorithms**: Incorporate collaborative filtering for hybrid suggestions.
- **User Authentication**: Introduce user profiles for a personalized experience.
- **Expanded Data Sources**: Integrate user reviews and ratings to refine suggestions.

## Contribution

We welcome contributions! To get started:

- Fork the repository.
- Create a feature branch.
- Submit a pull request with detailed documentation of changes.

## Contact

For questions, feedback, or collaboration opportunities:

- **Email**: Gaurabprasaigp@gmail.com
- **GitHub**: github.com/gaurabprasai

---

Fikson demonstrates the potential of combining machine learning with web technologies to solve real-world problems. Explore the project, and feel free to contribute or adapt it to your needs!
