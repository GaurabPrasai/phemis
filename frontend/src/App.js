import { useCallback, useEffect, useRef, useState } from "react";
import {
  describeError,
  getMoods,
  getMovies,
  recommendMood,
  recommendSimilar,
} from "./api";
import { BRAND, getMoodStyle } from "./moods";
import Header from "./components/Header";
import MoodPanel from "./components/MoodPanel";
import MoodPicker from "./components/MoodPicker";
import MovieModal from "./components/MovieModal";
import MovieSearch from "./components/MovieSearch";
import RefineBar from "./components/RefineBar";
import ResultsGrid from "./components/ResultsGrid";
import Watchlist from "./components/Watchlist";
import useWatchlist from "./hooks/useWatchlist";

const initial = new URLSearchParams(window.location.search);

function isNarrowScreen() {
  return window.matchMedia?.("(max-width: 639px)").matches;
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
  const [seedOpen, setSeedOpen] = useState(Boolean(initial.get("seed")));

  const [moodResults, setMoodResults] = useState(null);
  const [moodStatus, setMoodStatus] = useState(
    initial.get("mood") ? "loading" : "idle",
  );
  const [moodError, setMoodError] = useState("");
  const [shown, setShown] = useState([]);

  const [similarSeed, setSimilarSeed] = useState("");
  const [similarResults, setSimilarResults] = useState(null);
  const [similarStatus, setSimilarStatus] = useState("idle");
  const [similarError, setSimilarError] = useState("");

  const [modalMovie, setModalMovie] = useState(null);
  const [modalContext, setModalContext] = useState({
    context: "",
    accent: BRAND,
  });
  const [watchlistOpen, setWatchlistOpen] = useState(false);

  const watchlist = useWatchlist();
  const moodRequest = useRef(0);

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

  const loadMood = useCallback(
    async (exclude) => {
      if (!mood) return;
      const requestId = moodRequest.current + 1;
      moodRequest.current = requestId;
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
        if (requestId !== moodRequest.current) return;
        setMoodResults(items);
        setShown((previous) =>
          Array.from(new Set([...previous, ...items.map((item) => item.title)])),
        );
      } catch (error) {
        if (requestId !== moodRequest.current) return;
        setMoodResults([]);
        setMoodError(
          error?.response?.status === 404
            ? ""
            : describeError(error, "Could not find movies for that mood."),
        );
      }
      if (requestId === moodRequest.current) setMoodStatus("done");
    },
    [mood, energy, company, time, moodSeed],
  );

  // Refinement changes and a new mood both reload after a short pause.
  useEffect(() => {
    if (!mood) return undefined;
    const timer = window.setTimeout(() => loadMood([]), 150);
    return () => window.clearTimeout(timer);
  }, [mood, loadMood]);

  const chooseMood = (slug) => {
    moodRequest.current += 1;
    setMood(slug);
    setEnergy("balanced");
    setCompany("alone");
    setTime("any");
    setMoodSeed("");
    setSeedOpen(false);
    setShown([]);
    setMoodResults(null);
    setMoodError("");
    setMoodStatus("loading");
    if (isNarrowScreen()) {
      const reduceMotion = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }
  };

  const shuffleMood = () => loadMood(shown);

  const changeMood = () => {
    moodRequest.current += 1;
    setMood("");
    setMoodResults(null);
    setMoodError("");
    setMoodStatus("idle");
    setShown([]);
    setSeedOpen(false);
  };

  const resetRefine = () => {
    moodRequest.current += 1;
    setEnergy("balanced");
    setCompany("alone");
    setTime("any");
    setMoodSeed("");
    setSeedOpen(false);
  };

  const toggleSeed = () => {
    if (seedOpen && moodSeed) {
      moodRequest.current += 1;
      setMoodSeed("");
    }
    setSeedOpen(!seedOpen);
  };

  const selectSeed = (title) => {
    moodRequest.current += 1;
    setMoodSeed(title);
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

  const closeModal = useCallback(() => setModalMovie(null), []);
  const closeWatchlist = useCallback(() => setWatchlistOpen(false), []);

  const selectedMood = moods.find((item) => item.slug === mood);
  const moodStyle = getMoodStyle(mood);
  const showMoodResults = moodStatus !== "idle" || moodResults !== null;
  const panelBlurb = selectedMood?.blurb?.replace(/\.$/, "");

  const openMoodMovie = (movie) => {
    setModalContext({
      context: `Matches your mood · ${selectedMood?.label ?? "your mood"}`,
      accent: moodStyle.color,
    });
    setModalMovie(movie);
  };

  const openSimilarMovie = (movie) => {
    setModalContext({
      context: similarSeed ? `Because you liked ${similarSeed}` : "",
      accent: BRAND,
    });
    setModalMovie(movie);
  };

  const handleMoreLikeThis = (movie) => {
    setModalMovie(null);
    setTab("similar");
    setSimilarResults(null);
    loadSimilar(movie.title);
  };

  const updateRefine = (patch) => {
    moodRequest.current += 1;
    if (patch.energy) setEnergy(patch.energy);
    if (patch.company) setCompany(patch.company);
    if (patch.time) setTime(patch.time);
  };

  return (
    <div className="app">
      <Header
        tab={tab}
        onTab={setTab}
        savedCount={watchlist.items.length}
        onOpenWatchlist={() => setWatchlistOpen(true)}
        savedOpen={watchlistOpen}
      />

      <main className="main">
        {waking && (
          <p className="notice" role="status">
            Waking things up, one moment...
          </p>
        )}
        {catalogError && (
          <p className="notice" role="alert">
            {catalogError}
          </p>
        )}

        {tab === "mood" ? (
          showMoodResults ? (
            <ResultsGrid
              heading="Ten films for tonight"
              accent={moodStyle.color}
              panel={
                <MoodPanel
                  color={moodStyle.color}
                  eyebrow="Your mood"
                  title={selectedMood?.label ?? "Picked for your mood"}
                  subline={
                    panelBlurb
                      ? `${panelBlurb}. Ten films picked for tonight.`
                      : "Ten films picked for tonight."
                  }
                >
                  <RefineBar
                    energy={energy}
                    company={company}
                    time={time}
                    onChange={updateRefine}
                  />
                  <button
                    type="button"
                    className="panel-seed-toggle"
                    aria-expanded={seedOpen}
                    aria-controls="mood-seed"
                    onClick={toggleSeed}
                  >
                    Add a movie you loved
                  </button>
                  {seedOpen && (
                    <div className="panel-seed" id="mood-seed">
                      <MovieSearch
                        movies={movies}
                        value={moodSeed}
                        onSelect={selectSeed}
                        label="A movie you loved"
                        placeholder="Search a title..."
                        hint="Blends your mood with films like it."
                      />
                    </div>
                  )}
                </MoodPanel>
              }
              items={moodResults ?? []}
              loading={moodStatus === "loading"}
              error={moodError}
              onRetry={() => loadMood([])}
              onOpen={openMoodMovie}
              onShuffle={moodResults?.length ? shuffleMood : undefined}
              onChangeMood={changeMood}
              emptyText="Nothing matched that mix"
              emptyHint="Try a different energy or time"
              emptyLabel="Reset filters"
              onEmpty={resetRefine}
            />
          ) : (
            <section className="picker">
              <div className="hero">
                <p className="hero-eyebrow">FIND SOMETHING TO WATCH</p>
                <h1 className="hero-title">
                  What are you in the <span>mood</span> for?
                </h1>
                <p className="hero-sub">
                  Pick a feeling. We will find ten films that fit it.
                </p>
              </div>

              <MoodPicker moods={moods} onSelect={chooseMood} />
            </section>
          )
        ) : (
          <section className="similar">
            <div className="hero">
              <p className="hero-eyebrow">FIND SOMETHING TO WATCH</p>
              <h1 className="hero-title">
                Start from a movie you <span>love</span>
              </h1>
              <p className="hero-sub">
                We will find films with a similar feel.
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
                className="btn btn-brand"
                onClick={() => loadSimilar()}
                disabled={!similarSeed.trim() || similarStatus === "loading"}
              >
                Find films
              </button>
            </div>

            {similarStatus !== "idle" && (
              <ResultsGrid
                heading="Ten films with the same feel"
                accent={BRAND}
                panel={
                  <MoodPanel
                    color={BRAND}
                    eyebrow="Your pick"
                    titleAs="h2"
                    title={
                      similarSeed
                        ? `Because you liked ${similarSeed}`
                        : "Similar movies"
                    }
                    subline="Ten films with a similar feel."
                  />
                }
                items={similarResults ?? []}
                loading={similarStatus === "loading"}
                error={similarError}
                onRetry={() => loadSimilar(similarSeed)}
                onOpen={openSimilarMovie}
                emptyText="Nothing matched that title"
                emptyHint="Try a different movie"
              />
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
          context={modalContext.context}
          accent={modalContext.accent}
          onClose={closeModal}
          onMoreLikeThis={handleMoreLikeThis}
          onToggleSave={watchlist.toggle}
        />
      )}

      {watchlistOpen && (
        <Watchlist
          items={watchlist.items}
          onClose={closeWatchlist}
          onRemove={watchlist.remove}
          onOpen={(item) => {
            setWatchlistOpen(false);
            setModalContext({ context: "", accent: BRAND });
            setModalMovie(item);
          }}
        />
      )}
    </div>
  );
}

export default App;
