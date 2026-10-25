import MovieCard from "./MovieCard";
import Skeleton from "./Skeleton";

export default function ResultsGrid({
  panel,
  heading,
  items,
  loading,
  error,
  onRetry,
  onOpen,
  onShuffle,
  onChangeMood,
  accent,
  emptyText,
  emptyHint,
  emptyLabel,
  onEmpty,
}) {
  const visible = items.slice(0, 10);

  return (
    <section className="results" aria-busy={loading}>
      {panel}

      <div className="results-head">
        <h2 className="results-title">{heading}</h2>
        {(onShuffle || onChangeMood) && (
          <div className="results-actions">
            {onChangeMood && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onChangeMood}
              >
                Change mood
              </button>
            )}
            {onShuffle && (
              <button
                type="button"
                className="btn btn-filled"
                onClick={onShuffle}
                disabled={loading}
              >
                Shuffle
              </button>
            )}
          </div>
        )}
      </div>

      {error ? (
        <div className="state" role="alert">
          <p className="state-title">We could not load films</p>
          <p className="state-hint">{error}</p>
          {onRetry && (
            <button type="button" className="btn btn-filled" onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      ) : loading ? (
        <div className="grid" style={{ "--c": accent }}>
          {Array.from({ length: 10 }, (_, index) => (
            <Skeleton key={index} />
          ))}
        </div>
      ) : visible.length > 0 ? (
        <div className="grid" style={{ "--c": accent }}>
          {visible.map((movie, index) => (
            <MovieCard
              key={movie.movie_id ?? movie.title}
              movie={movie}
              index={index}
              accent={accent}
              onOpen={onOpen}
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
