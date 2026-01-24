# Phemis: A Movie Recommendation System

Phemis is a machine learning-powered movie recommendation system designed to provide users with personalized movie suggestions based on their preferences. By utilizing advanced content-based filtering techniques and state-of-the-art tools, Phemis ensures precise and relevant recommendations through a seamless and interactive interface.

## System Architecture

### 1. Machine Learning Model

Phemis employs a **content-based filtering algorithm** that analyzes features such as genres, directors, actors, and plot summaries. Using **TF-IDF vectorization**, these features are transformed into numerical vectors, enabling precise similarity calculations via **cosine similarity**. This ensures the model identifies movies that closely match user preferences.

### 2. Web Application

The application is built using a modern tech stack:

- **Backend**: Django REST Framework API
- **Frontend**: React with Bootstrap
- **Data Processing**: Pandas and NumPy

### 3. Model Serialization

The trained machine learning model is serialized using **Pickle**, ensuring fast and efficient deployment. Large model files are managed using **Git LFS** for efficient version control.

## Features

1. **Real-Time Recommendations**: Delivers instant movie suggestions based on user input.
2. **Scalable Design**: Modular architecture facilitates easy updates and future enhancements.
3. **Responsive UI**: Modern interface that works on both desktop and mobile devices.
4. **Movie Posters**: Displays movie posters fetched from TMDB API.

## Installation Guide

### Prerequisites

- Python 3.9+ (recommended 3.10 or 3.11)
- Node.js 14+
- Git with Git LFS installed
- TMDB API key

### Git LFS Setup

The project uses Git LFS to manage large model files (`.pkl` files). Before cloning the repository, ensure Git LFS is installed:

1. **Install Git LFS**:
   - **Windows**: Download from [git-lfs.github.com](https://git-lfs.github.com) or use `winget install -e --id GitHub.GitLFS`
   - **Mac**: `brew install git-lfs`
   - **Linux**:
     ```bash
     sudo apt-get install git-lfs  # Debian/Ubuntu
     sudo yum install git-lfs      # CentOS/RHEL
     ```

2. **Initialize Git LFS**:

   ```bash
   git lfs install
   ```

3. **Clone the repository**:

   ```bash
   git clone https://github.com/gaurabprasai/phemis.git
   cd phemis
   ```

4. **Pull LFS files** (if not automatically pulled):

   ```bash
   git lfs pull
   ```

   This will download all `.pkl` model files tracked by Git LFS.

   > **If this command doesn't change your pkl pointers to binary files, [checkout here. ](./docs/LFS.md)**

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

6. Verify that the model files are present:

   ```bash
   ls -lh *.pkl  # Should show the actual file sizes, not small pointer files
   ```

7. Run the development server:
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

## Troubleshooting

### Git LFS Issues

If model files appear as small text files (pointer files) instead of actual binary files:

1. Ensure Git LFS is installed: `git lfs version`
2. Re-initialize LFS: `git lfs install`
3. Pull LFS objects: `git lfs pull`
4. Verify tracking: `git lfs ls-files`

### Model Loading Errors

If you encounter errors loading `.pkl` files, verify:

- Files were properly downloaded via Git LFS (check file size)
- Python version compatibility
- All dependencies are installed

## Future Roadmap

- **Enhanced Recommendation Algorithms**: Incorporate collaborative filtering for hybrid suggestions.
- **User Authentication**: Introduce user profiles for a personalized experience.
- **Expanded Data Sources**: Integrate user reviews and ratings to refine suggestions.

## Contribution

We welcome contributions! To get started:

- Fork the repository.
- Ensure Git LFS is installed before cloning.
- Create a feature branch.
- Submit a pull request with detailed documentation of changes.

## Contact

For questions, feedback, or collaboration opportunities:

- **Email**: Gaurabprasaigp@gmail.com
- **GitHub**: github.com/gaurabprasai

---

Phemis demonstrates the potential of combining machine learning with web technologies to solve real-world problems. Explore the project, and feel free to contribute or adapt it to your needs!
