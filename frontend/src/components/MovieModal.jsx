import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function MovieModal({ movie, onClose, onMoreLikeThis, onToggleSave, saved }) {
  const dialogRef = useRef(null);
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
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll(FOCUSABLE),
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

  if (!movie) return null;

  const meta = [
    movie.year || null,
    movie.runtime ? `${movie.runtime} min` : null,
    movie.rating ? `★ ${Number(movie.rating).toFixed(1)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={dialogRef}
      >
        <button
          type="button"
          className="modal-close"
          aria-label="Close details"
          onClick={onClose}
          ref={closeRef}
        >
          ×
        </button>

        <div className="modal-body">
          <img className="modal-poster" src={movie.poster_url} alt={movie.title} />

          <div className="modal-info">
            <h2 id="modal-title">{movie.title}</h2>
            {meta && <p className="modal-meta">{meta}</p>}

            {movie.genres && movie.genres.length > 0 && (
              <ul className="genre-chips">
                {movie.genres.map((genre) => (
                  <li key={genre}>{genre}</li>
                ))}
              </ul>
            )}

            {movie.overview && <p className="modal-overview">{movie.overview}</p>}
            {movie.why && <p className="modal-why">{movie.why}</p>}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onMoreLikeThis(movie)}
              >
                More like this
              </button>
              <button
                type="button"
                className={`btn btn-ghost ${saved ? "is-saved" : ""}`}
                aria-pressed={saved}
                onClick={() => onToggleSave(movie)}
              >
                {saved ? "♥ Saved" : "♡ Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
