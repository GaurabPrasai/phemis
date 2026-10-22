export default function MovieCard({ movie, onOpen, onToggleSave, saved }) {
  const meta = [
    movie.year || null,
    movie.rating ? `★ ${Number(movie.rating).toFixed(1)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="movie-card">
      <div className="card-poster">
        <button
          type="button"
          className="card-hit"
          onClick={() => onOpen(movie)}
          aria-label={`Details for ${movie.title}`}
        >
          <img src={movie.poster_url} alt={movie.title} loading="lazy" />
        </button>

        <div className="card-overlay">
          {movie.why && <p className="card-why">{movie.why}</p>}
          <div className="card-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onOpen(movie)}
            >
              Details
            </button>
            <button
              type="button"
              className={`btn btn-ghost btn-sm ${saved ? "is-saved" : ""}`}
              aria-pressed={saved}
              onClick={() => onToggleSave(movie)}
            >
              {saved ? "♥ Saved" : "♡ Save"}
            </button>
          </div>
        </div>
      </div>

      <h3 className="card-title">{movie.title}</h3>
      {meta && <p className="card-meta">{meta}</p>}
    </article>
  );
}
