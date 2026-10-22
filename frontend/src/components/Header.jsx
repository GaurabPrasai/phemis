export default function Header({ tab, onTab, savedCount, onOpenWatchlist }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ◉
          </span>
          <span className="brand-name">Phemis</span>
        </div>

        <nav className="tabs" aria-label="Recommendation mode">
          <button
            type="button"
            className={`tab ${tab === "mood" ? "is-active" : ""}`}
            aria-pressed={tab === "mood"}
            onClick={() => onTab("mood")}
          >
            By mood
          </button>
          <button
            type="button"
            className={`tab ${tab === "similar" ? "is-active" : ""}`}
            aria-pressed={tab === "similar"}
            onClick={() => onTab("similar")}
          >
            Similar to a movie
          </button>
        </nav>

        <button
          type="button"
          className="watchlist-button"
          onClick={onOpenWatchlist}
          aria-label={`Open watchlist, ${savedCount} saved`}
        >
          <span aria-hidden="true">♡</span>
          <span className="watchlist-label">Watchlist</span>
          {savedCount > 0 && (
            <span className="watchlist-count" aria-hidden="true">
              {savedCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
