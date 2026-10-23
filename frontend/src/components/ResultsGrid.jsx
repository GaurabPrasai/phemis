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
  emptyHint,
  emptyLabel,
  onEmpty,
}) {
  return (
    <section className="results" aria-busy={loading}>
      <div className="results-head">
        <h2 className="results-title">{heading}</h2>
        <div className="results-actions">
          {onShuffle && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onShuffle}
              disabled={loading}
            >
              Shuffle
            </button>
          )}
          {onChangeMood && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onChangeMood}
            >
              Change mood
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="state" role="alert">
          <p className="state-title is-error">
            <span className="notice-dot" aria-hidden="true" />
            {error}
          </p>
          {onRetry && (
            <button type="button" className="btn btn-ghost" onClick={onRetry}>
              Try again
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
          {items.map((movie, index) => (
            <MovieCard
              key={movie.movie_id ?? movie.title}
              movie={movie}
              index={index}
              saved={isSaved(movie)}
              onOpen={onOpen}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      ) : (
        <div className="state">
          <p className="state-title">{emptyText || "Nothing matched that mix"}</p>
          {emptyHint && <p className="state-hint">{emptyHint}</p>}
          {onEmpty && (
            <button type="button" className="btn btn-ghost" onClick={onEmpty}>
              {emptyLabel || "Reset filters"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
