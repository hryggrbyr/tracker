const slugify = require("slugify");
const markdownIt = require("markdown-it");

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

  eleventyConfig.addPassthroughCopy({
    "./_data/*.json": "api",
  });
  eleventyConfig.addPassthroughCopy("./src/css");
  eleventyConfig.addWatchTarget("./src/css/");
  
  const md = markdownIt({
    html: true,
    linkify: true
  });

  // Add a custom rule to transform wikilinks
  md.core.ruler.before('normalize', 'wikilinks', function(state) {
    const wikiLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
    
    state.src = state.src.replace(wikiLinkRegex, (match, target, displayText) => {
      // Replace ../ with /tracker/
      const normalizedPath = target.replace(/^\.\.\//, '/tracker/');
      
      // Slugify the entire filepath using 11ty's slugify
      const slug = eleventyConfig.getFilter("slugify")(normalizedPath);
      
      // Use display text if provided, otherwise use the target
      const linkText = displayText || target.split('/').pop().replace(/\.[^.]+$/, '');
      
      // Return as standard markdown link
      return `[${linkText}](${slug})`;
    });
  });
  
  return {
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
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
