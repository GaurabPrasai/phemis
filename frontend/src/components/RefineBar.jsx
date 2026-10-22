const ENERGY = [
  { value: "chill", label: "Chill" },
  { value: "balanced", label: "Balanced" },
  { value: "intense", label: "Intense" },
];

const COMPANY = [
  { value: "alone", label: "Alone" },
  { value: "partner", label: "Partner" },
  { value: "friends", label: "Friends" },
  { value: "family", label: "Family" },
];

const TIME = [
  { value: "any", label: "Any length" },
  { value: "100", label: "Under 100 min" },
  { value: "130", label: "Under 130 min" },
];

function Chips({ legend, options, value, onChange, disabled }) {
  return (
    <fieldset className="refine-group" disabled={disabled}>
      <legend>{legend}</legend>
      <div className="chips">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`chip ${value === option.value ? "is-active" : ""}`}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function RefineBar({
  energy,
  company,
  time,
  onChange,
  disabled,
}) {
  return (
    <div className="refine">
      <Chips
        legend="Energy"
        options={ENERGY}
        value={energy}
        onChange={(value) => onChange({ energy: value })}
        disabled={disabled}
      />
      <Chips
        legend="Watching with"
        options={COMPANY}
        value={company}
        onChange={(value) => onChange({ company: value })}
        disabled={disabled}
      />
      <Chips
        legend="Time"
        options={TIME}
        value={time}
        onChange={(value) => onChange({ time: value })}
        disabled={disabled}
      />
    </div>
  );
}
