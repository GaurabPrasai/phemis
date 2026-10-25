import { useEffect, useRef, useState } from "react";
import { colorForTitle } from "../moods";

// A poster box used by cards, the details dialog and the saved drawer.
// It shows the real TMDB image when there is one and a deterministic
// colour block with the title when there is not (or the image fails).
export default function PosterArt({ movie, variant = "card", accent }) {
  const imageRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!imageRef.current?.complete) return;
    if (imageRef.current.naturalWidth > 0) setLoaded(true);
    else setFailed(true);
  }, []);

  const hasImage = Boolean(movie.poster_url) && !failed;
  const fallbackColor = colorForTitle(movie.title);

  return (
    <div
      className={`poster-art poster-art-${variant}`}
      style={{ "--c": hasImage ? accent || fallbackColor : fallbackColor }}
    >
      {hasImage && (
        <img
          ref={imageRef}
          className={loaded ? "is-loaded" : ""}
          src={movie.poster_url}
          alt={movie.title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}

      {!hasImage && (
        <div className="poster-fallback">
          <span className="poster-shape" aria-hidden="true" />
          {movie.year && <span className="poster-year">{movie.year}</span>}
          <span className="poster-name">{movie.title}</span>
        </div>
      )}
    </div>
  );
}
