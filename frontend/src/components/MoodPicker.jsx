export default function MoodPicker({ moods, selected, onSelect }) {
  return (
    <div className="mood-grid" role="group" aria-label="Pick a mood">
      {moods.map((mood) => (
        <button
          key={mood.slug}
          type="button"
          className={`mood-tile ${selected === mood.slug ? "is-selected" : ""}`}
          aria-pressed={selected === mood.slug}
          onClick={() => onSelect(mood.slug)}
        >
          <span className="mood-label">{mood.label}</span>
          <span className="mood-blurb">{mood.blurb}</span>
        </button>
      ))}
    </div>
  );
}
