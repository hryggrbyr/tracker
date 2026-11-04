const slugify = require("slugify");

/**
 * Human-readable Date
 * Returns a date as a string value appropriate to the host environment's current locale.
 * @param {number} value The date to convert. If not provided, the function will use current datetime
 * @param {string} lang The language to use while formatting (optional). Falls back to British English
 * @return {string} The converted date as a human-readable string
 * @example humanReadableDate() // Thursday, December 20, 2012
 * @example humanReadableDate('2013-08-24') // Saturday, 24 August 2013
 * @example humanReadableDate('2013-08-24', 'en-US') // Saturday, August 24, 2013
 * @example humanReadableDate('2013-08-24', 'de-DE') // Samstag, 24. August 2013
 */

const humanReadableDate = (value = null, lang = "en-GB") => {
  const event = value ? new Date(value) : new Date();

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return event.toLocaleDateString(lang, options);
};

/**
 * Normalise a `watched` frontmatter value to a sorted (oldest first) array of Dates.
 * Accepts a single date (legacy), an array of dates, or an empty value.
 * @param {*} value A date, an array of dates, or null/undefined
 * @return {Date[]} Valid dates, oldest first
 */
const watchedDates = (value) =>
  (Array.isArray(value) ? value : [value])
    .filter(Boolean)
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d))
    .sort((a, b) => a - b);

const watchedFirst = (value) => watchedDates(value)[0];
const watchedLatest = (value) => watchedDates(value).slice(-1)[0];
const watchedCount = (value) => watchedDates(value).length;

