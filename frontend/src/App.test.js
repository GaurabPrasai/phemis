import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { getMovies, recommendMood, recommendSimilar } from "./api";

const moods = [
  { slug: "cry", label: "Need a good cry", emoji: "😭", blurb: "Emotional and moving" },
  { slug: "laugh", label: "Make me laugh", emoji: "😂", blurb: "Light, funny, zero stress" },
];

const cryResults = [
  {
    movie_id: 1,
    title: "Saving Private Ryan",
    poster_url: "https://img/1.jpg",
    year: 1998,
    rating: 8.2,
    runtime: 169,
    genres: ["Drama", "War"],
    overview: "WWII.",
    why: "Matches your Need a good cry mood: Drama & War, rated 8.2",
  },
];

jest.mock("./api", () => ({
  getMovies: jest.fn(() => Promise.resolve(["Titanic", "Avatar"])),
  getMoods: jest.fn(() => Promise.resolve([])),
  recommendMood: jest.fn(() => Promise.resolve([])),
  recommendSimilar: jest.fn(() => Promise.resolve([])),
  describeError: jest.fn(() => "Something went wrong"),
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  // CRA's jest config resets mock implementations between tests.
  getMovies.mockResolvedValue(["Titanic", "Avatar"]);
  require("./api").getMoods.mockResolvedValue(moods);
  recommendMood.mockResolvedValue(cryResults);
  recommendSimilar.mockResolvedValue([
    {
      movie_id: 2,
      title: "Titanic",
      poster_url: "https://img/2.jpg",
      year: 1997,
      rating: 7.9,
    },
  ]);
});

test("picking a mood opens results, refinements reload, and the film can be saved", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(await screen.findByRole("button", { name: /Need a good cry/i }));

  await waitFor(() =>
    expect(recommendMood).toHaveBeenCalledWith(
      expect.objectContaining({ mood: "cry", energy: "balanced", company: "alone" }),
    ),
  );
  expect(
    await screen.findByRole("button", { name: /Details for Saving Private Ryan/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Need a good cry" }),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Chill" }));
  await waitFor(() =>
    expect(recommendMood).toHaveBeenLastCalledWith(
      expect.objectContaining({ mood: "cry", energy: "chill" }),
    ),
  );

  await user.click(
    screen.getByRole("button", { name: /Details for Saving Private Ryan/ }),
  );
  const dialog = await screen.findByRole("dialog");
  expect(dialog).toHaveAccessibleName("Saving Private Ryan");
  expect(screen.getByText(/169 min/)).toBeInTheDocument();
  expect(screen.getByText("WWII.")).toBeInTheDocument();
  expect(screen.getByText(/Why it fits:/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "More like this" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Save to watchlist" }));
  expect(screen.getByRole("button", { name: "Saved" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Saved · 1/ }),
  ).toBeInTheDocument();

  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

  await user.click(screen.getByRole("button", { name: /Saved · 1/ }));
  expect(screen.getByRole("heading", { name: "Saved" })).toBeInTheDocument();
  expect(screen.getByText("Saving Private Ryan")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Remove Saving Private Ryan" }));
  expect(screen.getByText("Nothing saved yet.")).toBeInTheDocument();
});

test("the similar tab searches by title and renders matches", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /Similar to a movie/i }));
  const input = await screen.findByRole("combobox", { name: /A movie you love/i });
  await user.type(input, "Tita");

  expect(screen.getByRole("listbox")).toBeInTheDocument();
  await user.click(screen.getByRole("option", { name: "Titanic" }));

  await user.click(screen.getByRole("button", { name: "Find films" }));

  expect(recommendSimilar).toHaveBeenCalledWith("Titanic");
  expect(
    await screen.findByRole("heading", { name: "Because you liked Titanic" }),
  ).toBeInTheDocument();
  expect(
    await screen.findByRole("button", { name: /Details for Titanic/ }),
  ).toBeInTheDocument();
});
