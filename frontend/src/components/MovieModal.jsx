import { useEffect, useRef } from "react";
import PosterArt from "./PosterArt";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function MovieModal({
  movie,
  onClose,
  onMoreLikeThis,
  onToggleSave,
  saved,
  context,
  accent,
}) {
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
    movie.rating ? { star: true, text: Number(movie.rating).toFixed(1) } : null,
    movie.runtime ? { text: `${movie.runtime} min` } : null,
    movie.year ? { text: movie.year } : null,
  ].filter(Boolean);

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
        style={{ "--c": accent }}
      >
        <button
          type="button"
          className="modal-close"
          aria-label="Close"
          onClick={onClose}
          ref={closeRef}
        >
          ×
        </button>

        <div className="modal-poster">
          <PosterArt movie={movie} variant="modal" accent={accent} />
        </div>

        <div className="modal-heading">
          {context && <p className="modal-context">{context}</p>}
          <h2 id="modal-title" className="modal-title">
            {movie.title}
          </h2>
          {meta.length > 0 && (
            <p className="modal-meta">
              {meta.map((item, index) => (
                <span key={item.text}>
                  {index > 0 && " · "}
                  {item.star && (
                    <span className="card-star" aria-hidden="true">
                      ★{" "}
                    </span>
                  )}
                  {item.text}
                </span>
              ))}
            </p>
          )}
        </div>

        <div className="modal-body">
          {movie.genres && movie.genres.length > 0 && (
            <ul className="genre-chips">
              {movie.genres.map((genre) => (
                <li key={genre}>{genre}</li>
              ))}
            </ul>
          )}

          <p className="modal-label">Synopsis</p>
          <p className="modal-overview">
            {movie.overview || "No synopsis available."}
          </p>

          {movie.why && <p className="modal-why">Why it fits: {movie.why}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="save-button"
              aria-pressed={saved}
              onClick={() => onToggleSave(movie)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={saved ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M6 3h12v18l-6-4-6 4z" />
              </svg>
              {saved ? "Saved" : "Save to watchlist"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onMoreLikeThis(movie)}
            >
              More like this
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
