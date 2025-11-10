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

module.exports = function (eleventyConfig) {
  eleventyConfig.addNunjucksFilter("getFullYear", (x) =>
    new Date(x).getFullYear(),
  );
  eleventyConfig.addNunjucksFilter("getMonthName", (x) =>
    new Date(x).toLocaleString("en-GB", { month: "long" }),
  );
  eleventyConfig.addNunjucksFilter("humanReadableDate", humanReadableDate);
  eleventyConfig.addNunjucksFilter("watched", (x) =>
    x
      .filter((x) => x.frontmatter.shelf === "watched")
      .sort(
        (a, b) =>
          new Date(b.frontmatter.watched) - new Date(a.frontmatter.watched),
      )
      .slice(0, 5),
  );
  eleventyConfig.addFilter("urlEncode", function (value) {
    return encodeURIComponent(value);
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
        console.log(item.data.title, item.data.watched, item.data.end_date);
        const date = item.data.watched || item.data.end_date;
        const year = date.getFullYear();
        if (!byYear[year]) {
          byYear[year] = [];
        }
        byYear[year].push(item);
      });

    // Sort items within each year by the appropriate date field
    Object.keys(byYear).forEach((year) => {
      byYear[year].sort((a, b) => {
        const dateA =
          a.data.shelf === "read" ? a.data.end_date : a.data.watched;
        const dateB =
          b.data.shelf === "read" ? b.data.end_date : b.data.watched;
        return dateA - dateB; // Oldest first
      });
    });

    // Return only 5 most recent years
    return Object.entries(byYear)
      .sort((a, b) => b[0] - a[0]) // Sort by year descending
      .slice(0, 5);
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
