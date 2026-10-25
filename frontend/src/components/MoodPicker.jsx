import { getMoodStyle } from "../moods";

function MoodShape({ shape }) {
  return <span className={`mood-shape shape-${shape}`} aria-hidden="true" />;
}

export default function MoodPicker({ moods, onSelect }) {
  return (
    <div className="mood-grid" role="group" aria-label="Pick a mood">
      {moods.map((mood) => {
        const style = getMoodStyle(mood.slug);
        return (
          <button
            key={mood.slug}
            type="button"
            className="mood-tile"
            style={{ "--c": style.color }}
            onClick={() => onSelect(mood.slug)}
          >
            <MoodShape shape={style.shape} />
            <span className="mood-label">{mood.label}</span>
            <span className="mood-blurb">{mood.blurb}</span>
          </button>
        );
      })}
    </div>
  );
}