module.exports = function (eleventyConfig) {
  eleventyConfig.addNunjucksFilter("watchedFirst", watchedFirst);
  eleventyConfig.addNunjucksFilter("watchedLatest", watchedLatest);
  eleventyConfig.addNunjucksFilter("watchedCount", watchedCount);
  eleventyConfig.addNunjucksFilter("getFullYear", (x) => new Date(x).getFullYear());
  eleventyConfig.addNunjucksFilter("getMonthName", (x) =>
    new Date(x).toLocaleString("en-GB", { month: "long" }),
  );
  eleventyConfig.addNunjucksFilter("humanReadableDate", humanReadableDate);
  eleventyConfig.addNunjucksFilter("watched", (x) =>
    x
      .filter((x) => x.frontmatter.shelf === "watched")
      .sort(
        (a, b) =>
          (watchedLatest(b.frontmatter.watched) || 0) - (watchedLatest(a.frontmatter.watched) || 0),
      )
      .slice(0, 8),
  );
  const latestWatched = (watched) => {
    if (!watched) return null;
    const list = Array.isArray(watched) ? watched : [watched];
    const dates = list
      .map(
        (w) =>
          new Date(
            typeof w === "object" && w !== null && !(w instanceof Date) ? (w.date ?? w.watched) : w,
          ),
      )
      .filter((d) => !isNaN(d));
    if (!dates.length) return null;
    return new Date(Math.max(...dates));
  };
  eleventyConfig.addFilter("monthlyMedia", function (items) {
    const W = 240,
      H = 100;

    const monthOf = (value) => {
      if (!value) return null;
      const d = new Date(value);
      return isNaN(d) ? null : d.getUTCMonth(); // 0-11
    };

    const defs = [
      { key: "books", label: "Books", color: "var(--chart-books)" },
      { key: "films", label: "Films", color: "var(--chart-films)" },
      { key: "telly", label: "Telly", color: "var(--chart-telly)" },
      { key: "christmas", label: "Christmas films", color: "var(--chart-christmas)" },
    ];
    const series = defs.map((d) => ({ ...d, values: Array(12).fill(0) }));
    const by = Object.fromEntries(series.map((s) => [s.key, s]));

    for (const item of items || []) {
      const d = item.data;
      if (d.shelf === "read") {
        const m = monthOf(latestWatched(d.end_date));
        if (m !== null) by.books.values[m]++;
      } else if (d.type === "movie" || d.type === "series") {
        const m = monthOf(watchedLatest(d.watched));
        if (m === null) continue;
        if (d.type === "series") {
          by.telly.values[m]++;
        } else {
          by.films.values[m]++;
          const g = d.genre;
          const isXmas = Array.isArray(g)
            ? g.some((x) => String(x).toLowerCase() === "christmas")
            : g && String(g).toLowerCase().includes("christmas");
          if (isXmas) by.christmas.values[m]++;
        }
      }
    }

    const max = Math.max(1, ...series.flatMap((s) => s.values));
    for (const s of series) {
      s.points = s.values.map((v, i) => ({
        month: i,
        count: v,
        x: +((i / 11) * W).toFixed(2),
        y: +(H - (v / max) * H).toFixed(2),
      }));
      s.polyline = s.points.map((p) => `${p.x},${p.y}`).join(" ");
      s.total = s.values.reduce((a, b) => a + b, 0);
    }

    return {
      series,
      max,
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    };
  });
  eleventyConfig.addFilter("topCounts", (items, field, limit = 10, shelf = "read") => {
    const counts = new Map();
    for (const item of items || []) {
      if (item.data.shelf !== shelf) continue;
      const raw = item.data[field];
      if (!raw) continue;
      for (const v of Array.isArray(raw) ? raw : [raw]) {
        const name = String(v).trim();
        if (name) counts.set(name, (counts.get(name) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, limit);
  });
  eleventyConfig.addFilter("urlEncode", function (value) {
    return encodeURIComponent(value);
  });
  eleventyConfig.addNunjucksFilter("asStars", (x) => {
    const rating = Math.round(parseInt(x, 10));

    if (rating < 0 || rating > 5 || isNaN(rating)) {
      return "Not rated";
    }

    const filled = "★";
    const outline = "☆";
    return filled.repeat(rating) + outline.repeat(5 - rating);
  });

  eleventyConfig.addPassthroughCopy({
    "./_data/*.json": "api",
  });
  eleventyConfig.addPassthroughCopy("./src/css");
  eleventyConfig.addWatchTarget("./src/css/");

  eleventyConfig.addTransform("fixWikilinks", function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      const wikiLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

      return content.replace(wikiLinkRegex, (match, target, displayText) => {
        // Replace ../ with /tracker/
        const normalizedPath = target.replace(/^\.\.\//, "/tracker/");

        // Slugify the entire filepath using 11ty's slugify
        const slug = eleventyConfig.getFilter("slugify")(normalizedPath);

        // Use display text if provided, otherwise use the target filename
        const linkText =
          displayText ||
          target
            .split("/")
            .pop()
            .replace(/\.[^.]+$/, "");

        // Return as HTML link
        return `${linkText}`;
      });
    }
    return content;
  });

  const groupByYear = (items, shelf) => {
    const byYear = {};
    items
      .filter((x) => shelf.includes(x.data.shelf))
      .forEach((item) => {
        const date = watchedLatest(item.data.watched) || item.data.end_date;
        const year = date.getFullYear();
        if (!byYear[year]) {
          byYear[year] = [];
        }
        byYear[year].push(item);
      });

    // Sort items within each year by the appropriate date field
    Object.keys(byYear).forEach((year) => {
      byYear[year].sort((a, b) => {
        const dateA = a.data.shelf === "read" ? a.data.end_date : watchedLatest(a.data.watched);
        const dateB = b.data.shelf === "read" ? b.data.end_date : watchedLatest(b.data.watched);
        return dateA - dateB; // Oldest first
      });
    });

    // Return only 5 most recent years
    return Object.entries(byYear).sort((a, b) => b[0] - a[0]); // Sort by year descending
    //.slice(0, 10);
  };
  eleventyConfig.addCollection("mediaByYear", (collectionApi) => {
    const items = collectionApi.getFilteredByGlob([
      "src/Books/**/*.md",
      "src/Movies/**/*.md",
      "src/Series/**/*.md",
    ]);
    return groupByYear(items, ["read", "watched"]);
  });

  return {
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: process.env.NODE_ENV === "production" ? "/tracker/" : "/",
    dir: {
      input: "src",
      output: "public",
    },
    eleventyComputed: {
      // YAML parses year-only values (e.g. `published: 2019`) as numbers, and
      // new Date(2019) means 2019ms after the Unix epoch. Normalize to 1 Jan
      // of that year so templates and date filters behave.
      published: (data) =>
        typeof data.published === "number" ? new Date(data.published, 0, 1) : data.published,
      permalink: (data) => {
        const pathParts = data.page.filePathStem.split("/");
        const slugifiedParts = pathParts.map((part) =>
          slugify(part, { lower: true, strict: true }),
        );
        return `${slugifiedParts.join("/")}/index.html`;
      },
    },
  };
};
