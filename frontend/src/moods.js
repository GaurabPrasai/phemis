// The frontend owns how each mood looks. The backend only sends slugs,
// labels and blurbs. Unknown slugs fall back to the brand accent and a
// circle so a new mood still renders sensibly.
export const BRAND = "#f4a58a";

const MOOD_STYLES = {
  laugh: { color: "#f6c945", shape: "circle" },
  feelgood: { color: "#f4a58a", shape: "half" },
  cry: { color: "#7f9be8", shape: "ring" },
  romantic: { color: "#ee7ba0", shape: "diamond" },
  hyped: { color: "#ff6a3d", shape: "circle" },
  spooky: { color: "#9a82e0", shape: "ring" },
  mindbend: { color: "#3fc1b0", shape: "half" },
  adventure: { color: "#93cc6a", shape: "diamond" },
  inspired: { color: "#e0bd8a", shape: "circle" },
};

export const FALLBACK_MOOD_STYLE = { color: BRAND, shape: "circle" };

export function getMoodStyle(slug) {
  return MOOD_STYLES[slug] ?? FALLBACK_MOOD_STYLE;
}

const FALLBACK_COLORS = Object.values(MOOD_STYLES).map((mood) => mood.color);

// Stable colour for a poster with no image, chosen from the mood palette.
export function colorForTitle(title = "") {
  let hash = 0;
  for (let index = 0; index < title.length; index += 1) {
    hash = (hash * 31 + title.charCodeAt(index)) % 100000;
  }
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}
