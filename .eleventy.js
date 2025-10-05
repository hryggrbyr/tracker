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
  eleventyConfig.addNunjucksFilter("watched", (x) => {
    const onlyWatched = x.filter(item => item.frontmatter.shelf === "watched");
    
    // Diagnostic: check what the date conversion produces
    console.log("=== DIAGNOSTIC INFO ===");
    console.log("Total watched items:", onlyWatched.length);
    console.log("\nFirst two items date comparison:");
    console.log("Item 1:", onlyWatched[0].frontmatter.title, "watched:", onlyWatched[0].frontmatter.watched);
    console.log("Item 2:", onlyWatched[1].frontmatter.title, "watched:", onlyWatched[1].frontmatter.watched);
    console.log("Date 1:", new Date(onlyWatched[0].frontmatter.watched));
    console.log("Date 2:", new Date(onlyWatched[1].frontmatter.watched));
    console.log("Comparison (date2 - date1):", new Date(onlyWatched[1].frontmatter.watched) - new Date(onlyWatched[0].frontmatter.watched));
    
    // Check for Hop specifically
    const hop = onlyWatched.find(item => item.frontmatter.title === "Hop");
    if (hop) {
        console.log("\nHop found!");
        console.log("Hop watched:", hop.frontmatter.watched);
        console.log("Hop as Date:", new Date(hop.frontmatter.watched));
          // Add this right after finding Hop

    } else {
        console.log("\nHop NOT found in watched items!");
    }

    const sortedWatched = onlyWatched.sort((a, b) => {
        const dateA = new Date(a.frontmatter.watched);
        const dateB = new Date(b.frontmatter.watched);
        const result = dateB - dateA;
        return result;
    });

    const hopIndex = sortedWatched.findIndex(item => item.frontmatter.title === "Hop");
console.log("Hop position in sorted array:", hopIndex);
console.log("Item at position 1:", sortedWatched[1].frontmatter.title, sortedWatched[1].frontmatter.watched);
console.log("Item at position 2:", sortedWatched[2].frontmatter.title, sortedWatched[2].frontmatter.watched);
    
    
    console.log("\nFirst 5 after sort:");
    sortedWatched.slice(0, 5).forEach((item, i) => {
        console.log(`${i+1}. ${item.frontmatter.title} - ${item.frontmatter.watched}`);
    });
    console.log("=== END DIAGNOSTIC ===\n");
    
    const mostRecentFive = sortedWatched.slice(0, 5);
    return mostRecentFive;
});

  eleventyConfig.addPassthroughCopy({
    "./_data/*.json": "api",
  });
  eleventyConfig.addPassthroughCopy("./src/css");
  eleventyConfig.addWatchTarget("./src/css/");

  return {
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dir: {
      input: "src",
      output: "public",
    },
  };
};
