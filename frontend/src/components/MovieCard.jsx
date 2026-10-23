import { useEffect, useRef, useState } from "react";

export default function MovieCard({
  movie,
  onOpen,
  onToggleSave,
  saved,
  index = 0,
}) {
  const imageRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (imageRef.current?.complete) setLoaded(true);
  }, []);

  const year = movie.year || null;
  const rating = movie.rating ? Number(movie.rating).toFixed(1) : null;

  return (
    <article
      className="movie-card"
      style={{ animationDelay: `${Math.min(index, 9) * 30}ms` }}
    >
      <div className="card-poster">
        <img
          ref={imageRef}
          className={loaded ? "is-loaded" : ""}
          src={movie.poster_url}
          alt={movie.title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />

        <div className="card-overlay">
          {movie.why && <p className="card-why">{movie.why}</p>}
          <button
            type="button"
            className="card-save"
            aria-pressed={saved}
            onClick={() => onToggleSave(movie)}
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <h3 className="card-title">{movie.title}</h3>
      {(year || rating) && (
        <p className="card-meta">
          {year}
          {year && rating ? " · " : ""}
          {rating && (
            <>
              <span className="card-star" aria-hidden="true">
                ★
              </span>{" "}
              {rating}
            </>
          )}
        </p>
      )}

      <button
        type="button"
        className="card-open"
        aria-label={`Details for ${movie.title}`}
        onClick={() => onOpen(movie)}
      />
    </article>
  );
}
