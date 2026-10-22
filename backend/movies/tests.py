import unittest

from django.test import TestCase
from rest_framework.test import APIClient

from .moods import MOODS
from .views import recommender


class MoodEndpointTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        if not recommender.meta_ready:
            raise unittest.SkipTest("movie_meta.json is missing")
        cls.client = APIClient()

    def mood(self, **body):
        response = self.client.post(
            "/api/recommend/mood/", body, content_type="application/json"
        )
        self.assertEqual(response.status_code, 200, response.content[:200])
        return response.json()

    def test_every_mood_returns_ten_results(self):
        for slug in MOODS:
            with self.subTest(mood=slug):
                results = self.mood(mood=slug)
                self.assertEqual(len(results), 10)
                for item in results:
                    for key in (
                        "movie_id",
                        "title",
                        "poster_url",
                        "year",
                        "rating",
                        "runtime",
                        "genres",
                        "overview",
                        "why",
                    ):
                        self.assertIn(key, item)

    def test_family_never_gets_horror(self):
        for _ in range(3):
            for item in self.mood(mood="spooky", company="family"):
                self.assertNotIn("Horror", item["genres"])
                self.assertNotIn("Thriller", item["genres"])

    def test_max_runtime_is_respected(self):
        for item in self.mood(mood="cry", max_runtime=100):
            self.assertLessEqual(item["runtime"], 100)

    def test_exclude_removes_titles(self):
        first = self.mood(mood="laugh")
        again = self.mood(mood="laugh", exclude=[item["title"] for item in first])
        self.assertFalse(
            {item["title"] for item in first} & {item["title"] for item in again}
        )

    def test_spooky_is_horror_heavy(self):
        results = self.mood(mood="spooky")
        scary = sum(
            1 for item in results if {"Horror", "Thriller"} & set(item["genres"])
        )
        self.assertGreaterEqual(scary, 6)

    def test_unknown_mood_is_rejected(self):
        response = self.client.post(
            "/api/recommend/mood/",
            {"mood": "confused"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

    def test_moods_list(self):
        response = self.client.get("/api/moods/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["slug"] for item in response.json()], list(MOODS))

    def test_similar_endpoint_still_works(self):
        response = self.client.post(
            "/api/recommend/",
            {"movie_title": "Avatar"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        results = response.json()
        self.assertEqual(len(results), 5)
        for item in results:
            self.assertIn("title", item)
            self.assertIn("poster_url", item)
