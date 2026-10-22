import { useEffect, useRef } from "react";

export default function Watchlist({ items, onClose, onRemove, onOpen }) {
  const closeRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="watchlist-title"
      >
        <div className="drawer-head">
          <h2 id="watchlist-title">Your watchlist</h2>
          <button
            type="button"
            className="drawer-close"
            aria-label="Close watchlist"
            onClick={onClose}
            ref={closeRef}
          >
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <p className="drawer-empty">
            Nothing saved yet. Hit ♡ on a movie to keep it here.
          </p>
        ) : (
          <ul className="watchlist">
            {items.map((item) => (
              <li key={item.movie_id ?? item.title} className="watchlist-item">
                <button
                  type="button"
                  className="watchlist-open"
                  aria-label={`Details for ${item.title}`}
                  onClick={() => onOpen(item)}
                >
                  <img src={item.poster_url} alt="" />
                </button>
                <div className="watchlist-text">
                  <p className="watchlist-name">{item.title}</p>
                  {item.year ? <p className="watchlist-year">{item.year}</p> : null}
                </div>
                <button
                  type="button"
                  className="btn btn-quiet btn-sm"
                  aria-label={`Remove ${item.title}`}
                  onClick={() => onRemove(item)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
