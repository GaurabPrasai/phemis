import PosterArt from "./PosterArt";

export default function MovieCard({ movie, onOpen, index = 0, accent }) {
  const rating = movie.rating ? Number(movie.rating).toFixed(1) : null;
  const genres = (movie.genres || []).slice(0, 2).join(", ");
  const metaText = [rating ? `★ ${rating}` : null, genres || null]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className="movie-card"
      style={{ animationDelay: `${Math.min(index, 9) * 30}ms` }}
    >
      <button
        type="button"
        className="card-button"
        aria-label={
          metaText
            ? `Details for ${movie.title}, ${metaText}`
            : `Details for ${movie.title}`
        }
        onClick={() => onOpen(movie)}
      >
        <PosterArt movie={movie} accent={accent} />
        {(rating || genres) && (
          <span className="card-meta">
            {rating && (
              <>
                <span className="card-star" aria-hidden="true">
                  ★
                </span>{" "}
                {rating}
              </>
            )}
            {rating && genres ? " · " : ""}
            {genres && <span className="card-genres">{genres}</span>}
          </span>
        )}
      </button>
    </article>
  );
}
