import axios from "axios";
import config from "./config";

const client = axios.create({ baseURL: config.apiUrl, timeout: 30000 });

export async function getMovies() {
  const { data } = await client.get("api/movies/");
  if (Array.isArray(data)) return data;
  // Tolerate the legacy double-encoded {movies: "[...]"} shape.
  try {
    return JSON.parse(data.movies ?? "[]");
  } catch {
    return [];
  }
}

export async function getMoods() {
  const { data } = await client.get("api/moods/");
  return data;
}

export async function recommendSimilar(movieTitle) {
  const { data } = await client.post("api/recommend/", {
    movie_title: movieTitle,
  });
  return data;
}

export async function recommendMood({
  mood,
  energy,
  company,
  maxRuntime,
  seedMovie,
  exclude,
  limit = 10,
}) {
  const { data } = await client.post("api/recommend/mood/", {
    mood,
    energy,
    company,
    ...(maxRuntime ? { max_runtime: maxRuntime } : {}),
    ...(seedMovie ? { seed_movie: seedMovie } : {}),
    ...(exclude && exclude.length ? { exclude } : {}),
    limit,
  });
  return data;
}

export function describeError(error, fallback) {
  const detail = error?.response?.data?.error;
  if (detail) return detail;
  if (error?.code === "ECONNABORTED") {
    return "The server is taking too long to answer. Please try again.";
  }
  if (!error?.response) {
    return "Cannot reach the server. Check your connection and try again.";
  }
  return fallback;
}
