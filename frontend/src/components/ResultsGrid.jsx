import MovieCard from "./MovieCard";
import Skeleton from "./Skeleton";

export default function ResultsGrid({
  heading,
  items,
  loading,
  error,
  onRetry,
  onOpen,
  onShuffle,
  onChangeMood,
  onToggleSave,
  isSaved,
  emptyText,
}) {
  return (
    <section className="results" aria-busy={loading}>
      <div className="results-head">
        <h2 className="results-title">{heading}</h2>
        <div className="results-actions">
          {onShuffle && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onShuffle}
              disabled={loading}
            >
              Shuffle
            </button>
          )}
          {onChangeMood && (
            <button type="button" className="btn btn-quiet" onClick={onChangeMood}>
              Change mood
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="state" role="alert">
          <p>{error}</p>
          {onRetry && (
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      ) : loading ? (
        <div className="grid">
          {Array.from({ length: 10 }, (_, index) => (
            <Skeleton key={index} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid">
          {items.map((movie) => (
            <MovieCard
              key={movie.movie_id ?? movie.title}
              movie={movie}
              saved={isSaved(movie)}
              onOpen={onOpen}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      ) : (
        <div className="state">
          <p>{emptyText || "Nothing here yet."}</p>
        </div>
      )}
    </section>
  );
}
