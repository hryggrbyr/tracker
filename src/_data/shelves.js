// One entry per shelf. For each, two levels of pages are generated:
//   /<base>/<shelf>/              everything on the shelf
//   /<base>/<shelf>/owned/        ...only items with `owned: true`
//   /<base>/<shelf>/not-owned/    ...only items without it
// Add an entry here to create another cut of the data.
//   data  - name of the global data set (src/_data/<data>.json)
//   base  - URL segment of the medium
//   shelf - value of `shelf:` in the frontmatter to filter on
const shelves = [
  {
    data: "Books",
    base: "books",
    shelf: "read",
    title: "Read",
    heading: "📚 Read",
    blurb: "Books I have finished.",
  },
  {
    data: "Books",
    base: "books",
    shelf: "to-read",
    title: "To read",
    heading: "📚 To read",
    blurb: "The never-decreasing list of books I want to read.",
  },
  {
    data: "Movies",
    base: "movies",
    shelf: "watched",
    title: "Watched",
    heading: "🍿 Watched",
    blurb: "Films I have watched.",
  },
  {
    data: "Movies",
    base: "movies",
    shelf: "watchlist",
    title: "Watchlist",
    heading: "🍿 Watchlist",
    blurb: "Films I want to watch.",
  },
  {
    data: "Series",
    base: "series",
    shelf: "watched",
    title: "Watched",
    heading: "📺 Watched",
    blurb: "Series I have watched.",
  },
  {
    data: "Series",
    base: "series",
    shelf: "watchlist",
    title: "Watchlist",
    heading: "📺 Watchlist",
    blurb: "Series I want to watch.",
  },
];

const ownedCuts = [
  { ownedFilter: "owned", label: "Owned", note: "Only the ones I own." },
  {
    ownedFilter: "not-owned",
    label: "Not owned",
    note: "Only the ones I don't own.",
  },
];

module.exports = shelves.flatMap((s) => [
  { ...s, ownedFilter: "", path: `/${s.base}/${s.shelf}` },
  ...ownedCuts.map((cut) => ({
    ...s,
    ownedFilter: cut.ownedFilter,
    ownedLabel: cut.label,
    path: `/${s.base}/${s.shelf}/${cut.ownedFilter}`,
    title: `${s.title} (${cut.label.toLowerCase()})`,
    heading: `${s.heading} · ${cut.label}`,
    blurb: `${s.blurb} ${cut.note}`,
  })),
]);
