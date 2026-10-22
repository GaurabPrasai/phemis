import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { getMovies, recommendMood, recommendSimilar } from "./api";

const moods = [
  { slug: "cry", label: "Need a good cry", emoji: "😭", blurb: "Emotional" },
  { slug: "laugh", label: "Make me laugh", emoji: "😂", blurb: "Funny" },
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

test("picking a mood and finding movies shows results and the details dialog", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(await screen.findByRole("button", { name: /Need a good cry/i }));
  expect(screen.getByText(/Watching with/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Find my movies" }));

  await waitFor(() =>
    expect(recommendMood).toHaveBeenCalledWith(
      expect.objectContaining({ mood: "cry", energy: "balanced", company: "alone" }),
    ),
  );
  expect(await screen.findByText("Saving Private Ryan")).toBeInTheDocument();
  expect(screen.getByText(/Matches your Need a good cry mood/)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Details for Saving Private Ryan" }));
  const dialog = await screen.findByRole("dialog");
  expect(dialog).toHaveAccessibleName("Saving Private Ryan");
  expect(screen.getByText(/169 min/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "More like this" })).toBeInTheDocument();

  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

test("the similar tab searches by title and renders matches", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /Similar to a movie/i }));
  const input = await screen.findByRole("combobox", { name: /A movie you love/i });
  await user.type(input, "Tita");

  expect(screen.getByRole("listbox")).toBeInTheDocument();
  await user.click(screen.getByRole("option", { name: "Titanic" }));

  await user.click(screen.getByRole("button", { name: "Find similar movies" }));

  expect(recommendSimilar).toHaveBeenCalledWith("Titanic");
  expect(await screen.findByText("Titanic")).toBeInTheDocument();
});
