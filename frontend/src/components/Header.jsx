export default function Header({
  tab,
  onTab,
  onHome,
  savedCount,
  onOpenWatchlist,
  savedOpen,
}) {
  return (
    <header className="header">
      <div className="header-inner">
        <button
          type="button"
          className="brand"
          onClick={onHome}
          aria-label="Phemis, go to the home page"
        >
          phemis<span className="brand-dot">.</span>
        </button>

        <nav className="header-nav" aria-label="Recommendation mode">
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
          className={`tab saved-button ${savedOpen ? "is-active" : ""}`}
          onClick={onOpenWatchlist}
        >
          Saved · {savedCount}
        </button>
      </div>
    </header>
  );
}
