const slugify = require("slugify");

module.exports = {
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
