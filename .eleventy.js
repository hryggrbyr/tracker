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

const humanReadableDate = (value = null, lang = 'en-GB') => {
  const event = value ? new Date(value) : new Date();

  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return event.toLocaleDateString(lang, options);
};

module.exports = function (eleventyConfig) {

  eleventyConfig.addNunjucksFilter('humanReadableDate', humanReadableDate);
  eleventyConfig.addPassthroughCopy("./_data/frontmatter.json");
  eleventyConfig.addPassthroughCopy("./src/css");
  eleventyConfig.addWatchTarget("./src/css/");

  return {
    markdownTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dir: {
      input: "src",
      output: "public",
    },
  };
};