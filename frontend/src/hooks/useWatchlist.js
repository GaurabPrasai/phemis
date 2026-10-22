import { useCallback, useEffect, useState } from "react";

const KEY = "phemis.watchlist";

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function same(a, b) {
  if (a.movie_id != null && b.movie_id != null) return a.movie_id === b.movie_id;
  return a.title === b.title;
}

export default function useWatchlist() {
  const [items, setItems] = useState(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // Private mode or a full quota: the list just does not persist.
    }
  }, [items]);

  const has = useCallback(
    (movie) => items.some((item) => same(item, movie)),
    [items],
  );

  const toggle = useCallback((movie) => {
    setItems((previous) =>
      previous.some((item) => same(item, movie))
        ? previous.filter((item) => !same(item, movie))
        : [
            ...previous,
            {
              movie_id: movie.movie_id ?? null,
              title: movie.title,
              poster_url: movie.poster_url,
              year: movie.year ?? null,
            },
          ],
    );
  }, []);

  const remove = useCallback((movie) => {
    setItems((previous) => previous.filter((item) => !same(item, movie)));
  }, []);

  return { items, has, toggle, remove };
}
