"""Mood profiles for the "how are you feeling" recommender.

Data only: no imports, no scoring. The weighting happens in
``movies.recommender.recommend_by_mood``.
"""

# TMDB genre ids (the 18 genres present in the catalog).
GENRES = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    53: "Thriller",
    10752: "War",
    37: "Western",
}

# Order used everywhere for the genre weight vectors.
GENRE_IDS = list(GENRES)

MOODS = {
    "laugh": {
        "label": "Make me laugh",
        "emoji": "😂",
        "blurb": "Light, funny, zero stress",
        "genres": {35: 1.0, 10751: 0.3, 16: 0.3},
        "avoid": [27, 10752, 99],
        "keywords": ["parody", "satire", "hilarious", "buddy", "prank"],
    },
    "feelgood": {
        "label": "Cozy & feel-good",
        "emoji": "🥰",
        "blurb": "Warm, easy, comforting",
        "genres": {35: 0.6, 10751: 0.8, 16: 0.8, 10402: 0.7, 10749: 0.5},
        "avoid": [27, 10752, 53, 80],
        "keywords": [
            "friendship",
            "family",
            "holiday",
            "heartwarming",
            "underdog",
        ],
    },
    "cry": {
        "label": "Need a good cry",
        "emoji": "😭",
        "blurb": "Emotional and moving",
        "genres": {18: 1.0, 10749: 0.6, 10752: 0.4, 36: 0.3},
        "avoid": [27, 35],
        "keywords": [
            "death",
            "loss",
            "grief",
            "sacrifice",
            "terminal illness",
            "separation",
        ],
    },
    "romantic": {
        "label": "Romantic",
        "emoji": "💘",
        "blurb": "Love stories and date nights",
        "genres": {10749: 1.0, 35: 0.5, 18: 0.5, 10402: 0.3},
        "avoid": [27, 10752, 80],
        "keywords": [
            "love",
            "wedding",
            "couple",
            "relationship",
            "first love",
        ],
    },
    "hyped": {
        "label": "Pumped & hyped",
        "emoji": "🔥",
        "blurb": "Fast, loud, high energy",
        "genres": {28: 1.0, 12: 0.8, 878: 0.5, 53: 0.5, 80: 0.4},
        "avoid": [99, 10749, 10751],
        "keywords": [
            "chase",
            "heist",
            "battle",
            "explosion",
            "martial arts",
            "superhero",
        ],
    },
    "spooky": {
        "label": "Spooky & tense",
        "emoji": "👻",
        "blurb": "Scares and suspense",
        "genres": {27: 1.0, 53: 0.7, 9648: 0.5},
        "avoid": [10751, 16, 35, 10402],
        "keywords": [
            "haunted",
            "ghost",
            "serial killer",
            "supernatural",
            "monster",
            "slasher",
        ],
    },
    "mindbend": {
        "label": "Mind-bending",
        "emoji": "🤯",
        "blurb": "Twists you will think about later",
        "genres": {878: 0.9, 9648: 0.8, 53: 0.6, 14: 0.3},
        "avoid": [10751, 10749],
        "keywords": [
            "dream",
            "time travel",
            "parallel world",
            "twist",
            "artificial intelligence",
            "alternate reality",
        ],
    },
    "adventure": {
        "label": "Escape & adventure",
        "emoji": "🧭",
        "blurb": "Big worlds, journeys, quests",
        "genres": {12: 1.0, 14: 0.9, 878: 0.5, 16: 0.3, 37: 0.3},
        "avoid": [99, 80],
        "keywords": [
            "journey",
            "quest",
            "treasure",
            "island",
            "space",
            "expedition",
        ],
    },
    "inspired": {
        "label": "Inspired & thoughtful",
        "emoji": "🌟",
        "blurb": "True stories and big ideas",
        "genres": {18: 0.8, 36: 0.8, 99: 0.7, 10402: 0.3},
        "avoid": [27],
        "keywords": [
            "based on true story",
            "biography",
            "true story",
            "overcome",
            "genius",
        ],
    },
}

ENERGY_ADJUST = {
    "chill": {
        18: 0.3,
        35: 0.3,
        10749: 0.3,
        16: 0.3,
        10751: 0.3,
        99: 0.3,
        28: -0.4,
        27: -0.4,
        53: -0.4,
        10752: -0.4,
    },
    "balanced": {},
    "intense": {
        28: 0.4,
        53: 0.4,
        27: 0.4,
        80: 0.4,
        10752: 0.4,
        878: 0.4,
        10751: -0.3,
        16: -0.3,
        10749: -0.3,
        10402: -0.3,
    },
}

COMPANY_ADJUST = {
    "alone": {},
    "friends": {},
    "partner": {10749: 0.2, 35: 0.2},
    "family": {},
}

# Watching with family is a hard filter, not a weight.
FAMILY_ALLOWED = {10751, 16}
FAMILY_BLOCKED = {27, 53, 80, 10752}
