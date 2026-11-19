// booksByAuthor.js
// Builds a collection of { name, slug, books[] } objects, one per author.
// Each book keeps the same { slug, frontmatter } shape as the global `Books` data,
// so it can be passed straight to shelf-cover.njk.

const slugify = (str) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Turns whatever is in the `author` frontmatter into a clean array of names.
// Handles strings, arrays, and manga-style credits such as
// "Story by Haro Aso Art by Kotaro Takata" -> ["Haro Aso", "Kotaro Takata"]
function normaliseAuthors(raw) {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list
    .flatMap((entry) =>
      String(entry).split(/\b(?:Story|Art|Illustrated|Written|Translated)\s+by\b|\s+&\s+|;/i),
    )
    .map((name) => name.trim())
    .filter(Boolean);
}

// Most frequent spelling wins; on a tie, prefer the one with accents/diacritics
function pickDisplayName(variants) {
  const accented = (s) => Number(/[^\x00-\x7F]/.test(s));
  return [...variants.entries()].sort(
    (a, b) => b[1] - a[1] || accented(b[0]) - accented(a[0]),
  )[0][0];
}

// Prefer the global `Books` data (what shelf-cover.njk already expects).
// Fall back to the src/Books/*.md files if it isn't available.
function getBooks(collectionApi) {
  const all = collectionApi.getAll();
  const fromData = all.length && all[0].data && all[0].data.Books;
  if (Array.isArray(fromData) && fromData.length) return fromData;

  console.warn("[authors] global `Books` data not found; using src/Books/*.md");
  return collectionApi.getFilteredByGlob("src/Books/*.md").map((b) => {
    const { collections, page, eleventy, pkg, ...frontmatter } = b.data;
    return { slug: b.fileSlug, path: b.inputPath, frontmatter };
  });
}

module.exports = function (eleventyConfig) {
  // Filters, so templates link to author pages using exactly the same slugs
  eleventyConfig.addFilter("authorSlug", slugify);
  eleventyConfig.addFilter("authorList", (raw) =>
    normaliseAuthors(raw).map((name) => ({ name, slug: slugify(name) })),
  );

  eleventyConfig.addCollection("booksByAuthor", (collectionApi) => {
    const books = getBooks(collectionApi);
    const authors = new Map();

    for (const book of books) {
      const seenInBook = new Set(); // don't list a book twice for one author

      for (const name of normaliseAuthors(book.frontmatter.author)) {
        const slug = slugify(name);
        if (!slug) {
          console.warn(`[authors] Empty slug for "${name}" in ${book.slug}`);
          continue;
        }
        if (seenInBook.has(slug)) continue;
        seenInBook.add(slug);

        if (!authors.has(slug)) {
          authors.set(slug, { name, slug, books: [], variants: new Map() });
        }
        const entry = authors.get(slug);

        if (entry.variants.size && !entry.variants.has(name)) {
          console.warn(
            `[authors] "${name}" and "${[...entry.variants.keys()].join('" / "')}" ` +
              `both slugify to "${slug}" (see ${book.slug})`,
          );
        }
        entry.variants.set(name, (entry.variants.get(name) || 0) + 1);
        entry.books.push(book);
      }
    }

    // Newest finished first; unfinished books last
    const byDateDesc = (a, b) =>
      new Date(b.frontmatter.end_date || 0) - new Date(a.frontmatter.end_date || 0);

    const result = [...authors.values()]
      .map(({ variants, ...a }) => ({
        ...a,
        name: pickDisplayName(variants),
        books: a.books.sort(byDateDesc),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Every slug must be unique, or Eleventy throws DuplicatePermalinkOutputError
    const counts = {};
    for (const a of result) counts[a.slug] = (counts[a.slug] || 0) + 1;
    for (const [slug, n] of Object.entries(counts)) {
      if (n > 1) console.error(`[authors] DUPLICATE slug "${slug}" x${n}`);
    }
    console.log(`[authors] ${result.length} author pages from ${books.length} books`);

    return result;
  });
};
