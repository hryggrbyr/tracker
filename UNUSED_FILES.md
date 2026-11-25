# Unused / unreferenced files

Files in the project that are not referenced by the build, templates, or other source files.
(Generated output in `public/` and dependencies in `node_modules/` are excluded.)

## Backup / dead includes
- `src/_includes/book.bak.njk` — backup of `book.njk`, never included
- `src/_includes/card.bak.njk` — backup of `card.njk`, never included
- `src/_includes/show.bak.njk` — backup of `show.njk`, never included

## Unreferenced includes
- `src/_includes/book-card.njk` — not included anywhere
- `src/_includes/card.njk` — only referenced by the unused `show.bak.njk`
- `src/_includes/count.njk` — not included anywhere
- `src/_includes/medium-card.njk` — not included anywhere
- `src/_includes/filter-controls.njk` — not included anywhere

## Suspicious / likely unused root-level data files
- `src/src.json` — stray `{"layout": "base.njk"}` file in the input root; not referenced and not a normal 11ty data file
- `src/src.11tydata.js` — 11ty data file duplicating the permalink logic already in `.eleventy.js`; appears redundant

## Notes
- `llm.md` is documentation, not code — kept, but not used by the build.
- `src/static_search.njk` IS used: it generates `/search.json`, which `src/search.njk` and `src/js/search.js` fetch.
- `src/_data/shelves.js` is used via 11ty's data cascade (`shelves` global) by `src/shelves.njk` and `src/_includes/shelf-nav.njk`.
- `src/booksByAuthor.js` is used via `.eleventy.js` (`addPlugin`).
- `public/` is generated output (gitignored), not source.
