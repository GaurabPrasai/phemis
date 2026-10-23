import { useCallback, useEffect, useRef, useState } from "react";
import {
  describeError,
  getMoods,
  getMovies,
  recommendMood,
  recommendSimilar,
} from "./api";
import Header from "./components/Header";
import MoodPicker from "./components/MoodPicker";
import MovieModal from "./components/MovieModal";
import MovieSearch from "./components/MovieSearch";
import RefineBar from "./components/RefineBar";
import ResultsGrid from "./components/ResultsGrid";
import Watchlist from "./components/Watchlist";
import useWatchlist from "./hooks/useWatchlist";

const initial = new URLSearchParams(window.location.search);

function scrollTo(ref) {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  ref.current?.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
}

function App() {
  const [tab, setTab] = useState(
    initial.get("tab") === "similar" ? "similar" : "mood",
  );
  const [moods, setMoods] = useState([]);
  const [movies, setMovies] = useState([]);
  const [catalogError, setCatalogError] = useState("");
  const [waking, setWaking] = useState(false);

  const [mood, setMood] = useState(initial.get("mood") || "");
  const [energy, setEnergy] = useState(initial.get("energy") || "balanced");
  const [company, setCompany] = useState(initial.get("company") || "alone");
  const [time, setTime] = useState(initial.get("time") || "any");
  const [moodSeed, setMoodSeed] = useState(initial.get("seed") || "");

  const [moodResults, setMoodResults] = useState(null);
  const [moodStatus, setMoodStatus] = useState("idle");
  const [moodError, setMoodError] = useState("");
  const [shown, setShown] = useState([]);

  const [similarSeed, setSimilarSeed] = useState("");
  const [similarResults, setSimilarResults] = useState(null);
  const [similarStatus, setSimilarStatus] = useState("idle");
  const [similarError, setSimilarError] = useState("");

  const [modalMovie, setModalMovie] = useState(null);
  const [watchlistOpen, setWatchlistOpen] = useState(false);

  const watchlist = useWatchlist();
  const moodResultsRef = useRef(null);
  const similarResultsRef = useRef(null);

  // Catalogue + mood tiles. The first request after a cold start can
  // take a while on the free Azure plan, hence the "waking up" banner.
  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(() => {
      if (alive) setWaking(true);
    }, 4000);

    Promise.allSettled([getMovies(), getMoods()]).then(([movieList, moodList]) => {
      if (!alive) return;
      window.clearTimeout(timer);
      setWaking(false);

      if (movieList.status === "fulfilled") {
        setMovies(movieList.value);
      } else {
        setCatalogError("Could not load the movie list. Please refresh.");
      }
      if (moodList.status === "fulfilled") {
        setMoods(moodList.value);
      } else {
        setCatalogError("Could not load the moods. Please refresh.");
      }
    });

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);

  // Shareable state: ?mood=cry&energy=chill&company=alone&time=100&seed=Titanic
  useEffect(() => {
    const params = new URLSearchParams();
    if (tab === "similar") params.set("tab", "similar");
    if (mood) params.set("mood", mood);
    if (energy !== "balanced") params.set("energy", energy);
    if (company !== "alone") params.set("company", company);
    if (time !== "any") params.set("time", time);
    if (moodSeed) params.set("seed", moodSeed);
    const search = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}`,
    );
  }, [tab, mood, energy, company, time, moodSeed]);

  useEffect(() => {
    if (moodStatus === "done") scrollTo(moodResultsRef);
  }, [moodStatus]);

  const loadMood = useCallback(
    async (exclude) => {
      if (!mood) return;
      setMoodStatus("loading");
      setMoodError("");
      try {
        const items = await recommendMood({
          mood,
          energy,
          company,
          maxRuntime: time === "any" ? null : Number(time),
          seedMovie: moodSeed,
          exclude,
        });
        setMoodResults(items);
        setShown((previous) =>
          Array.from(new Set([...previous, ...items.map((item) => item.title)])),
        );
      } catch (error) {
        setMoodResults([]);
        setMoodError(
          error?.response?.status === 404
            ? ""
            : describeError(error, "Could not find movies for that mood."),
        );
      }
      setMoodStatus("done");
    },
    [mood, energy, company, time, moodSeed],
  );

  const findMood = () => {
    setShown([]);
    loadMood([]);
  };
  const shuffleMood = () => loadMood(shown);
  const changeMood = () => {
    setMoodResults(null);
    setMoodError("");
    setMoodStatus("idle");
    setShown([]);
  };

  const loadSimilar = useCallback(
    async (title) => {
      const seed = (title ?? similarSeed).trim();
      if (!seed) return;
      setSimilarSeed(seed);
      setSimilarStatus("loading");
      setSimilarError("");
      try {
        setSimilarResults(await recommendSimilar(seed));
      } catch (error) {
        setSimilarResults([]);
        setSimilarError(describeError(error, "Could not find similar movies."));
      }
      setSimilarStatus("done");
    },
    [similarSeed],
  );

  const handleMoreLikeThis = (movie) => {
    setModalMovie(null);
    setTab("similar");
    setSimilarResults(null);
    loadSimilar(movie.title);
  };

  const updateRefine = (patch) => {
    if (patch.energy) setEnergy(patch.energy);
    if (patch.company) setCompany(patch.company);
    if (patch.time) setTime(patch.time);
  };

  const selectedMood = moods.find((item) => item.slug === mood);
  const showMoodResults = moodStatus !== "idle" || moodResults !== null;

  return (
    <div className="app">
      <Header
        tab={tab}
        onTab={setTab}
        savedCount={watchlist.items.length}
        onOpenWatchlist={() => setWatchlistOpen(true)}
      />

      <main className="main">
        {waking && (
          <p className="notice" role="status">
            Waking things up, one moment...
          </p>
        )}
        {catalogError && (
          <p className="notice" role="alert">
            <span className="notice-dot" aria-hidden="true" />
            {catalogError}
          </p>
        )}

        {tab === "mood" ? (
          showMoodResults ? (
            <div ref={moodResultsRef} className="results-anchor">
              <ResultsGrid
                heading={selectedMood ? selectedMood.label : "Picked for your mood"}
                items={moodResults ?? []}
                loading={moodStatus === "loading"}
                error={moodError}
                onRetry={findMood}
                onOpen={setModalMovie}
                onShuffle={moodResults?.length ? shuffleMood : undefined}
                onChangeMood={changeMood}
                onToggleSave={watchlist.toggle}
                isSaved={watchlist.has}
                emptyText="Nothing matched that mix"
                emptyHint="Try a different energy or time"
                emptyLabel="Change mood"
                onEmpty={changeMood}
              />
            </div>
          ) : (
            <section className="picker">
              <div className="hero">
                <h1 className="hero-title">
                  How are you <em>feeling</em> tonight?
                </h1>
                <p className="hero-sub">
                  Pick a mood. We will find ten films that fit it.
                </p>
              </div>

              <MoodPicker
                moods={moods}
                selected={mood}
                onSelect={(slug) => setMood(slug === mood ? "" : slug)}
              />

              {mood && (
                <div className="refine-panel">
                  <RefineBar
                    energy={energy}
                    company={company}
                    time={time}
                    onChange={updateRefine}
                  />

                  <MovieSearch
                    movies={movies}
                    value={moodSeed}
                    onSelect={setMoodSeed}
                    label="Add a movie you loved (optional)"
                    placeholder="Search a title..."
                    hint="Blends your mood with films like it."
                  />

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={findMood}
                  >
                    Find my movies
                  </button>
                </div>
              )}
            </section>
          )
        ) : (
          <section className="similar">
            <div className="hero">
              <h1 className="hero-title">
                Start from a movie you <em>love</em>
              </h1>
              <p className="hero-sub">
                Search a favourite and we will line up films with the same DNA.
              </p>
            </div>

            <div className="similar-form">
              <MovieSearch
                movies={movies}
                value={similarSeed}
                onSelect={setSimilarSeed}
                label="A movie you love"
                placeholder="Type to search movies..."
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => loadSimilar()}
                disabled={!similarSeed.trim() || similarStatus === "loading"}
              >
                Find similar movies
              </button>
            </div>

            {similarStatus !== "idle" && (
              <div
                ref={similarResultsRef}
                className="similar-results results-anchor"
              >
                <ResultsGrid
                  heading={similarSeed ? `Movies like “${similarSeed}”` : "Similar movies"}
                  items={similarResults ?? []}
                  loading={similarStatus === "loading"}
                  error={similarError}
                  onRetry={() => loadSimilar(similarSeed)}
                  onOpen={setModalMovie}
                  onToggleSave={watchlist.toggle}
                  isSaved={watchlist.has}
                  emptyText="Nothing matched that title"
                  emptyHint="Try a different movie"
                />
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <p>
            Made by Gaurab Prasai · Movie data from TMDB. Catalog: ~4,800
            popular films, mostly before 2018.
          </p>
          <p>
            This product uses the TMDB API but is not endorsed or certified by
            TMDB.
          </p>
        </div>
      </footer>

      {modalMovie && (
        <MovieModal
          movie={modalMovie}
          saved={watchlist.has(modalMovie)}
          onClose={() => setModalMovie(null)}
          onMoreLikeThis={handleMoreLikeThis}
          onToggleSave={watchlist.toggle}
        />
      )}

      {watchlistOpen && (
        <Watchlist
          items={watchlist.items}
          onClose={() => setWatchlistOpen(false)}
          onRemove={watchlist.remove}
          onOpen={(item) => {
            setWatchlistOpen(false);
            setModalMovie(item);
          }}
        />
      )}
    </div>
  );
}

export default App;
