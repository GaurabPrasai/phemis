import React, { useState, useEffect, useRef } from 'react';
import axios from './axiosConfig';
import './App.css';

function App() {
    const [movies, setMovies] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const dropdownRef = useRef(null);

    // Fetch all movies when component mounts
    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const response = await axios.get('/api/movies/');
                setMovies(response.data);
            } catch (err) {
                console.error('Error fetching movies:', err);
                setError('Failed to load movies. Please try again later.');
            }
        };

        fetchMovies();
    }, []);

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter movies based on search term
    const filteredMovies = movies.filter(movie =>
        movie.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle movie selection
    const handleMovieSelect = (movie) => {
        setSelectedMovie(movie);
        setSearchTerm(movie);
        setIsDropdownOpen(false);
        setError(null);
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setIsDropdownOpen(true);
        if (!e.target.value) {
            setSelectedMovie('');
        }
    };

    // Get recommendations
    const getRecommendations = async () => {
        if (!selectedMovie) return;

        setLoading(true);
        setError(null);
        setRecommendations([]);

        try {
            const response = await axios.post('/api/recommend/', {
                movie_title: selectedMovie
            });
            setRecommendations(response.data);
        } catch (err) {
            console.error('Error getting recommendations:', err);
            setError(err.response?.data?.error || 'Failed to get recommendations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="content">
                    <h1>🎬 Movie Recommender</h1>
                    <p>Discover your next favorite movie based on your current favorites</p>
                </div>
            </header>

            <main className="container">
                <div className="row justify-content-center mb-5">
                    <div className="col-md-8 col-lg-6">
                        <div className="selection-card">
                            <div className="card-body p-4">
                                <div className="mb-4">
                                    <label htmlFor="movieSearch" className="form-label h6 mb-3">
                                        Search and select a movie you love:
                                    </label>
                                    <div className="search-select-container" ref={dropdownRef}>
                                        <input
                                            type="text"
                                            id="movieSearch"
                                            className="form-control movie-search-input"
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            onClick={() => setIsDropdownOpen(true)}
                                            placeholder="Type to search movies..."
                                            autoComplete="off"
                                        />
                                        {isDropdownOpen && searchTerm && (
                                            <div className="movie-suggestions">
                                                {filteredMovies.length > 0 ? (
                                                    filteredMovies.slice(0, 8).map((movie, index) => (
                                                        <div
                                                            key={index}
                                                            className={`suggestion-item ${movie === selectedMovie ? 'selected' : ''}`}
                                                            onClick={() => handleMovieSelect(movie)}
                                                        >
                                                            {movie}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="suggestion-item no-results">
                                                        No movies found
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    className="btn recommend-btn w-100"
                                    onClick={getRecommendations}
                                    disabled={!selectedMovie || loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="loading-spinner"></span>
                                            Finding Similar Movies...
                                        </>
                                    ) : (
                                        'Get Recommendations'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="row justify-content-center mb-4">
                        <div className="col-md-8 col-lg-6">
                            <div className="error-alert" role="alert">
                                {error}
                            </div>
                        </div>
                    </div>
                )}

                {recommendations.length > 0 && (
                    <div className="recommendations-section">
                        <h2 className="text-center mb-4">
                            Movies Similar to "{selectedMovie}"
                        </h2>
                        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5 g-4">
                            {recommendations.map((movie, index) => (
                                <div key={index} className="col">
                                    <div className="movie-card h-100">
                                        <img
                                            src={movie.poster_url}
                                            className="card-img-top"
                                            alt={movie.title}
                                            loading="lazy"
                                        />
                                        <div className="card-body">
                                            <h5 className="card-title text-center">{movie.title}</h5>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <footer className="app-footer">
                <div className="container text-center">
                    <p>Made with ❤️ by Gaurab Prasai</p>
                </div>
            </footer>
        </div>
    );
}

export default App; 
