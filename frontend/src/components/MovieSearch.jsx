import { useEffect, useId, useMemo, useRef, useState } from "react";

function highlight(title, query) {
  const needle = query.trim().toLowerCase();
  const index = needle ? title.toLowerCase().indexOf(needle) : -1;
  if (index < 0) return title;
  return (
    <>
      {title.slice(0, index)}
      <mark>{title.slice(index, index + needle.length)}</mark>
      {title.slice(index + needle.length)}
    </>
  );
}

export default function MovieSearch({
  movies,
  value,
  onSelect,
  label,
  placeholder = "Type to search movies...",
  hint,
}) {
  const generatedId = useId();
  const inputId = `movie-search-${generatedId}`;
  const listId = `${inputId}-list`;
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const onDocumentDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocumentDown);
    return () => document.removeEventListener("mousedown", onDocumentDown);
  }, []);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return movies
      .filter((title) => title.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [movies, query]);

  const expanded = open && query.trim().length > 0;

  const choose = (title) => {
    setQuery(title);
    onSelect(title);
    setOpen(false);
    setActive(0);
  };

  const handleChange = (event) => {
    const next = event.target.value;
    setQuery(next);
    setActive(0);
    setOpen(true);
    if (!next) onSelect("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, Math.max(matches.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      if (expanded && matches[active]) {
        event.preventDefault();
        choose(matches[active]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="search" ref={rootRef}>
      {label && (
        <label className="search-label" htmlFor={inputId}>
          {label}
        </label>
      )}

      <div className="search-field">
        <input
          id={inputId}
          ref={inputRef}
          className="search-input"
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            expanded && matches[active] ? `${listId}-${active}` : undefined
          }
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              onSelect("");
              setOpen(false);
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
      </div>

      {hint && <p className="search-hint">{hint}</p>}

      {expanded && (
        <ul className="search-list" id={listId} role="listbox" aria-label="Matching movies">
          {matches.length === 0 && (
            <li className="search-empty" role="option" aria-selected="false" aria-disabled="true">
              No movies found
            </li>
          )}
          {matches.map((title, index) => (
            <li
              key={title}
              id={`${listId}-${index}`}
              role="option"
              aria-label={title}
              aria-selected={index === active}
              className={`search-option ${index === active ? "is-active" : ""}`}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(title)}
            >
              {highlight(title, query)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
