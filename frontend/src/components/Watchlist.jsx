import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function Watchlist({ items, onClose, onRemove, onOpen }) {
  const panelRef = useRef(null);
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
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll(FOCUSABLE),
      ).filter((node) => node.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
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
      className="saved-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="saved-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-title"
        ref={panelRef}
      >
        <div className="saved-head">
          <h2 id="saved-title">Saved</h2>
          <button
            type="button"
            className="saved-close"
            onClick={onClose}
            ref={closeRef}
          >
            Close
          </button>
        </div>

        {items.length === 0 ? (
          <p className="saved-empty">Nothing saved yet.</p>
        ) : (
          <ul className="saved-list">
            {items.map((item) => (
              <li key={item.movie_id ?? item.title} className="saved-item">
                <button
                  type="button"
                  className="saved-open"
                  aria-label={`Details for ${item.title}`}
                  onClick={() => onOpen(item)}
                >
                  <img src={item.poster_url} alt="" />
                </button>
                <div>
                  <p className="saved-name">{item.title}</p>
                  {item.year ? <p className="saved-year">{item.year}</p> : null}
                </div>
                <button
                  type="button"
                  className="saved-remove"
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
