export default function Header({ tab, onTab, savedCount, onOpenWatchlist }) {
  return (
    <header className="header">
      <div className="header-inner">
        <span className="brand-name">Phemis</span>

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
          className="saved-button"
          onClick={onOpenWatchlist}
          aria-label={`Open saved movies, ${savedCount} saved`}
        >
          Saved
          {savedCount > 0 && (
            <span className="saved-count" aria-hidden="true">
              {savedCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
